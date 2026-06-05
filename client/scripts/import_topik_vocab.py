import os
import re
import json
import time
import requests
import fitz  # PyMuPDF
from pypdf import PdfReader

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

# ─── 2. OCR HELPER FOR SCANNED PAGES ────────────────────────────────
def perform_ocr(image_bytes):
    payload = {
        'apikey': ocr_space_key,
        'language': 'kor',
        'isOverlayRequired': False
    }
    for attempt in range(5):
        try:
            r = requests.post('https://api.ocr.space/parse/image',
                              files={'image.jpg': image_bytes},
                              data=payload,
                              timeout=30)
            if r.status_code == 429:
                print("    Rate limited in OCR, sleeping...")
                time.sleep(10)
                continue
            if r.ok:
                res = r.json()
                if not res.get("IsErroredOnProcessing"):
                    parsed_results = res.get("ParsedResults", [])
                    if parsed_results:
                        return parsed_results[0].get("ParsedText", "").strip()
                else:
                    print("    OCR Space processing error:", res.get("ErrorMessage"))
            else:
                print("    OCR HTTP Error:", r.status_code)
        except Exception as e:
            print("    OCR request exception:", e)
        time.sleep(2)
    return ""

# ─── 3. AI STRUCTURED PARSER FOR VOCAB ──────────────────────────────
def parse_vocab_page_with_ai(page_text, level, source_desc):
    system_prompt = (
        "Bạn là một chuyên gia ngôn ngữ tiếng Hàn và tiếng Việt.\n"
        "Nhiệm vụ của bạn là nhận vào văn bản thô (có thể từ OCR hoặc trích xuất PDF) chứa danh sách từ vựng TOPIK và chuyển đổi nó thành một danh sách từ vựng cấu trúc hóa JSON chính xác.\n"
        "Mỗi từ vựng trong danh sách phải có các thuộc tính sau:\n"
        "1. ko: Từ hoặc cụm từ gốc tiếng Hàn chính xác (đã sửa lỗi chính tả từ kết quả OCR).\n"
        "2. pronunciation: Phiên âm cách phát âm của từ tiếng Hàn đó (ví dụ: '갑사함니다' hoặc '여칼'). Nếu cách đọc giống chữ viết, để giống 'ko'.\n"
        "3. vi: Nghĩa tiếng Việt của từ đó (dịch chính xác và tự nhiên, sửa lỗi font tiếng Việt nếu có).\n"
        "4. en: Dịch nghĩa tiếng Anh chính xác của từ đó.\n"
        "5. level: Số nguyên đại diện cho cấp độ TOPIK (bạn được truyền giá trị này).\n"
        "6. example: Một câu ví dụ tiếng Hàn tự nhiên sử dụng từ đó (ưu tiên lấy câu ví dụ có sẵn trong văn bản nguồn nếu có, nếu không hãy tự tạo một câu ví dụ tiếng Hàn đơn giản, thiết thực cho đời sống hoặc thi cử). Bắt buộc phải có câu ví dụ.\n"
        "\n"
        "Trả về duy nhất định dạng JSON chứa đối tượng có mảng 'words', KHÔNG viết markdown code blocks (KHÔNG dùng ```json), KHÔNG giải thích dông dài bên ngoài.\n"
        "Cấu trúc JSON trả về:\n"
        "{\n"
        "  \"words\": [\n"
        "    {\n"
        "      \"ko\": \"...\",\n"
        "      \"pronunciation\": \"...\",\n"
        "      \"vi\": \"...\",\n"
        "      \"en\": \"...\",\n"
        "      \"level\": 3,\n"
        "      \"example\": \"...\"\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    user_prompt = (
        f"Hãy trích xuất và cấu trúc danh sách từ vựng sau:\n"
        f"- Cấp độ chỉ định (level): {level}\n"
        f"- Nguồn tài liệu: {source_desc}\n"
        f"- Văn bản gốc:\n{page_text}"
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
                                  "temperature": 0.2,
                                  "max_tokens": 3000,
                                  "response_format": {"type": "json_object"}
                              },
                              timeout=60)
            if r.ok:
                data = r.json()
                content = data["choices"][0]["message"]["content"].strip()
                
                # Extract JSON between { and }
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
                print(f"    [AI ERROR] DeepSeek HTTP {r.status_code}: {safe_str(r.text)}")
        except Exception as e:
            print(f"    [AI EXCEPTION] DeepSeek API exception (Attempt {attempt+1}): {safe_str(e)}")
        time.sleep(3.0)
    return None

# ─── 4. DATABASE SAVE HELPER ────────────────────────────────────────
def save_word_to_supabase(w):
    # Prepare record matching topik_words columns
    record = {
        "ko": w.get("ko").strip(),
        "vi": w.get("vi").strip(),
        "en": w.get("en").strip(),
        "level": int(w.get("level")),
        "example": w.get("example", ""),
        "pronunciation": w.get("pronunciation", w.get("ko")),
        "ai_examples": w.get("ai_examples", [])
    }
    
    # Check if ko + level already exists, if so upsert/ignore
    # Actually, we can use Supabase upsert since it supports onConflict
    # headers have apiKey and auth bearer
    payload = [record]
    
    # We send request to upsert
    res = requests.post(f"{supabase_url}/rest/v1/topik_words", headers={
        **headers,
        "Prefer": "resolution=merge-duplicates" # or just upsert styling
    }, json=payload)
    
    if res.ok:
        print(f"    [SAVE] Saved word '{safe_str(record['ko'])}' (Level {record['level']}) successfully!")
        return True
    else:
        # Retry with regular insert, or check error
        # Supabase allows upsert via PUT or PATCH or POST with Prefer header
        # Let's try upsert with Prefer: resolution=merge-duplicates, or Prefer: return=minimal
        # Wait, the table constraint is UNIQUE (ko, level). PostgREST supports upsert by POSTing with
        # Prefer: resolution=merge-duplicates or resolution=ignore-duplicates. Let's see if PostgREST upsert works:
        # Standard PostgREST upsert is POST with: Prefer: resolution=merge-duplicates or resolution=ignore-duplicates
        print(f"    [WARN] POST returned {res.status_code}: {safe_str(res.text)}")
        # Let's fallback to search-then-update/insert
        check_url = f"{supabase_url}/rest/v1/topik_words?ko=eq.{record['ko']}&level=eq.{record['level']}"
        check = requests.get(check_url, headers=headers)
        if check.ok and check.json():
            row_id = check.json()[0]["id"]
            res = requests.patch(f"{supabase_url}/rest/v1/topik_words?id=eq.{row_id}", headers=headers, json=record)
            if res.ok:
                print(f"    [UPDATE] Updated word '{safe_str(record['ko'])}' (Level {record['level']})!")
                return True
        else:
            res = requests.post(f"{supabase_url}/rest/v1/topik_words", headers=headers, json=record)
            if res.ok:
                print(f"    [INSERT] Inserted word '{safe_str(record['ko'])}' (Level {record['level']})!")
                return True
        print(f"    [ERROR] Failed to save word '{safe_str(record['ko'])}': {safe_str(res.text)}")
        return False

# ─── 5. FILE PROCESSORS ─────────────────────────────────────────────
vocab_dir = r"C:\Users\junwi\Desktop\tu vung"

def process_file_text_based(filename, level, start_page=1, end_page=None):
    print(f"\n=========================================================")
    print(f"[PROCESS] File: {safe_str(filename)} -> Level {level}")
    print("=========================================================")
    
    pdf_path = os.path.join(vocab_dir, filename)
    if not os.path.exists(pdf_path):
        print(f"[ERROR] File not found: {pdf_path}")
        return
        
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    actual_end_page = min(end_page or total_pages, total_pages)
    
    print(f"Total pages: {total_pages}, Processing range: {start_page} to {actual_end_page}")
    
    # Process page by page
    for idx in range(start_page - 1, actual_end_page):
        page_num = idx + 1
        print(f"  Page {page_num}...")
        text = reader.pages[idx].extract_text() or ""
        
        if len(text.strip()) < 15:
            print(f"    [WARN] Page {page_num} text is too short. Skipping.")
            continue
            
        ai_data = parse_vocab_page_with_ai(text, level, f"File {filename} Page {page_num}")
        if ai_data and "words" in ai_data:
            print(f"    [AI] Extracted {len(ai_data['words'])} words.")
            for w in ai_data["words"]:
                save_word_to_supabase(w)
        else:
            print(f"    [ERROR] AI failed to parse vocabulary on Page {page_num}.")
            
        time.sleep(2.0)

def process_file_image_based_ocr(filename, level):
    print(f"\n=========================================================")
    print(f"[PROCESS IMAGE-OCR] File: {safe_str(filename)} -> Level {level}")
    print("=========================================================")
    
    pdf_path = os.path.join(vocab_dir, filename)
    if not os.path.exists(pdf_path):
        print(f"[ERROR] File not found: {pdf_path}")
        return
        
    doc = fitz.open(pdf_path)
    print(f"Total pages: {len(doc)}")
    
    for idx in range(len(doc)):
        page_num = idx + 1
        print(f"  Page {page_num}...")
        
        # Render high-res image
        page = doc.load_page(idx)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("jpg")
        
        # OCR
        print("    [OCR] Running OCR.space...")
        ocr_text = perform_ocr(img_bytes)
        if not ocr_text or len(ocr_text.strip()) < 15:
            print("    [WARN] OCR text too short or empty. Skipping.")
            continue
            
        # AI
        print("    [AI] Extracting words via DeepSeek...")
        ai_data = parse_vocab_page_with_ai(ocr_text, level, f"Scanned File {filename} Page {page_num}")
        if ai_data and "words" in ai_data:
            print(f"    [AI] Extracted {len(ai_data['words'])} words.")
            for w in ai_data["words"]:
                save_word_to_supabase(w)
        else:
            print(f"    [ERROR] AI failed to parse OCR vocabulary on Page {page_num}.")
            
        time.sleep(2.0)
    doc.close()

# ─── 6. MASTER RUNNER ───────────────────────────────────────────────
def main():
    # File 26: PHÓ TỪ TOPIK.pdf -> Level 3 (Pages 2 to 4 have adverbs)
    process_file_text_based("26. PHÓ TỪ TOPIK.pdf", level=3, start_page=2, end_page=4)
    
    # File 25: TỪ_VỰNG_TOPIK_THEO_CHỦ_ĐỀ.pdf -> Level 3 (Pages 2 to 68)
    process_file_text_based("25. TỪ_VỰNG_TOPIK_THEO_CHỦ_ĐỀ.pdf", level=3, start_page=2, end_page=68)
    
    # File 24: QUÁN DỤNG NGỮ (1).pdf -> Level 5 (Pages 2 to 35)
    process_file_text_based("24. QUÁN DỤNG NGỮ (1).pdf", level=5, start_page=2, end_page=35)
    
    # File 27: TOPIK 합격어휘집.pdf -> Level 4 (Pages 4 to 50 contain vocabulary)
    process_file_text_based("27. TOPIK 합격어휘집.pdf", level=4, start_page=4, end_page=50)
    
    # File 23: TỪ_VỰNG_CẢM_XÚC_TOPIK II.pdf -> Level 4 (Scanned, Pages 2 to 14 contain vocabulary)
    process_file_image_based_ocr("23. TỪ_VỰNG_CẢM_XÚC_TOPIK II.pdf", level=4)
    
    print("\n=========================================================")
    print("[SUCCESS] ALL VOCABULARY INGESTED SUCCESSFULLY!")
    print("=========================================================")

if __name__ == "__main__":
    main()
