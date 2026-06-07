import os
import re
import json
import time
import requests
import sys
import difflib

sys.stdout.reconfigure(encoding='utf-8')

# ─── 1. LOAD CONFIGURATION FROM .ENV ────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
client_dir = os.path.dirname(script_dir)
env_path = os.path.join(client_dir, ".env")

if not os.path.exists(env_path):
    print("[ERROR] client/.env file not found!")
    exit(1)

supabase_url = None
supabase_key = None
deepseek_key = None
ocr_space_key = 'K87069638088957'

with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip()
            if k == "VITE_SUPABASE_URL":
                supabase_url = v
            elif k == "VITE_SUPABASE_ANON_KEY":
                supabase_key = v
            elif k == "VITE_DEEPSEEK_API_KEY":
                deepseek_key = v
            elif k == "VITE_OCR_SPACE_API_KEY":
                ocr_space_key = v

if not supabase_url or not supabase_key:
    print("[ERROR] Missing Supabase credentials in client/.env!")
    exit(1)

# Default DeepSeek API key if not in env
if not deepseek_key:
    deepseek_key = 'sk-277f833961b6420fa28165c77dc92a71'

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
}

print(f"[INFO] Supabase URL: {supabase_url}")
print(f"[INFO] DeepSeek Key Loaded: {'Yes' if deepseek_key else 'No'}")
print(f"[INFO] OCR Space Key Loaded: {'Yes' if ocr_space_key else 'No'}")

# ─── 2. RESUME STATE MECHANISM ──────────────────────────────────────
progress_path = os.path.join(script_dir, "fix_options_91_progress.json")
progress = {"verified_questions": [], "errors": []}

if os.path.exists(progress_path):
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except:
        pass

def save_progress():
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)

# ─── 3. OCR SPACE API CALL WITH OVERLAY COORDINATES ────────────────
ocr_keys = [ocr_space_key, 'K87069638088957', 'K82097704588957', 'K81196164488957', 'K89796403088957']
# Remove duplicates
ocr_keys = list(dict.fromkeys(filter(None, ocr_keys)))
current_key_idx = 0

ocr_cache_path = os.path.join(script_dir, "ocr_cache_91.json")
ocr_cache = {}
if os.path.exists(ocr_cache_path):
    try:
        with open(ocr_cache_path, "r", encoding="utf-8") as f:
            ocr_cache = json.load(f)
    except:
        pass

def save_ocr_cache():
    with open(ocr_cache_path, "w", encoding="utf-8") as f:
        json.dump(ocr_cache, f, indent=2)

def perform_ocr_with_overlay(image_path, cache_key):
    global current_key_idx
    if cache_key in ocr_cache:
        print(f"  [OCR] Using cached OCR results for {cache_key}")
        return ocr_cache[cache_key]

    print(f"  [OCR] Uploading {os.path.basename(image_path)} to OCR Space...")
    
    for attempt in range(6):
        key = ocr_keys[current_key_idx]
        payload = {
            'apikey': key,
            'language': 'kor',
            'isOverlayRequired': True
        }
        try:
            with open(image_path, 'rb') as img_f:
                r = requests.post(
                    'https://api.ocr.space/parse/image',
                    files={'image.jpg': img_f},
                    data=payload,
                    timeout=30
                )
            if r.status_code == 429:
                print(f"    [OCR 429] Rate limit hit on key {key[:5]}... Switching key.")
                current_key_idx = (current_key_idx + 1) % len(ocr_keys)
                time.sleep(2)
                continue
            if r.ok:
                res = r.json()
                if "error" in res:
                    print(f"    [OCR ERROR] JSON error: {res['error']}")
                elif res.get("IsErroredOnProcessing"):
                    err_msg = res.get("ErrorMessage", ["Unknown error"])
                    print(f"    [OCR ERRORED ON PROCESSING] {err_msg}")
                    err_str = " ".join(err_msg).lower()
                    if "limit" in err_str or "exceeded" in err_str or "allowed" in err_str or "active subscription" in err_str:
                        print(f"    [OCR LIMIT DETECTED] Switching key from {key[:5]}...")
                        current_key_idx = (current_key_idx + 1) % len(ocr_keys)
                        time.sleep(2)
                        continue
                else:
                    parsed_results = res.get("ParsedResults", [])
                    if parsed_results:
                        overlay = parsed_results[0].get("TextOverlay", {})
                        lines_data = []
                        for line in overlay.get("Lines", []):
                            text = line.get("LineText", "").strip()
                            words = line.get("Words", [])
                            if words:
                                top = min([w.get("Top", 0) for w in words])
                                left = min([w.get("Left", 0) for w in words])
                                lines_data.append({"text": text, "top": top, "left": left, "words": words})
                        
                        # Cache the result
                        ocr_cache[cache_key] = lines_data
                        save_ocr_cache()
                        return lines_data
            else:
                print(f"    [OCR HTTP ERROR] Status {r.status_code}: {r.text}")
        except Exception as e:
            print(f"    [OCR EXCEPTION] Attempt {attempt+1}: {e}")
        time.sleep(3)
    return None

# ─── 4. ALIGNMENT ALGORITHM ─────────────────────────────────────────
def clean_text(text):
    return re.sub(r'[^가-힣a-zA-Z0-9]', '', text)

def find_matching_ocr_line(opt_text, ocr_lines, y_min=None, y_max=None):
    cleaned_opt = clean_text(opt_text)
    if not cleaned_opt:
        return None
    
    # Filter ocr lines by vertical coordinates first
    filtered_lines = []
    for line in ocr_lines:
        top = line["top"]
        if y_min is not None and top < y_min:
            continue
        if y_max is not None and top > y_max:
            continue
        filtered_lines.append(line)

    if not filtered_lines:
        # Fallback to unfiltered if none matched coordinates, just in case
        filtered_lines = ocr_lines

    best_match = None
    best_score = 0.0
    
    for line in filtered_lines:
        cleaned_line = clean_text(line["text"])
        if not cleaned_line:
            continue
            
        # Substring exact check
        if cleaned_opt in cleaned_line or cleaned_line in cleaned_opt:
            words = line.get("words", [])
            if words:
                best_word = None
                best_word_score = 0.0
                for w in words:
                    cleaned_w = clean_text(w.get("WordText", ""))
                    if not cleaned_w:
                        continue
                    if cleaned_opt in cleaned_w or cleaned_w in cleaned_opt:
                        best_word = w
                        break
                    score = difflib.SequenceMatcher(None, cleaned_opt, cleaned_w).ratio()
                    if score > best_word_score:
                        best_word_score = score
                        best_word = w
                
                if best_word:
                    top = best_word.get("Top", line["top"])
                    left = best_word.get("Left", line["left"])
                    return {"text": line["text"], "top": top, "left": left}
            return line
            
        # Fuzzy match
        score = difflib.SequenceMatcher(None, cleaned_opt, cleaned_line).ratio()
        if score > best_score:
            best_score = score
            best_match = line
            
    if best_score > 0.5:
        line = best_match
        words = line.get("words", [])
        if words:
            best_word = None
            best_word_score = 0.0
            for w in words:
                cleaned_w = clean_text(w.get("WordText", ""))
                if not cleaned_w:
                    continue
                score = difflib.SequenceMatcher(None, cleaned_opt, cleaned_w).ratio()
                if score > best_word_score:
                    best_word_score = score
                    best_word = w
            if best_word_score > 0.5:
                top = best_word.get("Top", line["top"])
                left = best_word.get("Left", line["left"])
                return {"text": line["text"], "top": top, "left": left}
        return line
    return None

def sort_options_by_coordinates(options_with_coords):
    items = [x for x in options_with_coords if x.get("top") is not None and x.get("left") is not None]
    if len(items) != len(options_with_coords):
        items = options_with_coords

    if len(items) == 4:
        top_span = max(x["top"] for x in items) - min(x["top"] for x in items)
        left_span = max(x["left"] for x in items) - min(x["left"] for x in items)

        # 1-line horizontal layout: ① ② ③ ④
        if top_span <= 35:
            return [x["text"] for x in sorted(items, key=lambda x: x["left"])]

        # 1-column vertical layout: ① / ② / ③ / ④
        if left_span <= 90:
            return [x["text"] for x in sorted(items, key=lambda x: x["top"])]

        # 2x2 layout: ① ② / ③ ④. Split at the largest vertical gap.
        by_top = sorted(items, key=lambda x: x["top"])
        gaps = [by_top[i + 1]["top"] - by_top[i]["top"] for i in range(3)]
        split_at = gaps.index(max(gaps)) + 1
        first_row = by_top[:split_at]
        second_row = by_top[split_at:]
        if len(first_row) == 2 and len(second_row) == 2 and max(gaps) >= 25:
            return [
                x["text"]
                for row in (first_row, second_row)
                for x in sorted(row, key=lambda item: item["left"])
            ]

    sorted_by_top = sorted(items, key=lambda x: x["top"])
    rows = []
    for item in sorted_by_top:
        placed = False
        for row in rows:
            row_top = sum(x["top"] for x in row) / len(row)
            if abs(item["top"] - row_top) <= 35:
                row.append(item)
                placed = True
                break
        if not placed:
            rows.append([item])

    final_sorted = []
    for row in sorted(rows, key=lambda r: sum(x["top"] for x in r) / len(r)):
        final_sorted.extend(sorted(row, key=lambda x: x["left"]))

    return [x["text"] for x in final_sorted]

# ─── 5. DEEPSEEK VERIFICATION STEP ──────────────────────────────────
def ai_verify_correct_option(question_text, instructions, passage, options, correct_option):
    system_prompt = (
        "Bạn là chuyên gia khảo thí TOPIK II tiếng Hàn.\n"
        "Nhiệm vụ: Xác minh xem chỉ số 'correct_option' (1 đến 4) trong mảng 'options' được cung cấp có thực sự là đáp án đúng ngữ pháp và ngữ cảnh hay không.\n"
        "Trả về JSON: {\"is_correct\": true/false, \"correct_index\": <chỉ số đúng từ 1 đến 4>, \"explanation\": \"giải thích ngắn gọn bằng tiếng Việt\"}"
    )
    
    opts_str = "\n".join([f"  {i+1}. {o}" for i, o in enumerate(options)])
    user_prompt = (
        f"Câu hỏi: {question_text}\n"
        f"Đoạn văn: {passage or 'Không có'}\n"
        f"Yêu cầu: {instructions or 'Điền vào chỗ trống'}\n"
        f"Các phương án:\n{opts_str}\n"
        f"Chỉ số đang chọn làm đáp án đúng: {correct_option} (tức là: '{options[correct_option-1]}')"
    )

    for attempt in range(3):
        try:
            r = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {deepseek_key}"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 500,
                    "response_format": {"type": "json_object"}
                },
                timeout=30
            )
            if r.ok:
                data = r.json()
                content = data["choices"][0]["message"]["content"].strip()
                parsed = json.loads(content)
                return parsed
        except Exception as e:
            print(f"    [AI EXCEPTION] Attempt {attempt+1}: {e}")
        time.sleep(2)
    return None

# ─── 6. MAIN LOGIC ──────────────────────────────────────────────────
def main():
    dry_run = "--dry-run" in sys.argv
    no_ai = "--no-ai" in sys.argv
    target_section = None # 'reading' or 'listening'
    for arg in sys.argv:
        if arg == "--reading":
            target_section = "reading"
        elif arg == "--listening":
            target_section = "listening"

    # Load progress to get exam IDs
    progress_file = os.path.join(client_dir, "scripts", "ingestion_progress_91.json")
    if not os.path.exists(progress_file):
        print(f"[ERROR] Missing ingestion progress file at {progress_file}")
        exit(1)
        
    with open(progress_file, "r", encoding="utf-8") as f:
        prog_data = json.load(f)
        
    reading_exam_id = prog_data.get("reading_exam_id")
    listening_exam_id = prog_data.get("listening_exam_id")
    
    if not reading_exam_id or not listening_exam_id:
        print("[ERROR] missing reading_exam_id or listening_exam_id in progress file")
        exit(1)

    # Load maps
    reading_map_path = os.path.join(client_dir, "scripts", "topik91_reading_clean_map.json")
    listening_map_path = os.path.join(client_dir, "scripts", "topik91_listening_clean_map.json")
    
    reading_map = {}
    listening_map = {}
    
    if os.path.exists(reading_map_path):
        with open(reading_map_path, "r", encoding="utf-8") as f:
            reading_map = json.load(f)
            
    if os.path.exists(listening_map_path):
        with open(listening_map_path, "r", encoding="utf-8") as f:
            listening_map = json.load(f)

    sections_to_run = []
    if target_section:
        sections_to_run = [target_section]
    else:
        sections_to_run = ["reading", "listening"]

    print("=" * 60)
    print(f"TOPIK II Kỳ 91 SCRAMBLED OPTIONS REPAIR SYSTEM {'(DRY RUN)' if dry_run else ''}")
    print("=" * 60)

    for sec in sections_to_run:
        exam_id = reading_exam_id if sec == "reading" else listening_exam_id
        q_map = reading_map.get("questions", {}) if sec == "reading" else listening_map.get("questions", {})
        
        print(f"\n>>> PROCESSING SECTION: {sec.upper()} (Exam ID: {exam_id})")
        
        # Fetch questions from Supabase for this exam
        url_query = f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&select=id,question_number,question_text,options,correct_option,audio_script,question_type,passage,instructions&order=question_number.asc"
        res = requests.get(url_query, headers=headers, timeout=30)
        if not res.ok:
            print(f"[ERROR] Failed to fetch questions for {sec}: {res.text}")
            continue
            
        questions = res.json()
        print(f"[INFO] Loaded {len(questions)} questions from DB.")

        total_fixed = 0
        total_checked = 0

        for q in questions:
            q_id = q["id"]
            q_num = q["question_number"]
            current_options = q.get("options", [])
            current_correct = q.get("correct_option")
            q_text = q.get("question_text", "")
            passage = q.get("passage", "")
            instructions = q.get("instructions", "")
            q_key = f"{sec}_{q_id}"

            if q_key in progress["verified_questions"]:
                print(f"  Q#{q_num}: [SKIP] Already processed.")
                continue

            if not current_options or len(current_options) < 4:
                print(f"  Q#{q_num}: [SKIP] Incomplete options: {current_options}")
                continue

            # Identify the original page and coordinate limits from map
            q_str = str(q_num)
            if q_str not in q_map:
                print(f"  Q#{q_num}: [WARN] Not found in map JSON. Skipping.")
                continue
                
            q_info = q_map[q_str]
            pieces = q_info.get("pieces", [])
            if not pieces:
                print(f"  Q#{q_num}: [WARN] No pieces in map JSON. Skipping.")
                continue
                
            # Get the page number (usually first piece is enough)
            page_num = pieces[0]["page"]
            
            # Locate the original page image path
            orig_page_img = os.path.join(client_dir, "public", "topik_exams", "ky_91", sec, f"page_{page_num:02d}.jpg")
            if not os.path.exists(orig_page_img):
                print(f"  Q#{q_num}: [ERROR] Original page image not found at {orig_page_img}. Skipping.")
                continue

            # Determine Y limits to constrain OCR line matching
            y_min = min(p["y1"] for p in pieces) - 100
            y_max = max(p["y2"] for p in pieces) + 650  # broad range below questions

            print(f"\n  Q#{q_num} (Page: {page_num}, Y limits: [{y_min}, {y_max}]):")
            print(f"    Current Options: {current_options}")
            print(f"    Current correct_option: {current_correct} -> [{current_options[current_correct-1]}]")

            # Perform/Get OCR for this original page
            cache_key = f"{sec}_page_{page_num}"
            ocr_lines = perform_ocr_with_overlay(orig_page_img, cache_key)
            if not ocr_lines:
                print("    [ERROR] OCR failed for page image. Skipping question.")
                if q_key not in progress["errors"]:
                    progress["errors"].append(q_key)
                save_progress()
                continue

            # Match options to OCR lines
            options_with_coords = []
            matching_failed = False
            for opt in current_options:
                matched_line = find_matching_ocr_line(opt, ocr_lines, y_min=y_min, y_max=y_max)
                if matched_line:
                    options_with_coords.append({
                        "text": opt,
                        "top": matched_line["top"],
                        "left": matched_line["left"]
                    })
                else:
                    print(f"    [WARN] Could not find OCR line matching option text: '{opt}'")
                    matching_failed = True
                    break

            if matching_failed:
                print(f"    [ERROR] Skipping Q#{q_num} due to OCR matching failure.")
                if q_key not in progress["errors"]:
                    progress["errors"].append(q_key)
                save_progress()
                continue

            # Sort by coordinates
            sorted_options = sort_options_by_coordinates(options_with_coords)
            print(f"    Sorted Options (PDF order): {sorted_options}")

            # Calculate correct index mathematically by matching the original correct option text
            original_correct_text = current_options[current_correct - 1]
            try:
                correct_index = sorted_options.index(original_correct_text) + 1
            except ValueError:
                correct_index = current_correct
                print(f"    [WARN] Could not find original correct option '{original_correct_text}' in sorted options. Using fallback.")

            # AI only generates the explanation in Vietnamese for the determined correct option
            if no_ai:
                explanation = q.get("explanation", "")
            else:
                print(f"    [AI] Generating Vietnamese explanation for option {correct_index}...")
                explanation_prompt = (
                    "Bạn là chuyên gia giảng dạy và khảo thí TOPIK II tiếng Hàn.\n"
                    f"Câu hỏi: {q_text}\n"
                    f"Đoạn văn: {passage or 'Không có'}\n"
                    f"Yêu cầu: {instructions or 'Chọn đáp án đúng'}\n"
                    f"Các phương án:\n" + "\n".join([f"  {i+1}. {o}" for i, o in enumerate(sorted_options)]) + "\n"
                    f"Đáp án đúng là: {correct_index}. {sorted_options[correct_index-1]}\n"
                    "Hãy giải thích ngắn gọn bằng tiếng Việt (1-3 câu) lý do tại sao phương án này là đáp án đúng cho câu hỏi.\n"
                    "Trả về JSON dạng: {\"explanation\": \"nội dung giải thích\"}"
                )
                
                explanation = ""
                for attempt in range(3):
                    try:
                        r = requests.post(
                            "https://api.deepseek.com/chat/completions",
                            headers={
                                "Content-Type": "application/json",
                                "Authorization": f"Bearer {deepseek_key}"
                            },
                            json={
                                "model": "deepseek-chat",
                                "messages": [
                                    {"role": "user", "content": explanation_prompt}
                                ],
                                "temperature": 0.3,
                                "max_tokens": 300,
                                "response_format": {"type": "json_object"}
                            },
                            timeout=25
                        )
                        if r.ok:
                            res_data = r.json()
                            content = res_data["choices"][0]["message"]["content"].strip()
                            parsed = json.loads(content)
                            explanation = parsed.get("explanation", "")
                            break
                    except Exception as e:
                        print(f"      [AI ERROR] Attempt {attempt+1}: {e}")
                        time.sleep(1)

            print(f"    Alignment check: correct_index updated mathematically to {correct_index} -> [{sorted_options[correct_index-1]}]")
            if not no_ai:
                print(f"    AI Explanation: {explanation}")

            # Update database
            options_changed = sorted_options != current_options
            correct_changed = correct_index != current_correct

            save_success = True
            if not options_changed and not correct_changed:
                print("    [OK] No changes needed. Already aligned.")
            else:
                total_fixed += 1
                if options_changed:
                    print("    [REORDER] Options sorted to match PDF layout.")
                if correct_changed:
                    print(f"    [CORRECT] Correct index updated from {current_correct} to {correct_index}.")

                if not dry_run:
                    update_data = {
                        "options": sorted_options,
                        "correct_option": correct_index
                    }
                    if not no_ai:
                        update_data["explanation"] = explanation
                    
                    headers_prefer = headers.copy()
                    headers_prefer["Prefer"] = "return=representation"
                    up_res = requests.patch(
                        f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}",
                        headers=headers_prefer,
                        json=update_data,
                        timeout=15
                    )
                    if up_res.ok:
                        rep_data = up_res.json()
                        if rep_data:
                            print("    [SAVE] Successfully updated question in database!")
                        else:
                            print("    [SAVE ERROR] Failed to update: 0 rows affected!")
                            save_success = False
                    else:
                        print(f"    [SAVE ERROR] Failed to update Supabase: {up_res.status_code} {up_res.text}")
                        save_success = False

            total_checked += 1

            if not dry_run:
                if save_success:
                    if q_key not in progress["verified_questions"]:
                        progress["verified_questions"].append(q_key)
                    if q_key in progress["errors"]:
                        progress["errors"].remove(q_key)
                else:
                    if q_key not in progress["errors"]:
                        progress["errors"].append(q_key)
                save_progress()
            
            time.sleep(1)

        print("\n" + "=" * 60)
        print(f"SECTION {sec.upper()} SUMMARY")
        print(f"  Total Checked: {total_checked}")
        print(f"  Total Fixed: {total_fixed}")
        print("=" * 60)

    print("\n" + "=" * 60)
    print("GLOBAL REPAIR SUMMARY")
    print(f"  Verified Database Qs: {len(progress['verified_questions'])}")
    print(f"  Errored Qs: {len(progress['errors'])}")
    print("=" * 60)

if __name__ == "__main__":
    main()
