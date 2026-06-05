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
progress_path = os.path.join(script_dir, "ingestion_progress_v2.json")
progress = {"created_exams": {}, "imported_pages": []}

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
    for attempt in range(5):
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
            img_bytes = out_buf.getvalue()
        except Exception as e:
            print("[WARN] Image flattening failed:", safe_str(e))
            img_bytes = image_data

        payload = {
            'apikey': ocr_space_key,
            'language': 'kor',
            'isOverlayRequired': False
        }
        try:
            r = requests.post('https://api.ocr.space/parse/image',
                              files={'image.jpg': img_bytes},
                              data=payload,
                              timeout=20)
            if r.status_code == 429:
                try:
                    retry_sec = int(r.json().get("retryAfter", 60))
                except:
                    retry_sec = 60
                print(f"    [OCR RATE LIMIT] Hit limit. Sleeping for {retry_sec} seconds before retrying...")
                time.sleep(retry_sec + 2)
                continue
                
            if r.ok:
                res = r.json()
                if "error" in res:
                    err_text = str(res["error"])
                    if "limit exceeded" in err_text.lower() or "rate limit" in err_text.lower() or "quota" in err_text.lower():
                        try:
                            retry_sec = int(res.get("retryAfter", 60))
                        except:
                            retry_sec = 65
                        print(f"    [OCR ERROR LIMIT] rate limit in JSON error: {safe_str(err_text)}. Sleeping {retry_sec}s...")
                        time.sleep(retry_sec + 2)
                        continue
                    else:
                        print(f"    [OCR ERROR] JSON error: {safe_str(err_text)}")
                elif not res.get("IsErroredOnProcessing"):
                    parsed_results = res.get("ParsedResults", [])
                    if parsed_results:
                        return parsed_results[0].get("ParsedText", "").strip()
                else:
                    error_msg = str(res.get("ErrorMessage", ""))
                    if "limit exceeded" in error_msg.lower() or "rate limit" in error_msg.lower() or "quota" in error_msg.lower():
                        print(f"    [OCR ERROR LIMIT] rate limit in ErrorMessage: {safe_str(error_msg)}. Sleeping 65 seconds...")
                        time.sleep(65)
                        continue
                    print(f"    [OCR ERROR] IsErroredOnProcessing: {safe_str(error_msg)}")
            else:
                print(f"    [OCR HTTP ERROR] Status {r.status_code}: {safe_str(r.text)}")
        except Exception as e:
            print("[WARN] OCR Call Exception:", safe_str(e))
        
        # Small wait between retries
        time.sleep(2)
    return ""


def process_page_questions_with_ai(ocr_text, dang, ky, page_questions, correct_answers):
    system_prompt = (
        "Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp biên soạn đề thi TOPIK II đọc hiểu.\n"
        "Nhiệm vụ của bạn là nhận vào văn bản thô kết quả OCR của một trang đề thi và phân tích thành danh sách câu hỏi trắc nghiệm tiếng Hàn chuẩn xác.\n"
        "YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI:\n"
        "1. Trang này chứa các câu hỏi số: " + str(page_questions) + ".\n"
        "2. Với mỗi câu hỏi trong danh sách trên, hãy trích xuất và cấu trúc hóa thông tin.\n"
        "3. Sửa toàn bộ lỗi chính tả tiếng Hàn và ký hiệu trắc nghiệm bị nhận diện sai.\n"
        "4. Mảng 'options' bắt buộc phải chứa đúng 4 lựa chọn tiếng Hàn (không bao gồm ký hiệu số ①, ②, ③, ④).\n"
        "5. CỰC KỲ QUAN TRỌNG: Bạn được cung cấp đáp án đúng của từng câu:\n"
        + str(correct_answers) + "\n"
        "Bạn phải sắp xếp các lựa chọn sao cho câu trả lời đúng nằm chính xác ở vị trí index (đáp án đúng - 1) trong mảng 'options' của câu hỏi đó.\n"
        "6. Trích xuất thông tin hướng dẫn chung (instructions) cho trang này.\n"
        "7. Nếu trang có đoạn văn đi kèm (passage), trích xuất toàn bộ đoạn văn đó vào trường 'passage' cho các câu hỏi liên quan. Nếu không có, để null.\n"
        "8. Trường 'explanation' phải dịch nghĩa câu hỏi, giải thích ngữ pháp liên quan và lý do vì sao đáp án đó đúng bằng tiếng Việt.\n"
        "Trả về định dạng JSON duy nhất chứa đối tượng có mảng 'questions', KHÔNG viết markdown code blocks (KHÔNG dùng ```json), KHÔNG giải thích dông dài bên ngoài.\n"
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
        f"Hãy cấu trúc các câu hỏi sau:\n"
        f"- Dạng câu hỏi: {dang}\n"
        f"- Kỳ thi TOPIK: {ky}\n"
        f"- Danh sách câu hỏi cần trích xuất: {page_questions}\n"
        f"- Map đáp án đúng: {correct_answers}\n"
        f"- OCR Text:\n{ocr_text}"
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
                              timeout=45)
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
            print(f"[WARN] DeepSeek API Exception for Ky {ky} Dang {dang} questions {page_questions} (Attempt {attempt+1}):", safe_str(e))
        time.sleep(2.0)
    return None

# ─── 6. MASTER PAGE MAPPING ───────────────────────────────────────────
def get_pdf_page_mapping(dang, num_pages):
    mapping = []
    
    if dang in ["1", "3B", "4", "5", "6", "7", "8", "9", "14", "15", "16", "17"]:
        for idx in range(min(num_pages, len(sessions))):
            mapping.append((idx, sessions[idx], "", idx))
            
    elif dang == "2":
        for idx in range(min(num_pages, 8)):
            mapping.append((idx, sessions[idx], "", idx))
            
    elif dang == "3A":
        ky_list = [36, 37, 41, 47, 52, 60, 64]
        for idx in range(min(num_pages, len(ky_list))):
            mapping.append((idx, ky_list[idx], "", idx))
            
    elif dang in ["10", "11", "13"]:
        for idx in range(num_pages):
            ky_idx = idx // 2
            if ky_idx < len(sessions):
                ky = sessions[ky_idx]
                part = f"_p{(idx % 2) + 1}"
                mapping.append((idx, ky, part, idx % 2))
                
    elif dang == "12":
        page_to_ky = [
            (0, 35, "_p1", 0), (1, 35, "_p2", 1),
            (2, 36, "_p1", 0), (3, 36, "_p2", 1),
            (4, 37, "_p1", 0), (5, 37, "_p2", 1), (6, 37, "_p3", 2),
            (7, 41, "_p1", 0), (8, 41, "_p2", 1), (9, 41, "_p3", 2),
            (10, 47, "_p1", 0), (11, 47, "_p2", 1),
            (12, 52, "_p1", 0), (13, 52, "_p2", 1),
            (14, 60, "_p1", 0), (15, 60, "_p2", 1),
            (16, 64, "_p1", 0), (17, 64, "_p2", 1)
        ]
        for idx, ky, part, p_in_ky in page_to_ky:
            if idx < num_pages:
                mapping.append((idx, ky, part, p_in_ky))
                
    return mapping

def get_page_questions(dang, ky, p_idx_in_ky):
    if dang in ["1", "2", "3A", "3B", "4", "5", "6", "7", "8", "9", "14", "15", "16", "17"]:
        q_start, q_end = ans_keys[dang]["range"]
        return list(range(q_start, q_end + 1))
        
    elif dang == "10":
        if p_idx_in_ky == 0:
            return [28, 29]
        else:
            return [30, 31]
            
    elif dang == "11":
        if p_idx_in_ky == 0:
            return [32]
        else:
            return [33, 34]
            
    elif dang == "12":
        if ky in [37, 41]:
            if p_idx_in_ky == 0:
                return [35]
            elif p_idx_in_ky == 1:
                return [36]
            else:
                return [37, 38]
        else:
            if p_idx_in_ky == 0:
                return [35, 36]
            else:
                return [37, 38]
                
    elif dang == "13":
        if p_idx_in_ky == 0:
            return [39]
        else:
            return [40, 41]
            
    return []

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

# ─── 7. MASTER IMPORT ROUTINE ────────────────────────────────────────
def main():
    dir_path = r"C:\Users\junwi\Downloads\ĐỀ ĐỌC TOPIK II THEO DẠNG-20260528T064124Z-3-001\ĐỀ ĐỌC TOPIK II THEO DẠNG"
    print("=========================================================")
    print("[START] AUTOMATED TOPIK II PDF INGESTION SYSTEM V2 (FULL PAGE BATCH)")
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
        num_pages = len(reader.pages)
        page_mapping = get_pdf_page_mapping(dang, num_pages)
        
        # We loop through mapping
        for p_idx, ky, part, p_in_ky in page_mapping:
            prog_key = f"{dang}_{ky}_{p_idx}"
            if prog_key in progress["imported_pages"]:
                print(f"  [SKIP] Page {p_idx+1} (Ky {ky}) already imported. Skipping.")
                continue
                
            page_questions = get_page_questions(dang, ky, p_in_ky)
            if not page_questions:
                continue
                
            # Fetch answers from key
            correct_answers = {}
            for q_num in page_questions:
                ans = get_correct_option(dang, ky, q_num)
                if ans:
                    correct_answers[q_num] = ans
                    
            if not correct_answers:
                print(f"  [WARN] Page {p_idx+1}: No correct options found for questions {page_questions}. Skipping.")
                continue
                
            page = reader.pages[p_idx]
            
            # ALWAYS render the page via PyMuPDF to ensure we capture all text, graphics, and layout
            print(f"  [RENDER] Rendering Page {p_idx+1} (Ky {ky}) via PyMuPDF...")
            img_data = None
            try:
                import fitz
                fitz_doc = fitz.open(pdf_path)
                fitz_page = fitz_doc.load_page(p_idx)
                pix = fitz_page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_data = pix.tobytes("jpg")
                fitz_doc.close()
            except Exception as render_err:
                print(f"    [ERROR] Failed to render page via PyMuPDF: {safe_str(render_err)}")
                
            if not img_data:
                # Fallback to pypdf image extraction if rendering fails
                img_data = extract_largest_image(page)
                if not img_data:
                    continue
            
            # Save the image to the public folder
            try:
                public_exams_dir = os.path.join(client_dir, "public", "topik_exams")
                os.makedirs(public_exams_dir, exist_ok=True)
                img_file_path = os.path.join(public_exams_dir, f"dang_{dang}_ky_{ky}{part}.jpg")
                with open(img_file_path, "wb") as img_f:
                    img_f.write(img_data)
                print(f"  [SAVE IMAGE] Saved page image to {img_file_path}")
            except Exception as write_err:
                print(f"    [WARN] Failed to write image file: {safe_str(write_err)}")
                
            print(f"  [OCR] running OCR.space for Page {p_idx+1} (Ky {ky}) questions {page_questions}...")
            ocr_text = perform_ocr(img_data)
            if not ocr_text:
                print("    [ERROR] OCR failed or empty text returned.")
                continue
                
            print(f"  [AI] Structuring through DeepSeek for questions {page_questions}...")
            ai_data = process_page_questions_with_ai(ocr_text, dang, ky, page_questions, correct_answers)
            if not ai_data or "questions" not in ai_data:
                print("    [ERROR] DeepSeek processing failed or invalid JSON returned.")
                continue
                
            exam_id = find_or_create_exam(ky)
            
            # Save all parsed questions to database
            for q_parsed in ai_data["questions"]:
                q_num = q_parsed.get("question_number")
                if q_num not in page_questions:
                    print(f"    [WARN] AI returned question_number {q_num} which is not in {page_questions}. Skipping Q.")
                    continue
                    
                correct_ans = correct_answers[q_num]
                
                # Naming standard for image URL
                img_url = f"/topik_exams/dang_{dang}_ky_{ky}{part}.jpg"
                
                question_record = {
                    "exam_id": exam_id,
                    "question_number": q_num,
                    "question_type": f"reading_dang_{dang}",
                    "instructions": q_parsed.get("instructions", ""),
                    "passage": q_parsed.get("passage", None),
                    "question_text": q_parsed.get("question_text", ""),
                    "options": q_parsed.get("options", []),
                    "correct_option": correct_ans,
                    "explanation": q_parsed.get("explanation", None),
                    "audio_script": img_url # image path goes here
                }
                
                # Check if exists in db, if so overwrite, else insert
                # Get existing ID
                check_res = requests.get(f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&question_number=eq.{q_num}", headers=headers)
                if check_res.ok and check_res.json():
                    q_id = check_res.json()[0]["id"]
                    res = requests.patch(f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}", headers=headers, json=question_record)
                else:
                    res = requests.post(f"{supabase_url}/rest/v1/topik_exam_questions", headers=headers, json=question_record)
                    
                if res.ok:
                    print(f"    [SAVE] Successfully saved Q#{q_num} Ky {ky} in database!")
                else:
                    print(f"    [ERROR] Failed to save Q#{q_num} in Supabase: {safe_str(res.text)}")
            
            progress["imported_pages"].append(prog_key)
            save_progress()
            time.sleep(2.0)
            
        # ─── Special Case: Dang 2, Page 9 is dang_3A_ky_35 ───
        if dang == "2" and num_pages >= 9:
            ky = 35
            page_questions = [9, 10]
            prog_key = "3A_35_special"
            
            if prog_key not in progress["imported_pages"]:
                correct_answers = {
                    9: get_correct_option("3A", ky, 9),
                    10: get_correct_option("3A", ky, 10)
                }
                
                page = reader.pages[8] # Page 9
                img_data = extract_largest_image(page)
                if not img_data or len(img_data) < 15000:
                    print(f"  [RENDER SPECIAL] Vector page or placeholder detected. Rendering via PyMuPDF...")
                    try:
                        import fitz
                        fitz_doc = fitz.open(pdf_path)
                        fitz_page = fitz_doc.load_page(8)
                        pix = fitz_page.get_pixmap(matrix=fitz.Matrix(2, 2))
                        img_data = pix.tobytes("jpg")
                        fitz_doc.close()
                    except Exception as render_err:
                        print(f"    [ERROR] Failed to render special page via PyMuPDF: {safe_str(render_err)}")
                
                if img_data:
                    # Save the image to the public folder
                    try:
                        public_exams_dir = os.path.join(client_dir, "public", "topik_exams")
                        os.makedirs(public_exams_dir, exist_ok=True)
                        img_file_path = os.path.join(public_exams_dir, "dang_3A_ky_35.jpg")
                        with open(img_file_path, "wb") as img_f:
                            img_f.write(img_data)
                        print(f"  [SAVE IMAGE] Saved special page image to {img_file_path}")
                    except Exception as write_err:
                        print(f"    [WARN] Failed to write special image file: {safe_str(write_err)}")
                        
                    print(f"\n  [SPECIAL] Processing Page 9 of Dang 2 PDF as Ky 35 Dang 3A...")
                    print(f"  [OCR] running OCR.space for Ky 35 Q9-10...")
                    ocr_text = perform_ocr(img_data)
                    if ocr_text:
                        print(f"  [AI] Structuring through DeepSeek for Ky 35 Q9-10...")
                        ai_data = process_page_questions_with_ai(ocr_text, "3A", ky, page_questions, correct_answers)
                        if ai_data and "questions" in ai_data:
                            exam_id = find_or_create_exam(ky)
                            for q_parsed in ai_data["questions"]:
                                q_num = q_parsed.get("question_number")
                                correct_ans = correct_answers[q_num]
                                img_url = "/topik_exams/dang_3A_ky_35.jpg"
                                
                                question_record = {
                                    "exam_id": exam_id,
                                    "question_number": q_num,
                                    "question_type": "reading_dang_3A",
                                    "instructions": q_parsed.get("instructions", ""),
                                    "passage": q_parsed.get("passage", None),
                                    "question_text": q_parsed.get("question_text", ""),
                                    "options": q_parsed.get("options", []),
                                    "correct_option": correct_ans,
                                    "explanation": q_parsed.get("explanation", None),
                                    "audio_script": img_url
                                }
                                
                                check_res = requests.get(f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&question_number=eq.{q_num}", headers=headers)
                                if check_res.ok and check_res.json():
                                    q_id = check_res.json()[0]["id"]
                                    res = requests.patch(f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}", headers=headers, json=question_record)
                                else:
                                    res = requests.post(f"{supabase_url}/rest/v1/topik_exam_questions", headers=headers, json=question_record)
                                    
                                if res.ok:
                                    print(f"    [SAVE] Successfully saved Q#{q_num} Ky {ky} in database!")
                                else:
                                    print(f"    [ERROR] Failed to save Q#{q_num} in Supabase: {safe_str(res.text)}")
                            
                            progress["imported_pages"].append(prog_key)
                            save_progress()
                            time.sleep(2.0)

if __name__ == "__main__":
    main()
