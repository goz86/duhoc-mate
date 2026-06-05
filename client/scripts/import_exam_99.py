import os
import re
import json
import time
import shutil
import requests

def safe_str(s):
    if s is None:
        return ""
    return str(s).encode('ascii', errors='ignore').decode('ascii')

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
}

print("[INFO] Supabase Connected to:", safe_str(supabase_url))

# ─── 2. OFFICIAL ANSWER KEY FOR KỲ 99 ──────────────────────────────
ANSWERS_99 = {
    1: 2, 2: 3, 3: 2, 4: 4, 5: 1, 6: 4, 7: 2, 8: 3, 9: 3, 10: 1,
    11: 3, 12: 4, 13: 4, 14: 3, 15: 2, 16: 1, 17: 2, 18: 3, 19: 1, 20: 4,
    21: 2, 22: 4, 23: 1, 24: 3, 25: 2, 26: 1, 27: 2, 28: 3, 29: 4, 30: 3,
    31: 1, 32: 3, 33: 2, 34: 2, 35: 1, 36: 3, 37: 4, 38: 1, 39: 4, 40: 3,
    41: 2, 42: 2, 43: 4, 44: 1, 45: 3, 46: 4, 47: 1, 48: 4, 49: 4, 50: 3
}

# ─── 3. RESUME STATE ────────────────────────────────────────────────
progress_path = os.path.join(script_dir, "ingestion_progress_99.json")
progress = {"created_exam_id": None, "imported_pages": []}

if os.path.exists(progress_path):
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except:
        pass

def save_progress():
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)

# ─── 4. FIND OR CREATE EXAM ─────────────────────────────────────────
def find_or_create_exam():
    if progress["created_exam_id"]:
        return progress["created_exam_id"]
        
    title = "De thi chinh thuc TOPIK II Doc - Ky 99"
    # Check if exists in DB
    res = requests.get(f"{supabase_url}/rest/v1/topik_exams?title=eq.{title}", headers=headers)
    if res.ok:
        data = res.json()
        if data:
            progress["created_exam_id"] = data[0]["id"]
            save_progress()
            return data[0]["id"]
            
    # Create new exam record
    exam_record = {
        "title": title,
        "category": "reading",
        "level": 2,
        "created_by": "system_pdf_import"
    }
    res = requests.post(f"{supabase_url}/rest/v1/topik_exams", headers={**headers, "Prefer": "return=representation"}, json=exam_record)
    if res.ok:
        data = res.json()
        if data:
            exam_id = data[0]["id"]
            progress["created_exam_id"] = exam_id
            save_progress()
            print(f"[NEW] Created Exam in Database: '{title}'")
            return exam_id
    raise Exception(f"Failed to find or create exam for Ky 99: {res.text}")

# ─── 5. DEEPSEEK QUESTION PARSER ─────────────────────────────────────
def parse_page_questions(ocr_text, page_num):
    system_prompt = (
        "Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp biên soạn đề thi TOPIK II đọc hiểu.\n"
        "Nhiệm vụ của bạn là nhận vào văn bản thô kết quả OCR của một trang đề thi và phân tích thành danh sách câu hỏi trắc nghiệm tiếng Hàn chuẩn xác.\n"
        "YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI:\n"
        "1. Hãy phát hiện tất cả số thứ tự câu hỏi xuất hiện trên trang đề thi này từ kết quả OCR (ví dụ câu hỏi số 1, 2, 3...).\n"
        "2. Với mỗi câu hỏi phát hiện được, hãy trích xuất các thông tin sau:\n"
        "   - instructions: Hướng dẫn đề bài chung tiếng Hàn cho câu hỏi đó (ví dụ '[1~2] (...)에 들어갈 말로...').\n"
        "   - passage: Đoạn văn hoặc hộp hội thoại đi kèm (nếu có, nếu không để null).\n"
        "   - question_text: Nội dung câu hỏi cụ thể.\n"
        "   - options: Mảng chứa đúng 4 lựa chọn tiếng Hàn đã được làm sạch lỗi chính tả (không bao gồm ký hiệu số ①, ②, ③, ④).\n"
        "3. CỰC KỲ QUAN TRỌNG: Bạn được cung cấp danh sách đáp án đúng của TOÀN BỘ đề thi:\n"
        f"{str(ANSWERS_99)}\n"
        "Với câu hỏi số Q, đáp án đúng của nó là ANSWERS_99[Q]. Bạn BẮT BUỘC phải đảo các lựa chọn trong mảng 'options' "
        "sao cho phương án đúng nằm chính xác ở vị trí index (ANSWERS_99[Q] - 1) trong mảng 'options'.\n"
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
        f"Hãy cấu trúc các câu hỏi từ trang đề thi sau:\n"
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
                
                # Robust extraction between first '{' and last '}'
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
                    print(f"    [AI JSON ERROR] Attempt {attempt+1} failed to parse JSON: {safe_str(json_err)}")
            else:
                print(f"[ERROR] DeepSeek API returned code {r.status_code}: {safe_str(r.text)}")
        except Exception as e:
            print(f"[WARN] DeepSeek API Exception for page {page_num} (Attempt {attempt+1}):", safe_str(e))
        time.sleep(3.0)
    return None

# ─── 6. MAIN PIPELINE ───────────────────────────────────────────────
def main():
    print("=========================================================")
    print("[START] KY 99 EXAM INGESTION SYSTEM")
    print("=========================================================")
    
    exam_id = find_or_create_exam()
    
    scratch_ocr_dir = r"C:\Users\junwi\.gemini\antigravity-ide\brain\194d5860-114d-4411-9fd5-442360c86d28\scratch\exam99_ocr"
    scratch_img_dir = r"C:\Users\junwi\.gemini\antigravity-ide\brain\194d5860-114d-4411-9fd5-442360c86d28\scratch\exam99_images"
    public_exams_dir = os.path.join(client_dir, "public", "topik_exams")
    os.makedirs(public_exams_dir, exist_ok=True)
    
    # Process pages 1 to 19 (which contain the questions)
    for page_num in range(1, 20):
        prog_key = f"page_{page_num:02d}"
        if prog_key in progress["imported_pages"]:
            print(f"  [SKIP] Page {page_num} already imported. Skipping.")
            continue
            
        print(f"\n--- Processing Page {page_num} / 19 ---")
        
        # 1. Copy page image to client public folder
        src_img = os.path.join(scratch_img_dir, f"page_{page_num:02d}.jpg")
        dst_img = os.path.join(public_exams_dir, f"ky_99_page_{page_num:02d}.jpg")
        if os.path.exists(src_img):
            shutil.copy(src_img, dst_img)
            print(f"  [IMAGE] Copied image to public/topik_exams/ky_99_page_{page_num:02d}.jpg")
        else:
            print(f"  [WARN] Source image not found at {src_img}")
            
        # 2. Read OCR text
        ocr_file = os.path.join(scratch_ocr_dir, f"page_{page_num:02d}.txt")
        if not os.path.exists(ocr_file):
            print(f"  [ERROR] OCR file not found: {ocr_file}. Please ensure OCR task is complete.")
            continue
            
        with open(ocr_file, "r", encoding="utf-8") as f:
            ocr_text = f.read().strip()
            
        if not ocr_text:
            print("  [WARN] OCR text is empty. Skipping.")
            continue
            
        # 3. Call AI to structure questions
        print("  [AI] Structuring questions through DeepSeek...")
        ai_data = parse_page_questions(ocr_text, page_num)
        if not ai_data or "questions" not in ai_data:
            print("  [ERROR] DeepSeek failed to return structured questions.")
            continue
            
        # 4. Save to database
        prev_instruction = ""
        for q_parsed in ai_data["questions"]:
            q_num = q_parsed.get("question_number")
            if not q_num or q_num not in ANSWERS_99:
                print(f"    [WARN] AI returned invalid question number: {q_num}. Skipping.")
                continue
                
            correct_ans = ANSWERS_99[q_num]
            img_url = f"/topik_exams/ky_99_page_{page_num:02d}.jpg"
            
            inst = q_parsed.get("instructions", "")
            if not inst or not str(inst).strip():
                inst = prev_instruction or "다음을 읽고 물음에 답하십시오."
            else:
                inst = str(inst).strip()
                prev_instruction = inst
                
            q_text = q_parsed.get("question_text", "")
            if not q_text or not str(q_text).strip():
                q_text = "( )에 들어갈 가장 알맞은 것을 고르십시오."
            else:
                q_text = str(q_text).strip()
            
            question_record = {
                "exam_id": exam_id,
                "question_number": q_num,
                "question_type": f"reading_dang_general", # or general category
                "instructions": inst,
                "passage": q_parsed.get("passage", None),
                "question_text": q_text,
                "options": q_parsed.get("options", []),
                "correct_option": correct_ans,
                "explanation": q_parsed.get("explanation", None),
                "audio_script": img_url # image path goes here
            }
            
            # Upsert into database
            check_res = requests.get(f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&question_number=eq.{q_num}", headers=headers)
            if check_res.ok and check_res.json():
                q_id = check_res.json()[0]["id"]
                res = requests.patch(f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}", headers=headers, json=question_record)
            else:
                res = requests.post(f"{supabase_url}/rest/v1/topik_exam_questions", headers=headers, json=question_record)
                
            if res.ok:
                print(f"    [SAVE] Successfully saved Question #{q_num} in Supabase!")
            else:
                print(f"    [ERROR] Failed to save Question #{q_num} in Supabase: {safe_str(res.text)}")
                
        progress["imported_pages"].append(prog_key)
        save_progress()
        time.sleep(1.0)
        
    print("\n=========================================================")
    print("[SUCCESS] EXAM 99 INGESTION COMPLETE!")
    print("=========================================================")

if __name__ == "__main__":
    main()
