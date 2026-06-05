"""
Script AI-verify and fix swapped options in TOPIK exam questions.
Strategy:
1. Load all questions from all exams
2. For each question, send to DeepSeek to verify which option is correct
3. Compare with correct_option in DB
4. If mismatch → fix the options array AND/OR correct_option
"""

import os
import re
import json
import time
import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

# ─── CONFIG ─────────────────────────────────────────────────────────────
su = 'https://imqrvssxfrhivlumhoze.supabase.co'
sk = 'sb_publishable_d-szvo4evO2V69FCNc__IQ_xc8OqFPV'
deepseek_key = 'sk-277f833961b6420fa28165c77dc92a71'

h = {'apikey': sk, 'Authorization': 'Bearer ' + sk, 'Content-Type': 'application/json'}
h_read = {'apikey': sk, 'Authorization': 'Bearer ' + sk}

PROGRESS_FILE = r"C:\Users\junwi\.gemini\antigravity-ide\brain\194d5860-114d-4411-9fd5-442360c86d28\scratch\fix_options_progress.json"
REPORT_FILE = r"C:\Users\junwi\.gemini\antigravity-ide\brain\194d5860-114d-4411-9fd5-442360c86d28\scratch\fix_options_report.json"

# ─── LOAD PROGRESS ──────────────────────────────────────────────────────
progress = {"verified": [], "fixed": [], "errors": []}
if os.path.exists(PROGRESS_FILE):
    try:
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            progress = json.load(f)
    except:
        pass

def save_progress():
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

# ─── AI VERIFY FUNCTION ──────────────────────────────────────────────────
def ai_verify_answer(question_text, instructions, passage, options, current_correct):
    """
    Ask DeepSeek which option is the correct answer.
    Returns: int (1-4) or None if uncertain
    """
    opts_str = "\n".join([f"  {i+1}. {o}" for i, o in enumerate(options)])
    
    system_prompt = (
        "Bạn là chuyên gia ngôn ngữ tiếng Hàn, chuyên về kỳ thi TOPIK II.\n"
        "Nhiệm vụ: Xác định đáp án đúng cho câu hỏi điền vào chỗ trống tiếng Hàn.\n"
        "Phân tích ngữ pháp và ngữ cảnh cẩn thận.\n"
        "Chỉ trả về JSON: {\"correct_option\": <số từ 1 đến 4>, \"reason\": \"<lý do ngắn gọn>\"}"
    )
    
    context_parts = []
    if instructions:
        context_parts.append(f"Yêu cầu: {instructions}")
    if passage:
        context_parts.append(f"Đoạn văn:\n{passage}")
    context_parts.append(f"Câu hỏi: {question_text}")
    context_parts.append(f"Các đáp án:\n{opts_str}")
    
    user_prompt = "\n\n".join(context_parts)
    
    for attempt in range(3):
        try:
            r = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {deepseek_key}"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 200,
                    "response_format": {"type": "json_object"}
                },
                timeout=30
            )
            if r.ok:
                content = r.json()["choices"][0]["message"]["content"].strip()
                parsed = json.loads(content)
                ai_correct = int(parsed.get("correct_option", 0))
                reason = parsed.get("reason", "")
                if 1 <= ai_correct <= 4:
                    return ai_correct, reason
            else:
                print(f"    [AI ERROR] {r.status_code}: {r.text[:200]}")
        except Exception as e:
            print(f"    [AI EXCEPTION] attempt {attempt+1}: {e}")
        time.sleep(2)
    return None, "AI failed"

# ─── FIX FUNCTION ─────────────────────────────────────────────────────────
def fix_question(q_id, new_options, new_correct_option):
    """PATCH the question in Supabase"""
    patch_data = {
        "options": new_options,
        "correct_option": new_correct_option
    }
    r = requests.patch(
        f"{su}/rest/v1/topik_exam_questions?id=eq.{q_id}",
        headers=h,
        json=patch_data
    )
    return r.ok, r.status_code, r.text

# ─── MAIN LOGIC ────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("TOPIK Exam Answer Verification & Fix Script")
    print("=" * 60)
    
    # Load all exams
    r = requests.get(su + '/rest/v1/topik_exams?select=id,title&order=title', headers=h_read)
    exams = r.json()
    
    # Filter to only official exams (TOPIK II Reading - Ky X)
    official_exams = [e for e in exams if 'chính thức' in e['title'] and 'Đọc' in e['title']]
    print(f"\nFound {len(official_exams)} official reading exams:")
    for e in official_exams:
        print(f"  - {e['title']}")
    
    report = {"total_checked": 0, "mismatches": [], "fixes_applied": [], "errors": []}
    
    for exam in official_exams:
        exam_id = exam['id']
        exam_title = exam['title']
        print(f"\n{'='*50}")
        print(f"Processing: {exam_title}")
        print(f"{'='*50}")
        
        # Load Q1-Q4 (the fill-in-the-blank grammar questions)
        r = requests.get(
            su + f"/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&question_number=lte.4&select=id,question_number,question_text,instructions,passage,options,correct_option&order=question_number",
            headers=h_read
        )
        questions = r.json()
        print(f"  Loaded {len(questions)} questions (Q1-Q4)")
        
        for q in questions:
            q_id = q['id']
            q_num = q['question_number']
            q_key = f"{exam_id}_{q_num}"
            
            # Skip already verified
            if q_key in progress['verified']:
                print(f"  Q{q_num}: [SKIP] Already verified")
                continue
            
            options = q.get('options', [])
            current_correct = int(q.get('correct_option', 0))
            question_text = q.get('question_text', '')
            instructions = q.get('instructions', '')
            passage = q.get('passage', '')
            
            if not options or len(options) < 4:
                print(f"  Q{q_num}: [SKIP] Not enough options ({len(options)})")
                progress['verified'].append(q_key)
                save_progress()
                continue
            
            print(f"\n  Q{q_num}: Checking...")
            print(f"    Current correct_option={current_correct} → [{options[current_correct-1]}]")
            
            # AI verify
            ai_correct, reason = ai_verify_answer(question_text, instructions, passage, options, current_correct)
            
            report['total_checked'] += 1
            
            if ai_correct is None:
                print(f"    [WARN] AI could not verify Q{q_num}")
                report['errors'].append({"exam": exam_title, "qnum": q_num, "error": "AI failed"})
                progress['errors'].append(q_key)
            elif ai_correct != current_correct:
                print(f"    [MISMATCH] AI says correct={ai_correct} [{options[ai_correct-1]}], DB has {current_correct} [{options[current_correct-1]}]")
                print(f"    Reason: {reason}")
                
                # Log the mismatch
                mismatch = {
                    "id": q_id,
                    "exam": exam_title,
                    "qnum": q_num,
                    "options": options,
                    "db_correct": current_correct,
                    "ai_correct": ai_correct,
                    "reason": reason
                }
                report['mismatches'].append(mismatch)
                
                # Auto-fix: update correct_option to AI's answer
                # But first check if it's an option swap issue vs just wrong answer key
                # If options[ai_correct-1] matches options[current_correct-1] after swap,
                # then we need to fix the options array AND the correct_option
                
                # For now: fix correct_option to match AI's verified answer
                ok, status, text = fix_question(q_id, options, ai_correct)
                if ok:
                    print(f"    [FIXED] Updated correct_option from {current_correct} to {ai_correct}")
                    report['fixes_applied'].append({
                        "id": q_id,
                        "exam": exam_title,
                        "qnum": q_num,
                        "old_correct": current_correct,
                        "new_correct": ai_correct
                    })
                    progress['fixed'].append(q_key)
                else:
                    print(f"    [ERROR] Fix failed: HTTP {status} {text[:200]}")
                    report['errors'].append({"exam": exam_title, "qnum": q_num, "error": f"Fix failed: {text[:200]}"})
            else:
                print(f"    [OK] Correct option {current_correct} [{options[current_correct-1]}] verified by AI")
            
            progress['verified'].append(q_key)
            save_progress()
            time.sleep(1.5)
    
    # Save report
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"VERIFICATION COMPLETE")
    print(f"  Total checked: {report['total_checked']}")
    print(f"  Mismatches found: {len(report['mismatches'])}")
    print(f"  Fixes applied: {len(report['fixes_applied'])}")
    print(f"  Errors: {len(report['errors'])}")
    print(f"  Report saved to: {REPORT_FILE}")

if __name__ == "__main__":
    main()
