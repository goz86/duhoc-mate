import os
import json
import numpy as np
from PIL import Image, ImageDraw

# Directory paths
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTENING_DIR = os.path.join(ROOT, "public", "topik_exams", "ky_96", "listening")
CLEAN_DIR = os.path.join(ROOT, "public", "topik_exams", "ky_96", "clean", "listening")
REVIEW_DIR = os.path.join(ROOT, "scripts", "crop_review", "topik96_listening_clean")
os.makedirs(CLEAN_DIR, exist_ok=True)
os.makedirs(REVIEW_DIR, exist_ok=True)

CANVAS_LEFT = 95
CANVAS_RIGHT = 1565
PAD_X = 26
PAD_Y = 22
JOIN_GAP = 22

def find_dark_lines(gray, y_start, y_end):
    lines = []
    for y in range(y_start, y_end):
        row = gray[y, CANVAS_LEFT:CANVAS_RIGHT]
        if np.mean(row < 120) > 0.6:
            lines.append(y)
            
    grouped_lines = []
    if lines:
        curr = [lines[0]]
        for l in lines[1:]:
            if l - curr[-1] < 5:
                curr.append(l)
            else:
                grouped_lines.append(int(np.mean(curr)))
                curr = [l]
        grouped_lines.append(int(np.mean(curr)))
        
    return grouped_lines

def find_text_bands(gray, y_start, y_end):
    in_text = False
    start_y = -1
    bands = []
    for y in range(y_start, y_end):
        row = gray[y, CANVAS_LEFT:CANVAS_RIGHT]
        has_ink = np.sum(row < 232) > 5
        if has_ink and not in_text:
            in_text = True
            start_y = y
        elif not has_ink and in_text:
            if y - start_y > 4:
                bands.append((start_y, y))
            in_text = False
            
    merged = []
    for b in bands:
        if not merged:
            merged.append(b)
        else:
            prev = merged[-1]
            if b[0] - prev[1] < 18:
                merged[-1] = (prev[0], b[1])
            else:
                merged.append(b)
    return merged

def normalize_range(r):
    if len(r) == 2:
        y1, y2 = r
        return CANVAS_LEFT, y1, CANVAS_RIGHT, y2
    if len(r) == 4:
        x1, y1, x2, y2 = r
        return x1, y1, x2, y2
    raise ValueError(f"Invalid crop range: {r}")

def crop_and_compose(page, y_ranges, output_path):
    img_path = os.path.join(LISTENING_DIR, f"page_{page:02d}.jpg")
    img = Image.open(img_path).convert("RGB")
    
    parts = []
    for crop_range in y_ranges:
        x1, y1, x2, y2 = normalize_range(crop_range)
        part = img.crop((x1, y1, x2, y2))
        parts.append(part)
        
    # Compose them
    width = max(part.width for part in parts) + (PAD_X * 2)
    height = sum(part.height for part in parts) + (JOIN_GAP * (len(parts) - 1)) + (PAD_Y * 2)
    canvas = Image.new("RGB", (width, height), "white")
    y_offset = PAD_Y
    for part in parts:
        x_offset = (width - part.width) // 2
        canvas.paste(part, (x_offset, y_offset))
        y_offset += part.height + JOIN_GAP
        
    canvas.save(output_path, "JPEG", quality=94, optimize=True)
    return canvas.size

def find_best_box(lines_list, y_min, y_max):
    sub_lines = [l for l in lines_list if y_min <= l <= y_max]
    best_t, best_b = None, None
    best_d = 0
    for i in range(len(sub_lines)):
        for j in range(i+1, len(sub_lines)):
            d = sub_lines[j] - sub_lines[i]
            if d > 100 and d > best_d:
                best_d = d
                best_t, best_b = sub_lines[i], sub_lines[j]
    return best_t, best_b

def main():
    print("Starting TOPIK 96 Listening Clean Crop...")
    
    questions_map = {}
    
    # Q1-Q3: Keep the full page content of drawings/graphics but strip header/footer
    q123_ranges = {
        1: [(400, 1540)],
        2: [(220, 260, 1590, 1305)],
        3: [(220, 340, 1590, 1665)]
    }
    for q in [1, 2, 3]:
        output_name = f"q{q:03d}.jpg"
        out_path = os.path.join(CLEAN_DIR, output_name)
        ranges = q123_ranges[q]
        size = crop_and_compose(q, ranges, out_path)
        questions_map[str(q)] = {
            "image": f"/topik_exams/ky_96/clean/listening/{output_name}",
            "pieces": [{"page": q, "x1": normalize_range(r)[0], "y1": normalize_range(r)[1], "x2": normalize_range(r)[2], "y2": normalize_range(r)[3]} for r in ranges],
            "size": {"width": size[0], "height": size[1]}
        }
        print(f"Q{q:02d}: Page {q}, ranges {ranges}")

    # Q4-Q6 (Page 4): 3 single dialogue boxes
    page = 4
    img_path = os.path.join(LISTENING_DIR, f"page_{page:02d}.jpg")
    img = Image.open(img_path)
    gray = np.asarray(img.convert('L'))
    grouped_lines = find_dark_lines(gray, 300, 1950)
    
    b1_top, b1_bottom = find_best_box(grouped_lines, 300, 800)
    b2_top, b2_bottom = find_best_box(grouped_lines, 900, 1400)
    b3_top, b3_bottom = find_best_box(grouped_lines, 1500, 1950)
    
    # Fallback if detection fails
    if b1_bottom is None: b1_top, b1_bottom = 390, 570
    if b2_bottom is None: b2_top, b2_bottom = 1040, 1220
    if b3_bottom is None: b3_top, b3_bottom = 1680, 1860
    
    q4_ranges = [(220, 245, 1590, b1_bottom + 18)] # start from 245 to catch instruction
    q5_ranges = [(220, b2_top - 35, 1590, b2_bottom + 18)]
    q6_ranges = [(b3_top - 80, b3_bottom + 8)]
    
    for q_num, ranges in [(4, q4_ranges), (5, q5_ranges), (6, q6_ranges)]:
        output_name = f"q{q_num:03d}.jpg"
        out_path = os.path.join(CLEAN_DIR, output_name)
        size = crop_and_compose(page, ranges, out_path)
        questions_map[str(q_num)] = {
            "image": f"/topik_exams/ky_96/clean/listening/{output_name}",
            "pieces": [{"page": page, "x1": normalize_range(r)[0], "y1": normalize_range(r)[1], "x2": normalize_range(r)[2], "y2": normalize_range(r)[3]} for r in ranges],
            "size": {"width": size[0], "height": size[1]}
        }
        print(f"Q{q_num:02d}: Page {page}, ranges {ranges}")

    # Q7-Q20 (Pages 5-11): 2 single questions per page
    for page in range(5, 12):
        q_odd = 7 + (page - 5) * 2
        q_even = q_odd + 1
        
        img_path = os.path.join(LISTENING_DIR, f"page_{page:02d}.jpg")
        img = Image.open(img_path)
        gray = np.asarray(img.convert('L'))
        grouped_lines = find_dark_lines(gray, 200, 1600)
        
        b1_top, b1_bottom = find_best_box(grouped_lines, 200, 850)
        b2_top, b2_bottom = find_best_box(grouped_lines, 850, 1600)
        
        # Fallbacks
        if b1_bottom is None: b1_top, b1_bottom = 285, 600
        if b2_bottom is None: b2_top, b2_bottom = 1000, 1400
        
        q_odd_start = max(245, b1_top - 80)
        q_odd_ranges = [(q_odd_start, b1_bottom + 8)]
        q_even_ranges = [(b2_top - 80, b2_bottom + 8)]
        
        for q_num, ranges in [(q_odd, q_odd_ranges), (q_even, q_even_ranges)]:
            output_name = f"q{q_num:03d}.jpg"
            out_path = os.path.join(CLEAN_DIR, output_name)
            size = crop_and_compose(page, ranges, out_path)
            questions_map[str(q_num)] = {
                "image": f"/topik_exams/ky_96/clean/listening/{output_name}",
                "pieces": [{"page": page, "y1": r[0], "y2": r[1]} for r in ranges],
                "size": {"width": size[0], "height": size[1]}
            }
            print(f"Q{q_num:02d}: Page {page}, ranges {ranges}")

    # Q21-Q50 (Pages 12-26): 2 questions per page sharing a dialogue box
    for page in range(12, 27):
        q_odd = 21 + (page - 12) * 2
        q_even = q_odd + 1
        
        img_path = os.path.join(LISTENING_DIR, f"page_{page:02d}.jpg")
        img = Image.open(img_path)
        gray = np.asarray(img.convert('L'))
        
        # Find bottom of dialogue box
        dialogue_bottom_y = None
        for y in range(600, 1100):
            row = gray[y, CANVAS_LEFT:CANVAS_RIGHT]
            if np.mean(row < 120) > 0.6:
                dialogue_bottom_y = y
                break
                
        if dialogue_bottom_y is None:
            for y in range(350, 1100):
                row = gray[y, CANVAS_LEFT:CANVAS_RIGHT]
                if np.mean(row < 120) > 0.6:
                    dialogue_bottom_y = y
                    break
                    
        # Fallback dialogue bottom
        if dialogue_bottom_y is None:
            dialogue_bottom_y = 900
            
        # Find text bands below dialogue_bottom_y
        bands = find_text_bands(gray, dialogue_bottom_y + 10, gray.shape[0] - 100)
        
        if len(bands) < 6:
            # Fallback bands if detection fails
            odd_q_range = (dialogue_bottom_y + 80, dialogue_bottom_y + 130)
            even_q_range = (dialogue_bottom_y + 450, dialogue_bottom_y + 500)
        else:
            odd_q_band = bands[0]
            even_q_band = bands[5] if len(bands) > 5 else bands[-1]
            odd_q_range = (odd_q_band[0] - 12, odd_q_band[1] + 12)
            even_q_range = (even_q_band[0] - 12, even_q_band[1] + 12)
            
        dialogue_range = (245, dialogue_bottom_y + 8)
        
        # Compose odd question
        output_name_odd = f"q{q_odd:03d}.jpg"
        out_path_odd = os.path.join(CLEAN_DIR, output_name_odd)
        size_odd = crop_and_compose(page, [dialogue_range, odd_q_range], out_path_odd)
        questions_map[str(q_odd)] = {
            "image": f"/topik_exams/ky_96/clean/listening/{output_name_odd}",
            "pieces": [{"page": page, "y1": dialogue_range[0], "y2": dialogue_range[1]},
                       {"page": page, "y1": odd_q_range[0], "y2": odd_q_range[1]}],
            "size": {"width": size_odd[0], "height": size_odd[1]}
        }
        
        # Compose even question
        output_name_even = f"q{q_even:03d}.jpg"
        out_path_even = os.path.join(CLEAN_DIR, output_name_even)
        size_even = crop_and_compose(page, [dialogue_range, even_q_range], out_path_even)
        questions_map[str(q_even)] = {
            "image": f"/topik_exams/ky_96/clean/listening/{output_name_even}",
            "pieces": [{"page": page, "y1": dialogue_range[0], "y2": dialogue_range[1]},
                       {"page": page, "y1": even_q_range[0], "y2": even_q_range[1]}],
            "size": {"width": size_even[0], "height": size_even[1]}
        }
        print(f"Q{q_odd:02d}: Page {page}, dialogue {dialogue_range}, odd_q {odd_q_range}")
        print(f"Q{q_even:02d}: Page {page}, dialogue {dialogue_range}, even_q {even_q_range}")

    # Save mapping file
    mapping_data = {
        "session": 96,
        "section": "listening",
        "source": "client/public/topik_exams/ky_96/listening/page_XX.jpg",
        "outputDir": "/topik_exams/ky_96/clean/listening",
        "questions": questions_map
    }
    
    map_path = os.path.join(ROOT, "scripts", "topik96_listening_clean_map.json")
    with open(map_path, "w", encoding="utf-8") as f:
        json.dump(mapping_data, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote clean map to: {map_path}")
    
    # Save overlay review images for visual verification
    print("Generating overlays for review...")
    for q_num_str, q_info in questions_map.items():
        q_num = int(q_num_str)
        pieces = q_info["pieces"]
        
        by_page = {}
        for piece in pieces:
            by_page.setdefault(piece["page"], []).append(piece)
            
        for page, page_pieces in by_page.items():
            img_path = os.path.join(LISTENING_DIR, f"page_{page:02d}.jpg")
            img = Image.open(img_path).convert("RGB")
            draw = ImageDraw.Draw(img)
            
            for p_info in page_pieces:
                x1 = p_info.get("x1", CANVAS_LEFT)
                x2 = p_info.get("x2", CANVAS_RIGHT)
                draw.rectangle((x1, p_info["y1"], x2, p_info["y2"]), outline=(255, 0, 0), width=4)
                draw.text((x1 + 8, p_info["y1"] + 8), f"Q{q_num}", fill=(255, 0, 0))
                
            img.save(os.path.join(REVIEW_DIR, f"page_{page:02d}_overlay_q{q_num}.jpg"), "JPEG", quality=90)
            
    print("All overlays generated in:", REVIEW_DIR)

if __name__ == "__main__":
    main()
