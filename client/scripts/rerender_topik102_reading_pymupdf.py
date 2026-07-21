from __future__ import annotations

import json
import unicodedata
from pathlib import Path

import fitz
from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
EXAM_NO = 102
SOURCE_DIR = Path(r"C:\Users\Hhung\Downloads\102")
OUTPUT_DIR = ROOT / "public" / "topik_exams" / f"ky_{EXAM_NO}" / "clean" / "reading"
REVIEW_DIR = ROOT / "scripts" / "crop_review" / f"topik{EXAM_NO}_reading_clean"
MAP_PATH = ROOT / "scripts" / f"topik{EXAM_NO}_reading_clean_map.json"

BASE_PAGE_WIDTH = 1786
CROP_X1 = 95
CROP_X2 = 1565
PAD_X = 26
PAD_Y = 22
JOIN_GAP = 22


def p(page: int, y1: int, y2: int) -> dict[str, int]:
    return {"page": page, "y1": y1, "y2": y2}


CROP_MANIFEST: dict[int, list[dict[str, int]]] = {
    1: [p(5, 405, 650)], 2: [p(5, 760, 975)], 3: [p(5, 1160, 1445)], 4: [p(5, 1570, 1795)],
    5: [p(6, 265, 720)], 6: [p(6, 800, 1185)], 7: [p(6, 1285, 1665)], 8: [p(6, 1785, 2145)],
    9: [p(7, 260, 920)], 10: [p(7, 1260, 1950)], 11: [p(8, 260, 720)], 12: [p(8, 1110, 1495)],
    13: [p(9, 260, 655)], 14: [p(9, 910, 1230)], 15: [p(9, 1480, 1815)],
    16: [p(10, 260, 660)], 17: [p(10, 930, 1305)], 18: [p(10, 1570, 1945)],
    19: [p(11, 260, 785)], 20: [p(11, 260, 785)],
    21: [p(12, 260, 790)], 22: [p(12, 260, 790)],
    23: [p(13, 260, 1135)], 24: [p(13, 260, 1135)],
    25: [p(14, 260, 745)], 26: [p(14, 860, 1255)], 27: [p(14, 1385, 1760)],
    28: [p(15, 260, 730)], 29: [p(15, 1120, 1550)], 30: [p(16, 260, 785)], 31: [p(16, 1170, 1615)],
    32: [p(17, 260, 785)], 33: [p(17, 1180, 1625)], 34: [p(18, 260, 785)], 35: [p(18, 1235, 1740)],
    36: [p(19, 250, 720)], 37: [p(19, 1085, 1540)], 38: [p(20, 250, 785)],
    39: [p(20, 1235, 1980)], 40: [p(21, 260, 965)], 41: [p(21, 1175, 1820)],
    42: [p(22, 250, 1305)], 43: [p(22, 250, 1305)],
    44: [p(23, 260, 1030)], 45: [p(23, 260, 1030)], 46: [p(24, 260, 1095)], 47: [p(24, 260, 1095)],
    48: [p(25, 250, 1160)], 49: [p(25, 250, 1160)], 50: [p(25, 250, 1160)],
}


def normalize_name(value: str) -> str:
    text = unicodedata.normalize("NFD", value)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.lower().replace("đ", "d")


def find_reading_pdf() -> Path:
    candidates = [path for path in SOURCE_DIR.glob("*.pdf") if "dap" not in normalize_name(path.name)]
    if len(candidates) != 1:
        raise RuntimeError(f"Expected one reading PDF, got: {candidates}")
    return candidates[0]


def render_piece(doc: fitz.Document, piece: dict[str, int]) -> Image.Image:
    page = doc[piece["page"] - 1]
    zoom = BASE_PAGE_WIDTH / page.rect.width
    matrix = fitz.Matrix(zoom, zoom)
    clip = fitz.Rect(
        CROP_X1 / zoom,
        piece["y1"] / zoom,
        CROP_X2 / zoom,
        piece["y2"] / zoom,
    )
    pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False, annots=False)
    image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    image = ImageEnhance.Contrast(image).enhance(1.08)
    image = ImageEnhance.Sharpness(image).enhance(1.25)
    return image


def compose_question(doc: fitz.Document, pieces: list[dict[str, int]]) -> Image.Image:
    rendered = [render_piece(doc, piece) for piece in pieces]
    width = (CROP_X2 - CROP_X1) + PAD_X * 2
    height = sum(img.height for img in rendered) + JOIN_GAP * (len(rendered) - 1) + PAD_Y * 2
    out = Image.new("RGB", (width, height), "white")
    y = PAD_Y
    for image in rendered:
        out.paste(image, (PAD_X, y))
        y += image.height + JOIN_GAP
    return out


def create_contact_sheet() -> None:
    cell_w, cell_h = 320, 260
    sheet = Image.new("RGB", (cell_w * 5, cell_h * 10), "#f6f1eb")
    for q_num in range(1, 51):
        image = Image.open(OUTPUT_DIR / f"q{q_num:03}.png").convert("RGB")
        image.thumbnail((cell_w - 20, cell_h - 42), Image.Resampling.LANCZOS)
        x = ((q_num - 1) % 5) * cell_w
        y = ((q_num - 1) // 5) * cell_h
        sheet.paste(image, (x + (cell_w - image.width) // 2, y + 34))
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(REVIEW_DIR / "contact_sheet.jpg", quality=94)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = find_reading_pdf()
    doc = fitz.open(pdf_path)
    mapping = {
        "session": EXAM_NO,
        "section": "reading",
        "source": str(pdf_path),
        "outputDir": f"/topik_exams/ky_{EXAM_NO}/clean/reading",
        "renderer": "pymupdf",
        "questions": {},
    }
    for q_num, pieces in CROP_MANIFEST.items():
        image = compose_question(doc, pieces)
        out_name = f"q{q_num:03}.png"
        image.save(OUTPUT_DIR / out_name, optimize=True)
        mapping["questions"][str(q_num)] = {
            "image": f"/topik_exams/ky_{EXAM_NO}/clean/reading/{out_name}",
            "pieces": pieces,
            "size": {"width": image.width, "height": image.height},
        }
    MAP_PATH.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    create_contact_sheet()
    print(f"Rendered TOPIK {EXAM_NO} reading with PyMuPDF -> {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
