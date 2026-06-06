import os
import json
import requests
from PIL import Image

# ─── Load credentials ───
script_dir = os.path.dirname(os.path.abspath(__file__))
client_dir = os.path.dirname(script_dir)
env_path = os.path.join(client_dir, ".env")

supabase_url = None
supabase_key = None

with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            if k.strip() == "VITE_SUPABASE_URL":
                supabase_url = v.strip()
            elif k.strip() == "VITE_SUPABASE_ANON_KEY":
                supabase_key = v.strip()

if not supabase_url or not supabase_key:
    print("[ERROR] Supabase configuration not found in client/.env!")
    exit(1)

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

reading_exam_id = '3ef491eb-1ed9-48cc-971d-0014f74634d0'
listening_exam_id = 'ec48c1ed-2fa4-4cbc-a4bf-0c28e059e531'

public_dir = os.path.join(client_dir, "public")

def crop_and_update(category, page_name, q_num, crop_box, custom_suffix=""):
    # crop_box format: (left_pct, top_pct, right_pct, bottom_pct)
    img_src = os.path.join(public_dir, "topik_exams", "ky_83", category, f"{page_name}.jpg")
    if not os.path.exists(img_src):
        print(f"File not found: {img_src}")
        return
    
    out_name = f"{page_name}_{custom_suffix or f'q{q_num}'}.jpg"
    img_dst = os.path.join(public_dir, "topik_exams", "ky_83", category, out_name)
    img_url = f"/topik_exams/ky_83/{category}/{out_name}"
    
    try:
        with Image.open(img_src) as img:
            w, h = img.size
            left = int(crop_box[0] * w)
            top = int(crop_box[1] * h)
            right = int(crop_box[2] * w)
            bottom = int(crop_box[3] * h)
            
            # Clamp bounds
            left = max(0, min(w, left))
            top = max(0, min(h, top))
            right = max(0, min(w, right))
            bottom = max(0, min(h, bottom))
            
            cropped = img.crop((left, top, right, bottom))
            cropped.save(img_dst, "JPEG", quality=95)
            print(f"Cropped {img_src} -> {img_dst}")
    except Exception as e:
        print(f"  [ERROR] Image processing failed for {img_src}: {e}")
        return
        
    # Update Supabase question record
    exam_id = reading_exam_id if category == "reading" else listening_exam_id
    res = requests.get(f"{supabase_url}/rest/v1/topik_exam_questions?exam_id=eq.{exam_id}&question_number=eq.{q_num}", headers=headers)
    if res.ok:
        data = res.json()
        if data:
            q_id = data[0]["id"]
            patch_res = requests.patch(
                f"{supabase_url}/rest/v1/topik_exam_questions?id=eq.{q_id}",
                headers=headers,
                json={"audio_script": img_url}
            )
            if patch_res.ok:
                print(f"  Updated Q#{q_num} in DB to: {img_url}")
            else:
                print(f"  [ERROR] DB update failed for Q#{q_num}: {patch_res.text}")
        else:
            print(f"  [WARN] Question Q#{q_num} not found in database for exam {exam_id}")
    else:
        print(f"  [ERROR] Failed to query question Q#{q_num}: {res.text}")

def main():
    print("=========================================================")
    print("[START] CROPPING TOPIK II KY 83 IMAGES")
    print("=========================================================")
    
    # ─── LISTENING CROPS ───
    print("\n>>> Cropping Listening Questions...")
    # Q1-3 (Trang 1, 2, 3): Crop bo 22% duoi cung (bo dap an)
    crop_and_update("listening", "page_01", 1, (0.0, 0.0, 1.0, 0.78))
    crop_and_update("listening", "page_02", 2, (0.0, 0.0, 1.0, 0.78))
    crop_and_update("listening", "page_03", 3, (0.0, 0.0, 1.0, 0.78))
    
    # Q4-6 (Trang 4): 3 cau ngan xep doc
    crop_and_update("listening", "page_04", 4, (0.05, 0.08, 0.95, 0.35))
    crop_and_update("listening", "page_04", 5, (0.05, 0.35, 0.95, 0.60))
    crop_and_update("listening", "page_04", 6, (0.05, 0.60, 0.95, 0.85))
    
    # Q7-50: Hau het la 2 cau xep doc (Le o tren, Chan o duoi)
    for q in range(7, 51):
        page_num = 5 + ((q - 7) // 2)
        page_name = f"page_{page_num:02d}"
        if q % 2 == 1:
            # Cau le: Nua tren (y tu 8% den 50%)
            crop_and_update("listening", page_name, q, (0.05, 0.08, 0.95, 0.50))
        else:
            # Cau chan: Nua duoi (y tu 50% den 88%)
            crop_and_update("listening", page_name, q, (0.05, 0.50, 0.95, 0.88))
            
    # ─── READING CROPS ───
    print("\n>>> Cropping Reading Questions...")
    # Q1-4 (Trang 5): 4 cau ngu phap ngan xep doc
    crop_and_update("reading", "page_05", 1, (0.05, 0.12, 0.95, 0.26))
    crop_and_update("reading", "page_05", 2, (0.05, 0.28, 0.95, 0.42))
    crop_and_update("reading", "page_05", 3, (0.05, 0.44, 0.95, 0.58))
    crop_and_update("reading", "page_05", 4, (0.05, 0.60, 0.95, 0.74))
    
    # Q5-8 (Trang 6): 4 cau ngu phap ngan xep doc
    crop_and_update("reading", "page_06", 5, (0.05, 0.12, 0.95, 0.26))
    crop_and_update("reading", "page_06", 6, (0.05, 0.28, 0.95, 0.42))
    crop_and_update("reading", "page_06", 7, (0.05, 0.44, 0.95, 0.58))
    crop_and_update("reading", "page_06", 8, (0.05, 0.60, 0.95, 0.74))

    # Q9-10 (Trang 7): 2 cau ngan xep doc
    crop_and_update("reading", "page_07", 9, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_07", 10, (0.05, 0.48, 0.95, 0.88))

    # Q11-12 (Trang 8): 2 cau ngan xep doc
    crop_and_update("reading", "page_08", 11, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_08", 12, (0.05, 0.48, 0.95, 0.88))

    # Q13-15 (Trang 9): 3 cau ngan
    crop_and_update("reading", "page_09", 13, (0.05, 0.08, 0.95, 0.35))
    crop_and_update("reading", "page_09", 14, (0.05, 0.35, 0.95, 0.62))
    crop_and_update("reading", "page_09", 15, (0.05, 0.62, 0.95, 0.88))

    # Q16-18 (Trang 10): 3 cau ngan
    crop_and_update("reading", "page_10", 16, (0.05, 0.08, 0.95, 0.35))
    crop_and_update("reading", "page_10", 17, (0.05, 0.35, 0.95, 0.62))
    crop_and_update("reading", "page_10", 18, (0.05, 0.62, 0.95, 0.88))

    # Q19-20 (Trang 11): 2 cau
    crop_and_update("reading", "page_11", 19, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_11", 20, (0.05, 0.48, 0.95, 0.88))

    # Q21-22 (Trang 12): 2 cau
    crop_and_update("reading", "page_12", 21, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_12", 22, (0.05, 0.48, 0.95, 0.88))

    # Q23-24 (Trang 13): 2 cau
    crop_and_update("reading", "page_13", 23, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_13", 24, (0.05, 0.48, 0.95, 0.88))

    # Q25-27 (Trang 14): Trang chua 1 doan van chung dai o tren, 3 cau hoi duoi
    for q in [25, 26, 27]:
        crop_and_update("reading", "page_14", q, (0.0, 0.0, 1.0, 0.75), "shared")

    # Q28-29 (Trang 15): 2 cau
    crop_and_update("reading", "page_15", 28, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_15", 29, (0.05, 0.48, 0.95, 0.88))

    # Q30-31 (Trang 16): 2 cau
    crop_and_update("reading", "page_16", 30, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_16", 31, (0.05, 0.48, 0.95, 0.88))

    # Q32-33 (Trang 17): 2 câu
    crop_and_update("reading", "page_17", 32, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_17", 33, (0.05, 0.48, 0.95, 0.88))

    # Q34-35 (Trang 18): 2 cau
    crop_and_update("reading", "page_18", 34, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_18", 35, (0.05, 0.48, 0.95, 0.88))

    # Q36-37 (Trang 19): 2 câu
    crop_and_update("reading", "page_19", 36, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_19", 37, (0.05, 0.48, 0.95, 0.88))

    # Q38-39 (Trang 20): 2 câu
    crop_and_update("reading", "page_20", 38, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_20", 39, (0.05, 0.48, 0.95, 0.88))

    # Q40-41 (Trang 21): 2 câu
    crop_and_update("reading", "page_21", 40, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_21", 41, (0.05, 0.48, 0.95, 0.88))

    # Q42-43 (Trang 22): 2 câu
    crop_and_update("reading", "page_22", 42, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_22", 43, (0.05, 0.48, 0.95, 0.88))

    # Q44-45 (Trang 23): 2 câu
    crop_and_update("reading", "page_23", 44, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_23", 45, (0.05, 0.48, 0.95, 0.88))

    # Q46-47 (Trang 24): 2 câu
    crop_and_update("reading", "page_24", 46, (0.05, 0.08, 0.95, 0.48))
    crop_and_update("reading", "page_24", 47, (0.05, 0.48, 0.95, 0.88))

    # Q48-50 (Trang 25): 3 câu dai cuoi cung
    for q in [48, 49, 50]:
        crop_and_update("reading", "page_25", q, (0.0, 0.0, 1.0, 0.78), "shared")

    print("\n=========================================================")
    print("[SUCCESS] IMAGE CROPPING AND DATABASE UPDATE COMPLETE!")
    print("=========================================================")

if __name__ == "__main__":
    main()
