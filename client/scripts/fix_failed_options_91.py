import os
import sys
import requests
import json
import time

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
    deepseek_key = 'sk-277f833961b6420fa28165c77dc92a71'

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# ─── 2. READ INGESTION PROGRESS TO GET EXAM IDs ───────────────────
progress_file = os.path.join(client_dir, "scripts", "ingestion_progress_91.json")
if not os.path.exists(progress_file):
    print(f"[ERROR] Missing ingestion progress file at {progress_file}")
    exit(1)
    
with open(progress_file, "r", encoding="utf-8") as f:
    prog_data = json.load(f)
    
reading_exam_id = prog_data.get("reading_exam_id")
listening_exam_id = prog_data.get("listening_exam_id")

if not reading_exam_id or not listening_exam_id:
    print("[ERROR] missing reading_exam_id or listening_exam_id")
    exit(1)

# ─── 3. DEFINE EXPLICIT CORRECT OPTIONS AND METADATA ──────────────
FIX_DATA_READING = {
    13: {
        "options": [
            "(가) - (다) - (라) - (나)",
            "(나) - (가) - (다) - (라)",
            "(가) - (라) - (나) - (다)",
            "(나) - (라) - (다) - (가)"
        ],
        "correct_option": 2,
        "instructions": "다음을 순서에 맞게 배열한 것을 고르십시오."
    },
    14: {
        "options": [
            "(나) - (다) - (라) - (가)",
            "(나) - (라) - (가) - (다)",
            "(다) - (나) - (가) - (라)",
            "(다) - (나) - (라) - (가)"
        ],
        "correct_option": 3,
        "instructions": "다음을 순서에 맞게 배열한 것을 고르십시오."
    },
    15: {
        "options": [
            "(가) - (나) - (라) - (다)",
            "(다) - (가) - (나) - (라)",
            "(가) - (다) - (라) - (나)",
            "(다) - (라) - (나) - (가)"
        ],
        "correct_option": 2,
        "instructions": "다음을 순서에 맞게 배열한 것을 고르십시오."
    },
    39: {
        "options": ["㉠", "㉡", "㉢", "㉣"],
        "correct_option": 1,
        "instructions": "주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오."
    },
    40: {
        "options": ["㉠", "㉡", "㉢", "㉣"],
        "correct_option": 3,
        "instructions": "주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.",
        "question_text": "주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.\n주어진 문장: 그 증거로 지중해 전역에서 발견되고 있는 소금 퇴적층을 들 수 있다.",
        "passage": "유럽과 아시아, 아프리카 대륙으로 둘러싸인 바다를 지중해라고 한다. ( ㉠ ) 오늘날 지중해 연안은 기후가 온화해서 살기 좋은 곳으로 손꼽힌다. ( ㉡ ) 그런데 지중해는 오래전 사막이었던 적이 있었다. ( ㉢ ) 이 소금 퇴적층은 바닷물이 증발되고 남은 소금이 쌓여 만들어진 것으로 지중해가 이전에는 사막이었음을 보여 준다. ( ㉣ ) 사막이었던 지중해에 이후 큰 홍수가 발생하면서 다시 오늘날과 같은 바다가 되었다."
    },
    41: {
        "options": ["㉠", "㉡", "㉢", "㉣"],
        "correct_option": 3,
        "instructions": "주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.",
        "question_text": "주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.\n주어진 문장: 이런 상소문들을 저자는 왕을 향한 깨우침의 죽비 소리로 비유하고 있다.",
        "passage": "최근 역사학자 김경민 씨가 『응답하라, 조선』을 펴냈다. ( ㉠ ) 이 책은 왕과 신하의 소통을 다루고 있어 사람들의 관심을 끈다. ( ㉡ ) 그 소통의 내용 중에서 특히 왕의 노여움을 무릅쓰고 신하가 왕의 잘못을 지적한 상소문을 다룬 부분이 주목받고 있다. ( ㉢ ) 『응답하라, 조선』은 눈치를 살피며 윗사람의 잘못을 모르는 체 넘기곤 하는 현대인들을 깨우는 죽비인 것이다. ( ㉣ )"
    }
}

FIX_DATA_LISTENING = {
    21: {
        "options": [
            "회의 내용을 빠짐없이 기록해야 한다.",
            "회의 때 낭비되는 종이를 줄이는 것이 좋다.",
            "회의실을 지금보다 더 큰 장소로 바꿔야 한다.",
            "발표 자료는 알아보기 쉽게 만드는 것이 좋다."
        ],
        "correct_option": 2,
        "instructions": "남자의 중심 생각으로 가장 알맞은 것을 고르십시오."
    },
    22: {
        "options": [
            "이번 회의는 발표 자료 없이 진행된다.",
            "여자는 회의에서 쓸 자료를 복사할 예정이다.",
            "남자는 회의 때 대형 화면을 사용한 적이 있다.",
            "여자는 참석자들에게 참고할 자료를 이미 이메일로 보내 놓았다."
        ],
        "correct_option": 3,
        "instructions": "들은 내용과 같은 것을 고르십시오."
    }
}

# ─── 4. FUNCTION TO GENERATE VIETNAMESE EXPLANATION ──────────────
def generate_vietnamese_explanation(q_text, instructions, passage, options, correct_index):
    print(f"    [AI] Generating explanation for option {correct_index}...")
    explanation_prompt = (
        "Bạn là chuyên gia giảng dạy và khảo thí TOPIK II tiếng Hàn.\n"
        f"Câu hỏi: {q_text}\n"
        f"Đoạn văn: {passage or 'Không có'}\n"
        f"Yêu cầu: {instructions or 'Chọn đáp án đúng'}\n"
        f"Các phương án:\n" + "\n".join([f"  {i+1}. {o}" for i, o in enumerate(options)]) + "\n"
        f"Đáp án đúng là: {correct_index}. {options[correct_index-1]}\n"
        "Hãy giải thích ngắn gọn bằng tiếng Việt (1-3 câu) lý do tại sao phương án này là đáp án đúng cho câu hỏi.\n"
        "Trả về JSON dạng: {\"explanation\": \"nội dung giải thích\"}"
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
                return parsed.get("explanation", "")
        except Exception as e:
            print(f"      [AI ERROR] Attempt {attempt+1}: {e}")
            time.sleep(1)
    return ""

# ─── 5. EXECUTE DATABASE UPDATES ──────────────────────────────────
def fix_section_questions(exam_id, section_name, fix_data):
    print(f"\n>>> Fixing {section_name.upper()} Questions...")
    for q_num, data in fix_data.items():
        # First query current DB state to preserve original texts if not specified in fix data
        query_url = f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&question_number=eq.{q_num}&select=id,question_text,passage,instructions"
        res = requests.get(query_url, headers=headers)
        if not res.ok or not res.json():
            print(f"  [ERROR] Q#{q_num} not found in DB!")
            continue
            
        db_q = res.json()[0]
        q_id = db_q["id"]
        
        # Determine values to write
        q_text = data.get("question_text", db_q["question_text"])
        passage = data.get("passage", db_q["passage"])
        instructions = data.get("instructions", db_q["instructions"] or data.get("instructions"))
        options = data["options"]
        correct_index = data["correct_option"]
        
        # Generate explanation
        explanation = generate_vietnamese_explanation(q_text, instructions, passage, options, correct_index)
        
        # Prepare payload
        payload = {
            "options": options,
            "correct_option": correct_index,
            "question_text": q_text,
            "passage": passage,
            "instructions": instructions,
            "explanation": explanation
        }
        
        # Patch Supabase
        patch_url = f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}"
        up_res = requests.patch(patch_url, headers=headers, json=payload)
        if up_res.ok:
            print(f"  [OK] Q#{q_num} updated successfully in Supabase!")
        else:
            print(f"  [ERROR] Q#{q_num} update failed: {up_res.status_code} {up_res.text}")

def main():
    fix_section_questions(reading_exam_id, "reading", FIX_DATA_READING)
    fix_section_questions(listening_exam_id, "listening", FIX_DATA_LISTENING)
    
    # Update progress file if there's any cache to refresh
    progress_91_path = os.path.join(script_dir, "fix_options_91_progress.json")
    if os.path.exists(progress_91_path):
        try:
            with open(progress_91_path, "r", encoding="utf-8") as f:
                progress_fix = json.load(f)
            
            # Add these keys to verified_questions to make sure fix_options_91.py doesn't touch them again
            for q_num in FIX_DATA_READING.keys():
                q_key = f"reading_{q_num}"
                # Look up question ID from DB
                query_url = f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{reading_exam_id}&question_number=eq.{q_num}&select=id"
                r = requests.get(query_url, headers=headers)
                if r.ok and r.json():
                    q_id = r.json()[0]["id"]
                    prog_key = f"reading_{q_id}"
                    if prog_key not in progress_fix["verified_questions"]:
                        progress_fix["verified_questions"].append(prog_key)
                    if prog_key in progress_fix["errors"]:
                        progress_fix["errors"].remove(prog_key)
                        
            for q_num in FIX_DATA_LISTENING.keys():
                q_key = f"listening_{q_num}"
                query_url = f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{listening_exam_id}&question_number=eq.{q_num}&select=id"
                r = requests.get(query_url, headers=headers)
                if r.ok and r.json():
                    q_id = r.json()[0]["id"]
                    prog_key = f"listening_{q_id}"
                    if prog_key not in progress_fix["verified_questions"]:
                        progress_fix["verified_questions"].append(prog_key)
                    if prog_key in progress_fix["errors"]:
                        progress_fix["errors"].remove(prog_key)
            
            with open(progress_91_path, "w", encoding="utf-8") as f:
                json.dump(progress_fix, f, indent=2)
            print("[INFO] Updated fix progress cache file.")
        except Exception as e:
            print(f"[WARN] Could not update fix progress cache file: {e}")

if __name__ == "__main__":
    main()
