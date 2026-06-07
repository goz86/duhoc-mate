import argparse
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
SCRIPT_DIR = ROOT / "scripts"
BASE_WIDTH = 1786
RENDER_WIDTH = 3572
CROP_X1 = 95
CROP_X2 = 1565
PAD_X = 52
PAD_Y = 44
JOIN_GAP = 44


def p(page, y1, y2):
    return {"page": page, "y1": y1, "y2": y2}


BASE_OLD = {
    1: [p(5, 395, 705)], 2: [p(5, 820, 1040)], 3: [p(5, 1240, 1510)], 4: [p(5, 1650, 1860)],
    5: [p(6, 285, 695)], 6: [p(6, 840, 1165)], 7: [p(6, 1320, 1665)], 8: [p(6, 1800, 2135)],
    9: [p(7, 300, 895)], 10: [p(7, 1320, 1955)],
    11: [p(8, 245, 655)], 12: [p(8, 1020, 1425)],
    13: [p(9, 330, 675)], 14: [p(9, 910, 1260)], 15: [p(9, 1490, 1840)],
    16: [p(10, 395, 805)], 17: [p(10, 1040, 1455)], 18: [p(10, 1685, 2100)],
    19: [p(11, 220, 810)], 20: [p(11, 220, 810)],
    21: [p(12, 220, 810), p(12, 800, 950)], 22: [p(12, 220, 810), p(12, 1260, 1410)],
    23: [p(13, 330, 1190), p(13, 1200, 1305)], 24: [p(13, 330, 1190), p(13, 1535, 1665)],
    25: [p(14, 300, 890)], 26: [p(14, 885, 1415)], 27: [p(14, 1400, 1965)],
    28: [p(15, 395, 810)], 29: [p(15, 1165, 1580)], 30: [p(16, 245, 655)], 31: [p(16, 1020, 1425)],
    32: [p(17, 330, 735)], 33: [p(17, 1105, 1575)], 34: [p(18, 245, 720)], 35: [p(18, 1225, 1645)],
    36: [p(19, 245, 655)], 37: [p(19, 1020, 1430)], 38: [p(20, 245, 720)],
    39: [p(20, 1290, 1945)], 40: [p(21, 245, 1015)], 41: [p(21, 1180, 1910)],
    42: [p(22, 330, 1570)], 43: [p(22, 330, 1570)],
    44: [p(23, 330, 1125)], 45: [p(23, 330, 1125)],
    46: [p(24, 330, 1365)], 47: [p(24, 330, 1365)],
    48: [p(25, 330, 1125)], 49: [p(25, 330, 1125)], 50: [p(25, 330, 1125)],
}


EXAM_OVERRIDES = {
    60: {
        9: [p(7, 270, 1260)],
        10: [p(7, 270, 320), p(7, 1365, 2240)],
        23: [p(13, 270, 1090), p(13, 1160, 1490)],
        24: [p(13, 270, 1090), p(13, 1620, 1965)],
        25: [p(14, 270, 735)],
        26: [p(14, 270, 330), p(14, 870, 1260)],
    },
    64: {
        2: [p(5, 475, 520), p(5, 780, 990)],
        4: [p(5, 1185, 1235), p(5, 1535, 1765)],
        5: [p(6, 320, 735)],
        6: [p(6, 320, 370), p(6, 850, 1185)],
        8: [p(6, 320, 370), p(6, 1770, 2095)],
        10: [p(7, 330, 370), p(7, 1280, 2165)],
        11: [p(8, 320, 635)], 12: [p(8, 975, 1355)],
        13: [p(9, 390, 715)], 14: [p(9, 935, 1260)], 15: [p(9, 1475, 1810)],
        16: [p(10, 455, 775)], 17: [p(10, 1000, 1320)], 18: [p(10, 1540, 1865)],
        19: [p(11, 330, 960)], 20: [p(11, 330, 740), p(11, 1070, 1370)],
        21: [p(12, 330, 1180)], 22: [p(12, 330, 805), p(12, 1300, 1615)],
        23: [p(13, 330, 1420)], 24: [p(13, 330, 1040), p(13, 1540, 1835)],
        26: [p(14, 330, 370), p(14, 885, 1265)],
        27: [p(14, 330, 370), p(14, 1380, 1725)],
        28: [p(15, 455, 835)], 29: [p(15, 1175, 1555)], 30: [p(16, 320, 755)], 31: [p(16, 1125, 1545)],
        32: [p(17, 385, 835)], 33: [p(17, 1175, 1615)], 34: [p(18, 320, 700)], 35: [p(18, 1175, 1555)],
        36: [p(19, 320, 755)], 37: [p(19, 1020, 1535)], 38: [p(20, 320, 755)],
        39: [p(20, 1180, 1900)], 40: [p(21, 320, 980)], 41: [p(21, 1125, 1580)],
        42: [p(22, 385, 1310)], 43: [p(22, 385, 1310)],
        44: [p(23, 385, 1015)], 45: [p(23, 385, 1015)],
        46: [p(24, 385, 1355)], 47: [p(24, 385, 1355)],
        48: [p(25, 385, 1190)], 49: [p(25, 385, 1190)], 50: [p(25, 385, 1190)],
    }
}


def find_pdf(source_dir: Path, exam: int) -> Path:
    candidates = [
        p for p in source_dir.glob(f"*{exam}*.pdf")
        if "정답" not in p.name and "answer" not in p.name.lower()
    ]
    if not candidates:
        raise FileNotFoundError(f"No reading PDF found for TOPIK {exam} in {source_dir}")
    return candidates[0]


def render_pages(pdf_path: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(pdf_path))
    zoom = RENDER_WIDTH / doc[0].rect.width
    matrix = fitz.Matrix(zoom, zoom)
    page_images = {}
    for page_no in range(1, doc.page_count + 1):
        pix = doc[page_no - 1].get_pixmap(matrix=matrix, alpha=False)
        out = out_dir / f"page_{page_no:02d}.png"
        pix.save(str(out))
        page_images[page_no] = out
    return page_images


def pieces_for(exam: int, question: int):
    pieces = EXAM_OVERRIDES.get(exam, {}).get(question, BASE_OLD[question])
    return pieces


def crop_question(page_images, pieces, out_path: Path):
    scale = RENDER_WIDTH / BASE_WIDTH
    crop_x1 = round(CROP_X1 * scale)
    crop_x2 = round(CROP_X2 * scale)
    pad_x = round(PAD_X * scale)
    pad_y = round(PAD_Y * scale)
    join_gap = round(JOIN_GAP * scale)

    crops = []
    for piece in pieces:
        img = Image.open(page_images[piece["page"]]).convert("RGB")
        y1 = round(piece["y1"] * scale)
        y2 = round(piece["y2"] * scale)
        crops.append(img.crop((crop_x1, y1, crop_x2, y2)))

    width = crops[0].width + pad_x * 2
    height = sum(c.height for c in crops) + join_gap * (len(crops) - 1) + pad_y * 2
    canvas = Image.new("RGB", (width, height), "white")
    y = pad_y
    for crop in crops:
        canvas.paste(crop, (pad_x, y))
        y += crop.height + join_gap

    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path, "PNG")
    return canvas.size


def create_contact_sheet(exam: int, clean_dir: Path, review_dir: Path):
    cols, rows = 5, 10
    cell_w, cell_h = 420, 320
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except OSError:
        font = None

    for q in range(1, 51):
        img = Image.open(clean_dir / f"q{q:03d}.png").convert("RGB")
        img.thumbnail((cell_w - 24, cell_h - 42), Image.Resampling.LANCZOS)
        col = (q - 1) % cols
        row = (q - 1) // cols
        x = col * cell_w + 12
        y = row * cell_h + 34
        draw.text((col * cell_w + 12, row * cell_h + 8), f"Q{q:02d}", fill=(0, 0, 0), font=font)
        sheet.paste(img, (x, y))

    review_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(review_dir / "contact_sheet.jpg", "JPEG", quality=92)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--exam", type=int, required=True)
    parser.add_argument("--source", default=r"C:\Users\Hhung\Downloads\64")
    args = parser.parse_args()

    source_dir = Path(args.source)
    pdf_path = find_pdf(source_dir, args.exam)
    page_dir = PUBLIC_DIR / "topik_exams" / f"ky_{args.exam}" / "reading"
    clean_dir = PUBLIC_DIR / "topik_exams" / f"ky_{args.exam}" / "clean" / "reading"
    review_dir = SCRIPT_DIR / "crop_review" / f"topik{args.exam}_reading_clean"
    map_path = SCRIPT_DIR / f"topik{args.exam}_reading_clean_map.json"

    page_images = render_pages(pdf_path, page_dir)
    mapping = {
        "session": args.exam,
        "section": "reading",
        "source": f"client/public/topik_exams/ky_{args.exam}/reading/page_XX.png",
        "outputDir": f"/topik_exams/ky_{args.exam}/clean/reading",
        "questions": {},
    }

    for q in range(1, 51):
        pieces = pieces_for(args.exam, q)
        out_path = clean_dir / f"q{q:03d}.png"
        size = crop_question(page_images, pieces, out_path)
        mapping["questions"][str(q)] = {
            "image": f"/topik_exams/ky_{args.exam}/clean/reading/q{q:03d}.png",
            "pieces": pieces,
            "size": {"width": size[0], "height": size[1]},
        }

    map_path.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    create_contact_sheet(args.exam, clean_dir, review_dir)
    print(f"[ok] rebuilt TOPIK {args.exam} crops")
    print(f"[ok] source pdf: {pdf_path.name.encode('unicode_escape').decode('ascii')}")
    print(f"[ok] contact sheet: {review_dir / 'contact_sheet.jpg'}")


if __name__ == "__main__":
    main()
