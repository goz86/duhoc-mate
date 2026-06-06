import argparse
import io
import json
import os
import sys
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(ROOT, ".env")
PROGRESS_PATH = os.path.join(ROOT, "scripts", "ingestion_progress_91.json")
READING_MAP_PATH = os.path.join(ROOT, "scripts", "topik91_reading_clean_map.json")
LISTENING_MAP_PATH = os.path.join(ROOT, "scripts", "topik91_listening_clean_map.json")

def load_env() -> dict:
    values = {}
    if not os.path.exists(ENV_PATH):
        raise SystemExit(f"[FAIL] missing client/.env file at {ENV_PATH}")
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            values[key.strip()] = val.strip()
    return values

def request_json(method: str, url: str, headers: dict, **kwargs):
    response = requests.request(method, url, headers=headers, timeout=30, **kwargs)
    if not response.ok:
        raise SystemExit(f"[FAIL] {method} {url}\n{response.status_code}: {response.text}")
    if response.text:
        return response.json()
    return None

def main():
    parser = argparse.ArgumentParser(description="Sync TOPIK 91 reading & listening DB image paths to clean crops.")
    parser.add_argument("--apply", action="store_true", help="actually patch Supabase rows")
    args = parser.parse_args()

    env = load_env()
    supabase_url = env.get("VITE_SUPABASE_URL")
    supabase_key = env.get("VITE_SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_key:
        raise SystemExit("[FAIL] missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in client/.env")

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    # Load progress to get exam IDs
    if not os.path.exists(PROGRESS_PATH):
        raise SystemExit(f"[FAIL] missing ingestion progress file at {PROGRESS_PATH}")
    
    with open(PROGRESS_PATH, "r", encoding="utf-8") as f:
        progress = json.load(f)
        
    reading_exam_id = progress.get("reading_exam_id")
    listening_exam_id = progress.get("listening_exam_id")
    
    if not reading_exam_id or not listening_exam_id:
        raise SystemExit(f"[FAIL] missing reading_exam_id or listening_exam_id in progress file")

    print(f"[INFO] Reading Exam ID: {reading_exam_id}")
    print(f"[INFO] Listening Exam ID: {listening_exam_id}")

    # 1. Sync Reading Paths
    if os.path.exists(READING_MAP_PATH):
        print("\n>>> SYNCING READING PATHS...")
        with open(READING_MAP_PATH, "r", encoding="utf-8") as f:
            reading_map = json.load(f)
        
        q_map = reading_map["questions"]
        query_url = f"{supabase_url}/rest/v1/topik_exam_questions?select=id,question_number,audio_script&exam_id=eq.{reading_exam_id}&order=question_number.asc"
        questions = request_json("GET", query_url, headers) or []
        by_number = {int(row["question_number"]): row for row in questions}
        
        changed = 0
        for number in range(1, 51):
            if number not in by_number:
                print(f"  [WARN] Q{number:02d} not found in DB for Reading")
                continue
            row = by_number[number]
            new_path = q_map[str(number)]["image"]
            old_path = row.get("audio_script") or ""
            if old_path == new_path:
                print(f"  [SKIP] Reading Q{number:02d} already {new_path}")
                continue
                
            changed += 1
            if not args.apply:
                print(f"  [DRY] Reading Q{number:02d}: {old_path} -> {new_path}")
                continue
                
            patch_url = f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{row['id']}"
            request_json("PATCH", patch_url, headers, json={"audio_script": new_path})
            print(f"  [OK] Reading Q{number:02d}: {old_path} -> {new_path}")
        print(f"[INFO] Reading sync complete. Mode: {'applied' if args.apply else 'dry-run'}, changed={changed}")
    else:
        print("\n[WARN] Reading clean map not found. Skipping Reading sync.")

    # 2. Sync Listening Paths
    if os.path.exists(LISTENING_MAP_PATH):
        print("\n>>> SYNCING LISTENING PATHS...")
        with open(LISTENING_MAP_PATH, "r", encoding="utf-8") as f:
            listening_map = json.load(f)
            
        q_map = listening_map["questions"]
        query_url = f"{supabase_url}/rest/v1/topik_exam_questions?select=id,question_number,audio_script&exam_id=eq.{listening_exam_id}&order=question_number.asc"
        questions = request_json("GET", query_url, headers) or []
        by_number = {int(row["question_number"]): row for row in questions}
        
        changed = 0
        for number in range(1, 51):
            if number not in by_number:
                print(f"  [WARN] Q{number:02d} not found in DB for Listening")
                continue
            row = by_number[number]
            new_path = q_map[str(number)]["image"]
            old_path = row.get("audio_script") or ""
            if old_path == new_path:
                print(f"  [SKIP] Listening Q{number:02d} already {new_path}")
                continue
                
            changed += 1
            if not args.apply:
                print(f"  [DRY] Listening Q{number:02d}: {old_path} -> {new_path}")
                continue
                
            patch_url = f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{row['id']}"
            request_json("PATCH", patch_url, headers, json={"audio_script": new_path})
            print(f"  [OK] Listening Q{number:02d}: {old_path} -> {new_path}")
        print(f"[INFO] Listening sync complete. Mode: {'applied' if args.apply else 'dry-run'}, changed={changed}")
    else:
        print("\n[WARN] Listening clean map not found. Skipping Listening sync.")

if __name__ == "__main__":
    main()
