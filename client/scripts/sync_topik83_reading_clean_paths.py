from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
import sys

import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
MAP_PATH = ROOT / "scripts" / "topik83_reading_clean_map.json"


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def request_json(method: str, url: str, headers: dict[str, str], **kwargs):
    response = requests.request(method, url, headers=headers, timeout=30, **kwargs)
    if not response.ok:
        raise SystemExit(f"[FAIL] {method} {url}\n{response.status_code}: {response.text}")
    if response.text:
        return response.json()
    return None


def choose_reading_exam(supabase_url: str, headers: dict[str, str], override_id: str | None) -> str:
    if override_id:
        return override_id

    url = f"{supabase_url}/rest/v1/topik_exams?select=id,title,category,exam_number&category=eq.reading"
    exams = request_json("GET", url, headers) or []
    candidates = [exam for exam in exams if "83" in str(exam.get("title", "")) or exam.get("exam_number") == 83]

    if len(candidates) != 1:
        print("[INFO] reading exam candidates:")
        for exam in candidates:
            print(f"  - {exam.get('id')} | {exam.get('exam_number')} | {exam.get('title')}")
        raise SystemExit(f"[FAIL] expected exactly 1 TOPIK 83 reading exam, found {len(candidates)}")

    exam = candidates[0]
    print(f"[INFO] reading exam: {exam.get('id')} | {exam.get('title')}")
    return str(exam["id"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync TOPIK 83 reading DB image paths to clean crops.")
    parser.add_argument("--apply", action="store_true", help="actually patch Supabase rows")
    parser.add_argument("--exam-id", help="override reading exam id")
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

    mapping = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    question_map: dict[str, dict] = mapping["questions"]
    exam_id = choose_reading_exam(supabase_url, headers, args.exam_id)

    query_url = (
        f"{supabase_url}/rest/v1/topik_exam_questions"
        f"?select=id,question_number,audio_script&exam_id=eq.{exam_id}&order=question_number.asc"
    )
    questions = request_json("GET", query_url, headers) or []
    by_number = {int(row["question_number"]): row for row in questions}

    missing = [number for number in range(1, 51) if number not in by_number]
    if missing:
        raise SystemExit(f"[FAIL] missing DB questions: {missing}")

    changed = 0
    for number in range(1, 51):
        row = by_number[number]
        new_path = question_map[str(number)]["image"]
        old_path = row.get("audio_script") or ""
        if old_path == new_path:
            print(f"[SKIP] Q{number:02d} already {new_path}")
            continue

        changed += 1
        if not args.apply:
            print(f"[DRY] Q{number:02d}: {old_path} -> {new_path}")
            continue

        patch_url = f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{row['id']}"
        request_json("PATCH", patch_url, headers, json={"audio_script": new_path})
        print(f"[OK] Q{number:02d}: {old_path} -> {new_path}")

    mode = "applied" if args.apply else "dry-run"
    print(f"[DONE] {mode}; changed={changed}")


if __name__ == "__main__":
    main()
