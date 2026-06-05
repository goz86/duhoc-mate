import os
import json
import requests

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    client_dir = os.path.dirname(script_dir)
    env_path = os.path.join(client_dir, ".env")

    if not os.path.exists(env_path):
        print("[ERROR] client/.env file not found!")
        exit(1)

    supabase_url = None
    supabase_key = None

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

    if not supabase_url or not supabase_key:
        print("[ERROR] Missing Supabase credentials in client/.env!")
        exit(1)

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }

    print(f"Connecting to Supabase at: {supabase_url}")

    # 1. Find all exams created by system_pdf_import
    url_exams = f"{supabase_url}/rest/v1/topik_exams?created_by=eq.system_pdf_import"
    res = requests.get(url_exams, headers=headers)
    if not res.ok:
        print(f"[ERROR] Failed to fetch exams: {res.text}")
        exit(1)

    exams = res.json()
    print(f"Found {len(exams)} exams to clean up:")
    for exam in exams:
        print(f" - ID: {exam['id']} | Title: {exam['title']}")

    if not exams:
        print("No exams to clean.")
    else:
        exam_ids = [exam['id'] for exam in exams]
        # Format the list for in query, e.g. (id1,id2,...)
        ids_str = ",".join([f"{eid}" for eid in exam_ids])
        
        # 2. Delete questions belonging to these exams
        url_del_questions = f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=in.({ids_str})"
        print("Deleting questions...")
        res_del_q = requests.delete(url_del_questions, headers=headers)
        if not res_del_q.ok:
            print(f"[ERROR] Failed to delete questions: {res_del_q.text}")
            exit(1)
        print("Deleted questions successfully.")

        # 3. Delete exams
        url_del_exams = f"{supabase_url}/rest/v1/topik_exams?id=in.({ids_str})"
        print("Deleting exams...")
        res_del_ex = requests.delete(url_del_exams, headers=headers)
        if not res_del_ex.ok:
            print(f"[ERROR] Failed to delete exams: {res_del_ex.text}")
            exit(1)
        print("Deleted exams successfully.")

    # 4. Remove ingestion_progress_v2.json
    progress_path = os.path.join(script_dir, "ingestion_progress_v2.json")
    if os.path.exists(progress_path):
        os.remove(progress_path)
        print(f"Removed progress file: {progress_path}")
    else:
        print("Progress file did not exist.")

    print("[DONE] Cleanup finished successfully!")

if __name__ == "__main__":
    main()
