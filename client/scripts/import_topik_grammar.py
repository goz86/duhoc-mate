import os
import re
import json
import time
import requests
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

# ─── 2. DEEPSEEK STRUCTURED PARSER FOR GRAMMAR ───────────────────────
def parse_grammar_page_with_ai(page_text, page_num, section_name):
    system_prompt = (
        "Bạn là một chuyên gia ngôn ngữ tiếng Hàn và tiếng Việt, chuyên biên soạn tài liệu ngữ pháp TOPIK.\n"
        "Nhiệm vụ của bạn là nhận vào văn bản thô (bị bẻ dòng dọc, phân tách chữ do lỗi trích xuất PDF) chứa danh sách cấu trúc ngữ pháp và chuyển đổi nó thành một danh sách cấu trúc ngữ pháp JSON chính xác.\n"
        "\n"
        "YÊU CẦU GHÉP CHỮ KHÓ:\n"
        "Văn bản bị bẻ dòng dọc nên các chữ cái và ký hiệu của một cấu trúc ngữ pháp sẽ nằm liên tiếp trên các dòng riêng biệt.\n"
        "Hãy đọc chuỗi từ trên xuống dưới để ghép các ký tự lại thành cấu trúc tiếng Hàn hoàn chỉnh.\n"
        "Ví dụ:\n"
        "- Chuỗi dòng dọc:\n"
        "아\n"
        "/\n"
        "어\n"
        "서\n"
        "-> Ghép lại thành: \"-아/어서\"\n"
        "\n"
        "- Chuỗi dòng dọc:\n"
        "(\n"
        "으\n"
        ")\n"
        "니\n"
        "까\n"
        "-> Ghép lại thành: \"-(으)니까\"\n"
        "\n"
        "Với mỗi ngữ pháp tìm được, hãy trích xuất:\n"
        "1. title: Tên ngữ pháp tiếng Hàn chính xác (ví dụ: '-아/어서', '-(으)니까').\n"
        "2. formula: Công thức sử dụng đầy đủ (ví dụ: 'A/V - 아/어서', 'N/A/V - (으)니까').\n"
        "3. meaning_vi: Nghĩa tiếng Việt chính xác (ví dụ: 'vì... nên...').\n"
        "4. slug: Một chuỗi tiếng Anh không dấu, viết thường, không khoảng trắng đại diện cho tiêu đề để làm ID (ví dụ: 'ah-eoseo', 'eumyeon').\n"
        "5. level: Phân loại cấp độ TOPIK từ 1 đến 6 dựa trên mức độ khó và độ phổ biến của cấu trúc này (Sơ cấp: 1-2, Trung cấp: 3-4, Cao cấp: 5-6).\n"
        "6. examples: Một mảng chứa đúng 2 ví dụ tự nhiên sử dụng cấu trúc ngữ pháp này. Mỗi ví dụ gồm:\n"
        "   * ko: Câu tiếng Hàn mẫu.\n"
        "   * vi: Nghĩa tiếng Việt tương ứng.\n"
        "7. common_mistake: Ghi chú hoặc lỗi thường gặp bằng tiếng Việt khi dùng cấu trúc này (nếu văn bản không có, hãy tự biên soạn ngắn gọn thiết thực).\n"
        "8. grammar_type: Chọn một trong các nhóm sau: 'general', 'connector', 'tense-aspect', 'honorific', 'comparison', 'academic'.\n"
        "9. tags: Mảng các thẻ tìm kiếm bằng tiếng Việt liên quan (ví dụ: [\"sơ-cấp\", \"nguyên-nhân\"]).\n"
        "\n"
        "Trả về duy nhất định dạng JSON chứa đối tượng có mảng 'patterns', KHÔNG viết markdown code blocks, KHÔNG giải thích dông dài bên ngoài.\n"
        "Cấu trúc JSON trả về:\n"
        "{\n"
        "  \"patterns\": [\n"
        "    {\n"
        "      \"title\": \"...\",\n"
        "      \"formula\": \"...\",\n"
        "      \"meaning_vi\": \"...\",\n"
        "      \"slug\": \"...\",\n"
        "      \"level\": 2,\n"
        "      \"examples\": [\n"
        "        { \"ko\": \"...\", \"vi\": \"...\" }\n"
        "      ],\n"
        "      \"common_mistake\": \"...\",\n"
        "      \"grammar_type\": \"...\",\n"
        "      \"tags\": [\"...\"]\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    user_prompt = (
        f"Hãy trích xuất và cấu trúc danh sách ngữ pháp sau:\n"
        f"- Trang số trong PDF: {page_num}\n"
        f"- Phân khu chính: {section_name}\n"
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
                
                # Robust extract between { and }
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

# ─── 3. DATABASE SAVE HELPER ────────────────────────────────────────
def save_grammar_to_supabase(g):
    slug = re.sub(r'[^a-zA-Z0-9-]', '', g.get("slug", "pattern")).lower()
    if not slug:
        slug = "pattern"
    
    level = int(g.get("level", 1))
    pattern_id = f"ai-grammar-g{level}-{slug}"
    
    record = {
        "id": pattern_id,
        "level": level,
        "title": g.get("title").strip(),
        "formula": g.get("formula").strip(),
        "meaning_vi": g.get("meaning_vi").strip(),
        "meaning_en": "",
        "examples": g.get("examples", []),
        "common_mistake": g.get("common_mistake", ""),
        "grammar_type": g.get("grammar_type", "general"),
        "tags": g.get("tags", []),
        "similar_patterns": [],
        "contrast_notes": "",
        "prerequisites": [],
        "source": "ai-direct",
        "status": "published",
        "quality_score": 8.5
    }
    
    # Check-then-insert/patch because RLS does not allow direct PATCH unless row exists
    # And POST is always allowed for IDs starting with ai-grammar-
    check_url = f"{supabase_url}/rest/v1/topik_grammar_patterns?id=eq.{pattern_id}"
    check = requests.get(check_url, headers=headers)
    if check.ok and check.json():
        # Clean up first via CASCADE DELETE (since public DELETE policy allows it for ai-grammar-%)
        requests.delete(check_url, headers=headers)
        
    # Now POST (INSERT)
    res = requests.post(f"{supabase_url}/rest/v1/topik_grammar_patterns", headers=headers, json=record)
    if res.ok:
        print(f"    [SAVE] Saved grammar '{safe_str(record['title'])}' (Level {record['level']}) successfully!")
        return True
    else:
        print(f"    [ERROR] Failed to save grammar '{safe_str(record['title'])}': {safe_str(res.text)}")
        return False

# ─── 4. MASTER RUNNER ───────────────────────────────────────────────
progress_path = os.path.join(script_dir, "ingestion_progress_grammar.json")
progress = {"imported_pages": []}

if os.path.exists(progress_path):
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except:
        pass

def save_progress():
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)

def main():
    print("=========================================================")
    print("[START] TOPIK GRAMMAR PDF INGESTION SYSTEM")
    print("=========================================================")
    
    pdf_path = r"C:\Users\junwi\Desktop\tu vung\1. 250_CẤU_TRÚC_NGỮ_PHÁP_TIẾNG_HÀN_ TOPIK 1~6.pdf"
    if not os.path.exists(pdf_path):
        print(f"[ERROR] PDF file not found: {pdf_path}")
        return
        
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"PDF loaded successfully. Total pages: {total_pages}")
    
    # Process pages from 10 to 89 (where the actual grammar items are explained)
    for idx in range(9, 89): # 0-indexed: index 9 is page 10, index 88 is page 89
        page_num = idx + 1
        prog_key = f"page_{page_num:02d}"
        if prog_key in progress["imported_pages"]:
            print(f"  [SKIP] Page {page_num} already imported. Skipping.")
            continue
            
        print(f"\n--- Processing Page {page_num} / 89 ---")
        
        # Determine section name
        if page_num <= 32:
            section_name = "So Cap (Beginner)"
        elif page_num <= 61:
            section_name = "Trung Cap (Intermediate)"
        else:
            section_name = "Cao Cap (Advanced)"
            
        text = reader.pages[idx].extract_text() or ""
        if len(text.strip()) < 15:
            print("    [WARN] Page text is empty or too short. Skipping.")
            continue
            
        print(f"    [AI] Calling DeepSeek to parse page {page_num} ({section_name})...")
        ai_data = parse_grammar_page_with_ai(text, page_num, section_name)
        
        if ai_data and "patterns" in ai_data:
            print(f"    [AI] Extracted {len(ai_data['patterns'])} grammar patterns.")
            success_count = 0
            for g in ai_data["patterns"]:
                if g.get("title") and g.get("meaning_vi") and g.get("slug"):
                    if save_grammar_to_supabase(g):
                        success_count += 1
            print(f"    [SAVE] Successfully saved {success_count} / {len(ai_data['patterns'])} patterns.")
        else:
            print(f"    [ERROR] AI failed to parse grammar patterns on Page {page_num}.")
            
        progress["imported_pages"].append(prog_key)
        save_progress()
        time.sleep(2.0)

    print("\n=========================================================")
    print("[SUCCESS] ALL GRAMMAR PATTERNS INGESTED SUCCESSFULLY!")
    print("=========================================================")

if __name__ == "__main__":
    main()
