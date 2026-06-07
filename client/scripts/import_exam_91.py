import os
import re
import json
import time
import shutil
import requests
import fitz  # PyMuPDF
import sys
import io
from topik_reading_prompts import get_reading_question_prompt, get_reading_range_instruction
from topik_listening_prompts import get_listening_question_prompt, get_listening_range_instruction

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

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

if not supabase_url or not supabase_key:
    print("[ERROR] Missing Supabase credentials in client/.env!")
    exit(1)

if not deepseek_key:
    print("[ERROR] Missing VITE_DEEPSEEK_API_KEY in client/.env!")
    exit(1)

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

print("[INFO] Supabase Connected to:", supabase_url)

# ─── 2. OFFICIAL ANSWER KEYS FOR KỲ 91 ─────────────────────────────
ANSWERS_91_READING = {
    1: 4, 2: 4, 3: 1, 4: 4, 5: 2, 6: 3, 7: 1, 8: 1, 9: 4, 10: 2,
    11: 3, 12: 2, 13: 2, 14: 3, 15: 2, 16: 1, 17: 3, 18: 1, 19: 3, 20: 1,
    21: 3, 22: 4, 23: 1, 24: 4, 25: 1, 26: 3, 27: 1, 28: 1, 29: 2, 30: 3,
    31: 3, 32: 4, 33: 2, 34: 2, 35: 4, 36: 4, 37: 1, 38: 4, 39: 1, 40: 3,
    41: 3, 42: 2, 43: 1, 44: 3, 45: 4, 46: 2, 47: 2, 48: 4, 49: 2, 50: 4
}

ANSWERS_91_LISTENING = {
    1: 2, 2: 1, 3: 3, 4: 1, 5: 1, 6: 2, 7: 2, 8: 3, 9: 1, 10: 1,
    11: 3, 12: 4, 13: 4, 14: 1, 15: 3, 16: 1, 17: 4, 18: 1, 19: 1, 20: 2,
    21: 2, 22: 3, 23: 4, 24: 3, 25: 2, 26: 4, 27: 4, 28: 1, 29: 4, 30: 4,
    31: 3, 32: 2, 33: 4, 34: 2, 35: 1, 36: 2, 37: 2, 38: 3, 39: 2, 40: 3,
    41: 4, 42: 4, 43: 1, 44: 4, 45: 3, 46: 3, 47: 4, 48: 3, 49: 2, 50: 3
}

ocr_keys = ['K87069638088957', 'K82097704588957', 'K81196164488957', 'K89796403088957']
current_key_idx = 0

# ─── 3. RESUME STATE ────────────────────────────────────────────────
progress_path = os.path.join(script_dir, "ingestion_progress_91.json")
progress = {
    "reading_exam_id": None,
    "listening_exam_id": None,
    "imported_reading_pages": [],
    "imported_listening_pages": []
}

if os.path.exists(progress_path):
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except:
        pass

def save_progress():
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)

# ─── 4. FIND OR CREATE EXAMS ────────────────────────────────────────
def get_or_create_exam(title, category):
    # Check if exists in DB
    res = requests.get(f"{supabase_url}/rest/v1/topik_exams?title=eq.{title}", headers=headers)
    if res.ok:
        data = res.json()
        if data:
            print(f"[INFO] Found existing Exam: '{title}' (ID: {data[0]['id']})")
            return data[0]["id"]
            
    # Create new exam record
    exam_record = {
        "title": title,
        "category": category,
        "level": 2,
        "created_by": "system_pdf_import"
    }
    res = requests.post(f"{supabase_url}/rest/v1/topik_exams", headers=headers, json=exam_record)
    if res.ok:
        data = res.json()
        if data:
            exam_id = data[0]["id"]
            print(f"[NEW] Created Exam in Database: '{title}' (ID: {exam_id})")
            return exam_id
    raise Exception(f"Failed to find or create exam for '{title}': {res.text}")

# ─── 5. OCR FUNCTION WITH KEY ROTATION ──────────────────────────────
def ocr_image(image_path):
    global current_key_idx
    for attempt in range(8):
        key = ocr_keys[current_key_idx]
        try:
            with open(image_path, 'rb') as img_f:
                r = requests.post(
                    'https://api.ocr.space/parse/image',
                    files={'image.jpg': img_f},
                    data={'apikey': key, 'language': 'kor', 'isOverlayRequired': False},
                    timeout=30
                )
            if r.status_code == 429:
                current_key_idx = (current_key_idx + 1) % len(ocr_keys)
                print(f"  [OCR] Key {key} limited (429). Rotating key...")
                time.sleep(3)
                continue
            if r.ok:
                res = r.json()
                if res.get('IsErroredOnProcessing'):
                    err = ' '.join(res.get('ErrorMessage', []))
                    if any(w in err.lower() for w in ['limit', 'exceeded', 'quota']):
                        current_key_idx = (current_key_idx + 1) % len(ocr_keys)
                        print(f"  [OCR] Key quota exceeded. Rotating key...")
                        time.sleep(2)
                        continue
                    print(f'  [OCR ERR] {err}')
                    return None
                results = res.get('ParsedResults', [])
                if results:
                    text = results[0].get('ParsedText', '')
                    print(f'  [OCR OK] Parsed {len(text)} characters')
                    return text
        except Exception as e:
            print(f'  [OCR EXC] {e}')
        time.sleep(3)
    return None

# ─── 6. DEEPSEEK QUESTION PARSER ─────────────────────────────────────
def parse_questions_via_ai(ocr_text, page_num, answers_dict, category):
    system_prompt = (
        "Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp biên soạn đề thi TOPIK II.\n"
        "Nhiệm vụ của bạn là nhận vào văn bản thô kết quả OCR của một trang đề thi và phân tích thành danh sách câu hỏi trắc nghiệm tiếng Hàn chuẩn xác.\n"
        "YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI:\n"
        "1. Hãy phát hiện tất cả số thứ tự câu hỏi xuất hiện trên trang đề thi này từ kết quả OCR (ví dụ câu hỏi số 1, 2, 3...).\n"
        "2. Với mỗi câu hỏi phát hiện được, hãy trích xuất các thông tin sau:\n"
        "   - instructions: Hướng dẫn đề bài chung tiếng Hàn cho câu hỏi đó (ví dụ '[1~2] (...)에 들어갈 말로...').\n"
        "   - passage: Đoạn văn hoặc hộp hội thoại đi kèm (nếu có, nếu không để null).\n"
        "   - question_text: Nội dung câu hỏi cụ thể.\n"
        "   - options: Mảng chứa đúng 4 lựa chọn tiếng Hàn đã được làm sạch lỗi chính tả (không bao gồm ký hiệu số ①, ②, ③, ④).\n"
        "3. CỰC KỲ QUAN TRỌNG: Bạn được cung cấp danh sách đáp án đúng của TOÀN BỘ đề thi:\n"
        f"{str(answers_dict)}\n"
        "Với câu hỏi số Q, đáp án đúng của nó là answers_dict[Q]. Bạn BẮT BUỘC phải đảo các lựa chọn trong mảng 'options' "
        "sao cho phương án đúng nằm chính xác ở vị trí index (answers_dict[Q] - 1) trong mảng 'options'.\n"
        "4. Trường 'explanation' phải dịch nghĩa câu hỏi, giải thích ngữ pháp liên quan và lý do vì sao đáp án đó đúng bằng tiếng Việt.\n"
        "Trả về duy nhất định dạng JSON chứa đối tượng có mảng 'questions', KHÔNG viết markdown code blocks (KHÔNG dùng ```json), KHÔNG giải thích dông dài bên ngoài.\n"
        "Cấu trúc JSON trả về:\n"
        "{\n"
        "  \"questions\": [\n"
        "    {\n"
        "      \"question_number\": 1,\n"
        "      \"instructions\": \"...\",\n"
        "      \"passage\": \"... hoặc null\",\n"
        "      \"question_text\": \"...\",\n"
        "      \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"],\n"
        "      \"explanation\": \"...\"\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    user_prompt = (
        f"Hãy cấu trúc các câu hỏi từ trang đề thi {category} sau:\n"
        f"- Trang số: {page_num}\n"
        f"- Văn bản OCR:\n{ocr_text}"
    )

    for attempt in range(3):
        try:
            r = requests.post("https://api.deepseek.com/chat/completions",
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
                                  "max_tokens": 3000,
                                  "response_format": {"type": "json_object"}
                              },
                              timeout=60)
            if r.ok:
                data = r.json()
                content = data["choices"][0]["message"]["content"].strip()
                
                match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
                if match:
                    content = match.group(1).strip()
                else:
                    start = content.find('{')
                    end = content.rfind('}')
                    if start != -1 and end != -1:
                        content = content[start:end+1]
                
                try:
                    return json.loads(content)
                except Exception as json_err:
                    print(f"    [AI JSON ERROR] Attempt {attempt+1} failed to parse JSON: {json_err}")
            else:
                print(f"[ERROR] DeepSeek API returned code {r.status_code}: {r.text}")
        except Exception as e:
            print(f"[WARN] DeepSeek API Exception for page {page_num} (Attempt {attempt+1}): {e}")
        time.sleep(3.0)
    return None

# ─── 7. CALCULATE AUDIO PATH FOR LISTENING ──────────────────────────
def get_audio_path_for_q(q_num):
    if 1 <= q_num <= 20:
        track_num = q_num + 1
        return f"/topik_exams/ky_91/listening/track_{track_num:02d}.mp3"
    elif 21 <= q_num <= 50:
        track_num = 22 + ((q_num - 21) // 2) * 2
        return f"/topik_exams/ky_91/listening/track_{track_num:02d}.mp3"
    return None

# ─── 8. MAIN PIPELINE ───────────────────────────────────────────────
def main():
    print("=========================================================")
    print("[START] TOPIK II KỲ 91 INGESTION SYSTEM")
    print("=========================================================")
    
    # Destination directories
    public_reading_dir = os.path.join(client_dir, "public", "topik_exams", "ky_91", "reading")
    public_listening_dir = os.path.join(client_dir, "public", "topik_exams", "ky_91", "listening")
    
    # Get or create Exam IDs
    if not progress["reading_exam_id"]:
        progress["reading_exam_id"] = get_or_create_exam("Đề thi chính thức TOPIK II Đọc - Kỳ 91", "reading")
        save_progress()
    reading_exam_id = progress["reading_exam_id"]
    
    if not progress["listening_exam_id"]:
        progress["listening_exam_id"] = get_or_create_exam("Đề thi chính thức TOPIK II Nghe - Kỳ 91", "listening")
        save_progress()
    listening_exam_id = progress["listening_exam_id"]
    
    # --- PROCESS READING EXAM ---
    print("\n>>> PROCESSING READING EXAM...")
    # Page 1 = cover, Page 2 = empty white, Page 3 = instruction, Page 4 = empty white.
    # Questions start from Page 5 to 25 (index 4 to 24).
    for page_num in range(5, 26):
        prog_key = f"page_{page_num:02d}"
        if prog_key in progress["imported_reading_pages"]:
            print(f"  [SKIP] Reading Page {page_num} already imported.")
            continue
            
        print(f"\n--- Reading Page {page_num} / 25 ---")
        img_name = f"page_{page_num:02d}.jpg"
        img_path = os.path.join(public_reading_dir, img_name)
        img_url = f"/topik_exams/ky_91/reading/{img_name}"
        
        # 1. Run OCR
        ocr_text = ocr_image(img_path)
        if not ocr_text or len(ocr_text) < 50:
            print("  [WARN] OCR text too short or empty. Skipping.")
            continue
            
        # 2. Call DeepSeek
        print("  [AI] Structuring reading questions...")
        ai_data = parse_questions_via_ai(ocr_text, page_num, ANSWERS_91_READING, "reading")
        if not ai_data or "questions" not in ai_data:
            print("  [ERROR] AI failed to parse questions.")
            continue
            
        # 3. Save Questions to DB
        prev_instruction = ""
        for q_parsed in ai_data["questions"]:
            q_num = q_parsed.get("question_number")
            if not q_num or q_num not in ANSWERS_91_READING:
                print(f"    [WARN] AI returned invalid question number: {q_num}. Skipping.")
                continue
                
            correct_ans = ANSWERS_91_READING[q_num]
            
            inst = get_reading_range_instruction(q_num)
            prev_instruction = inst or prev_instruction
            q_text = get_reading_question_prompt(q_num)
                
            question_record = {
                "exam_id": reading_exam_id,
                "question_number": q_num,
                "question_type": "reading_dang_general",
                "instructions": inst,
                "passage": q_parsed.get("passage", None),
                "question_text": q_text,
                "options": q_parsed.get("options", []),
                "correct_option": correct_ans,
                "explanation": q_parsed.get("explanation", None),
                "audio_script": img_url # image path for reading
            }
            
            # Upsert
            check_res = requests.get(f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{reading_exam_id}&question_number=eq.{q_num}", headers=headers)
            if check_res.ok and check_res.json():
                q_id = check_res.json()[0]["id"]
                res = requests.patch(f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}", headers=headers, json=question_record)
            else:
                res = requests.post(f"{supabase_url}/rest/v1/topik_exam_questions", headers=headers, json=question_record)
                
            if res.ok:
                print(f"    [SAVE] Saved Reading Question #{q_num}")
            else:
                print(f"    [ERROR] Failed to save Reading Question #{q_num}: {res.text}")
                
        progress["imported_reading_pages"].append(prog_key)
        save_progress()
        time.sleep(1.0)
        
    # --- PROCESS LISTENING EXAM ---
    print("\n>>> PROCESSING LISTENING EXAM...")
    # Listening starts from Page 1 to 26
    for page_num in range(1, 27):
        prog_key = f"page_{page_num:02d}"
        if prog_key in progress["imported_listening_pages"]:
            print(f"  [SKIP] Listening Page {page_num} already imported.")
            continue
            
        print(f"\n--- Listening Page {page_num} / 26 ---")
        img_name = f"page_{page_num:02d}.jpg"
        img_path = os.path.join(public_listening_dir, img_name)
        img_url = f"/topik_exams/ky_91/listening/{img_name}"
        
        # 1. Run OCR
        ocr_text = ocr_image(img_path)
        if not ocr_text or len(ocr_text) < 50:
            print("  [WARN] OCR text too short or empty. Skipping.")
            continue
            
        # 2. Call DeepSeek
        print("  [AI] Structuring listening questions...")
        ai_data = parse_questions_via_ai(ocr_text, page_num, ANSWERS_91_LISTENING, "listening")
        if not ai_data or "questions" not in ai_data:
            print("  [ERROR] AI failed to parse questions.")
            continue
            
        # 3. Save Questions to DB
        prev_instruction = ""
        for q_parsed in ai_data["questions"]:
            q_num = q_parsed.get("question_number")
            if not q_num or q_num not in ANSWERS_91_LISTENING:
                print(f"    [WARN] AI returned invalid question number: {q_num}. Skipping.")
                continue
                
            correct_ans = ANSWERS_91_LISTENING[q_num]
            audio_path = get_audio_path_for_q(q_num)
            
            inst = get_listening_range_instruction(q_num)
            prev_instruction = inst or prev_instruction
            q_text = get_listening_question_prompt(q_num)
            if not q_text:
                q_text = str(q_parsed.get("question_text", "")).strip() or "물음에 알맞은 대답을 고르십시오."
                
            question_record = {
                "exam_id": listening_exam_id,
                "question_number": q_num,
                "question_type": "listening_dang_general",
                "instructions": inst,
                "passage": audio_path,  # Audio file path for listening
                "question_text": q_text,
                "options": q_parsed.get("options", []),
                "correct_option": correct_ans,
                "explanation": q_parsed.get("explanation", None),
                "audio_script": img_url # image path for listening
            }
            
            # Upsert
            check_res = requests.get(f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{listening_exam_id}&question_number=eq.{q_num}", headers=headers)
            if check_res.ok and check_res.json():
                q_id = check_res.json()[0]["id"]
                res = requests.patch(f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}", headers=headers, json=question_record)
            else:
                res = requests.post(f"{supabase_url}/rest/v1/topik_exam_questions", headers=headers, json=question_record)
                
            if res.ok:
                print(f"    [SAVE] Saved Listening Question #{q_num} (Audio: {audio_path})")
            else:
                print(f"    [ERROR] Failed to save Listening Question #{q_num}: {res.text}")
                
        progress["imported_listening_pages"].append(prog_key)
        save_progress()
        time.sleep(1.0)
        
    print("\n=========================================================")
    print("[SUCCESS] TOPIK II KỲ 91 INGESTION COMPLETE!")
    print("=========================================================")

if __name__ == "__main__":
    main()
