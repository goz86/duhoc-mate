import os
import re
import json
import time
import requests
import io
from PIL import Image
from pypdf import PdfReader

def safe_str(s):
    """Safely converts any string to pure ASCII for console print safety under Windows CP949."""
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
ocr_space_key = "helloworld"

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

if not deepseek_key:
    print("[ERROR] Missing VITE_DEEPSEEK_API_KEY in client/.env!")
    exit(1)

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
}

print("[INFO] Supabase Connected to:", safe_str(supabase_url))
print("[INFO] OCR.space API Key configured as:", "helloworld (fallback)" if ocr_space_key == "helloworld" else "User private key")

# ─── 2. LOAD ANSWER KEYS ────────────────────────────────────────────
answers_json_path = r"C:\Users\junwi\.gemini\antigravity-ide\brain\9e008c83-115a-43d3-a990-b81681838822\scratch\parsed_answers.json"
if not os.path.exists(answers_json_path):
    print("[ERROR] parsed_answers.json not found!")
    exit(1)

with open(answers_json_path, "r", encoding="utf-8") as f:
    ans_keys = json.load(f)

# TOPIK sessions index mapping
sessions = [35, 36, 37, 41, 47, 52, 60, 64]

def get_correct_option(dang, ky, q_num):
    # Find block
    block = ans_keys.get(dang)
    if not block:
        return None
    ans_map = block.get("answers", {})
    ans_list = ans_map.get(str(q_num))
    if not ans_list:
        return None
    try:
        ky_idx = sessions.index(int(ky))
        return ans_list[ky_idx]
    except (ValueError, IndexError):
        return None

# ─── 3. RESUME STATE MECHANISM ──────────────────────────────────────
progress_path = r"C:\Users\junwi\.gemini\antigravity-ide\brain\9e008c83-115a-43d3-a990-b81681838822\scratch\ingestion_progress.json"
progress = {"created_exams": {}, "imported_questions": []}

if os.path.exists(progress_path):
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except:
        pass

def save_progress():
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)

# ─── 4. DATABASE HELPERS ────────────────────────────────────────────
def find_or_create_exam(ky):
    ky_str = str(ky)
    if ky_str in progress["created_exams"]:
        return progress["created_exams"][ky_str]
        
    title = f"Đề thi chính thức TOPIK II Đọc - Kỳ {ky}"
    # Check if exists in db
    res = requests.get(f"{supabase_url}/rest/v1/topik_exams?title=eq.{title}", headers=headers)
    if res.ok:
        data = res.json()
        if data:
            progress["created_exams"][ky_str] = data[0]["id"]
            save_progress()
            return data[0]["id"]
            
    # Create new exam
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
            progress["created_exams"][ky_str] = exam_id
            save_progress()
            print(f"[NEW] Created Exam in Database: '{safe_str(title)}'")
            return exam_id
    raise Exception(f"Failed to find or create exam for Ky {ky}: {res.text}")

# ─── 5. OCR & AI PIPELINE ───────────────────────────────────────────
def extract_largest_image(page):
    largest_img = None
    max_size = 0
    for img_obj in page.images:
        size = len(img_obj.data)
        if size > max_size:
            max_size = size
            largest_img = img_obj.data
    return largest_img

def perform_ocr(image_data):
    try:
        img = Image.open(io.BytesIO(image_data))
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            background = Image.new("RGBA", img.size, (255, 255, 255, 255))
            background.paste(img, (0, 0), img)
            img = background.convert("RGB")
        else:
            img = img.convert("RGB")
        out_buf = io.BytesIO()
        img.save(out_buf, format="JPEG", quality=90)
        image_data = out_buf.getvalue()
    except Exception as e:
        print("[WARN] Image flattening failed:", safe_str(e))

    payload = {
        'apikey': ocr_space_key,
        'language': 'kor',
        'isOverlayRequired': False
    }
    try:
        r = requests.post('https://api.ocr.space/parse/image',
                          files={'image.jpg': image_data},
                          data=payload,
                          timeout=15)
        if r.ok:
            res = r.json()
            if not res.get("IsErroredOnProcessing"):
                parsed_results = res.get("ParsedResults", [])
                if parsed_results:
                    return parsed_results[0].get("ParsedText", "").strip()
    except Exception as e:
        print("[WARN] OCR Call Exception:", safe_str(e))
    return ""


def process_question_with_ai(ocr_text, dang, ky, q_num, correct_ans):
    system_prompt = (
        "Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp biên soạn đề thi TOPIK II đọc hiểu.\n"
        "Nhiệm vụ của bạn là nhận vào văn bản thô kết quả OCR và cấu trúc lại thành câu hỏi trắc nghiệm tiếng Hàn chuẩn xác.\n"
        "YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI:\n"
        "1. Trích xuất duy nhất nội dung câu hỏi số " + str(q_num) + " từ kết quả OCR.\n"
        "2. Sửa toàn bộ lỗi chính tả tiếng Hàn và ký hiệu trắc nghiệm bị nhận diện sai (ví dụ ㉦, ㉩, ㉭... phải thành các lựa chọn đúng chuẩn).\n"
        "3. Mảng 'options' bắt buộc phải chứa đúng 4 lựa chọn tiếng Hàn (không bao gồm ký hiệu số ①, ②, ③, ④).\n"
        "4. CỰC KỲ QUAN TRỌNG: Bạn được cung cấp đáp án đúng là phương án số " + str(correct_ans) + " (từ 1 đến 4). Bạn phải sắp xếp sao cho câu trả lời đúng nằm chính xác ở vị trí index " + str(correct_ans - 1) + " trong mảng 'options'.\n"
        "5. Điền thông tin hướng dẫn đề bài (instructions), ví dụ: '[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'\n"
        "6. Nếu câu hỏi có đoạn văn đi kèm (passage), trích xuất toàn bộ đoạn văn đó vào trường 'passage'. Nếu không có, để null.\n"
        "7. Trường 'explanation' phải dịch nghĩa chi tiết câu hỏi, giải thích ngữ pháp liên quan và lý do vì sao đáp án đó đúng bằng tiếng Việt.\n"
        "Trả về JSON duy nhất, KHÔNG viết markdown code blocks (KHÔNG dùng ```json), KHÔNG giải thích dông dài bên ngoài."
    )
    
    user_prompt = (
        f"Hãy cấu trúc câu hỏi sau:\n"
        f"- Dạng câu hỏi: {dang}\n"
        f"- Kỳ thi TOPIK: {ky}\n"
        f"- Câu số: {q_num}\n"
        f"- Chỉ số đáp án đúng (1-4): {correct_ans}\n"
        f"- OCR Text:\n{ocr_text}"
    )

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
                              "max_tokens": 2048
                          },
                          timeout=30)
        if r.ok:
            data = r.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            # Remove potential markdown code blocks
            if content.startswith("```"):
                match = re.match(r"```(?:json)?\s*([\s\S]*?)```", content)
                if match:
                    content = match.group(1).strip()
            return json.loads(content)
    except Exception as e:
        print(f"[WARN] DeepSeek API Exception for Cau {q_num}:", safe_str(e))
    return None



# ─── 6. MASTER IMPORT ROUTINE ────────────────────────────────────────
def get_dang_from_filename(filename):
    if filename.startswith("1. "): return "1"
    if filename.startswith("2. "): return "2"
    if filename.startswith("3. "): return "3A"
    if filename.startswith("4. "): return "3B"
    if filename.startswith("5. "): return "4"
    if filename.startswith("6. "): return "5"
    if filename.startswith("7. "): return "6"
    if filename.startswith("8. "): return "7"
    if filename.startswith("9. "): return "8"
    if filename.startswith("10. "): return "9"
    if filename.startswith("11. "): return "10"
    if filename.startswith("12. "): return "11"
    if filename.startswith("13. "): return "12"
    if filename.startswith("14. "): return "13"
    if filename.startswith("15. "): return "14"
    if filename.startswith("16. "): return "15"
    if filename.startswith("17. "): return "16"
    if filename.startswith("18. "): return "17"
    return None

def main():
    dir_path = r"C:\Users\junwi\Downloads\ĐỀ ĐỌC TOPIK II THEO DẠNG-20260528T064124Z-3-001\ĐỀ ĐỌC TOPIK II THEO DẠNG"
    print("=========================================================")
    print("[START] AUTOMATED TOPIK II PDF INGESTION SYSTEM")
    print("=========================================================")
    
    filenames = sorted(os.listdir(dir_path))
    pdf_files = [f for f in filenames if f.endswith(".pdf") and f != "19. ĐÁP ÁN.pdf"]
    
    for filename in pdf_files:
        dang = get_dang_from_filename(filename)
        if not dang:
            continue
            
        pdf_path = os.path.join(dir_path, filename)
        print(f"\n[FILE] Processing PDF: {safe_str(filename)} (Dang {dang})")
        
        reader = PdfReader(pdf_path)
        q_start, q_end = ans_keys[dang]["range"]
        
        for p_idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            
            # Find which Kỳ this page belongs to
            match = re.search(r"TOPIK\s*(\d+)", page_text, re.IGNORECASE)
            if not match:
                print(f"[WARN] Page {p_idx+1}: Could not determine Ky from text headers. Skipping page.")
                continue
                
            ky = int(match.group(1))
            print(f"  [PAGE] Page {p_idx+1} matches TOPIK II Ky {ky}")
            
            # Find which questions on this page need to be processed
            # For each question in this Dạng range:
            for q_num in range(q_start, q_end + 1):
                prog_key = f"{dang}_{ky}_{q_num}"
                if prog_key in progress["imported_questions"]:
                    print(f"    [SKIP] Cau {q_num} (Ky {ky}) already imported. Skipping.")
                    continue
                    
                correct_ans = get_correct_option(dang, ky, q_num)
                if not correct_ans:
                    print(f"    [WARN] Answer key not found for Cau {q_num} Ky {ky}. Skipping.")
                    continue
                    
                # Extract image for OCR
                img_data = extract_largest_image(page)
                if not img_data:
                    print(f"    [WARN] No image found on Page {p_idx+1} for Cau {q_num}. Skipping.")
                    continue
                    
                print(f"    [OCR] running OCR.space for Cau {q_num} (Ky {ky})...")
                ocr_text = perform_ocr(img_data)
                if not ocr_text:
                    print("    [ERROR] OCR failed or empty text returned.")
                    continue
                    
                print(f"    [AI] Structuring through DeepSeek for Cau {q_num}...")
                q_data = process_question_with_ai(ocr_text, dang, ky, q_num, correct_ans)
                if not q_data:
                    print("    [ERROR] DeepSeek processing failed.")
                    continue
                    
                # Find/Create Exam ID
                exam_id = find_or_create_exam(ky)
                
                # Ingest into Supabase
                question_record = {
                    "exam_id": exam_id,
                    "question_number": q_num,
                    "question_type": f"reading_dang_{dang}",
                    "instructions": q_data.get("instructions", ""),
                    "passage": q_data.get("passage", None),
                    "question_text": q_data.get("question_text", ""),
                    "options": q_data.get("options", []),
                    "correct_option": correct_ans,
                    "explanation": q_data.get("explanation", None)
                }
                
                res = requests.post(f"{supabase_url}/rest/v1/topik_exam_questions", headers=headers, json=question_record)
                if res.ok:
                    print(f"    [SAVE] Successfully saved Cau {q_num} Ky {ky} in Supabase!")
                    progress["imported_questions"].append(prog_key)
                    save_progress()
                else:
                    print(f"    [ERROR] Failed to save in Supabase: {safe_str(res.text)}")
                
                # Small rate-limit delay
                time.sleep(1.5)

if __name__ == "__main__":
    main()
