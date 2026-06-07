from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
READING_DIR = ROOT / "public" / "topik_exams" / "ky_96" / "reading"
CLEAN_DIR = ROOT / "public" / "topik_exams" / "ky_96" / "clean" / "reading"
REVIEW_DIR = ROOT / "scripts" / "crop_review" / "topik96_reading_clean"
MAP_PATH = ROOT / "scripts" / "topik96_reading_clean_map.json"

CANVAS_LEFT = 95
CANVAS_RIGHT = 1565
PAD_X = 26
PAD_Y = 22
JOIN_GAP = 22


@dataclass(frozen=True)
class Piece:
    page: int
    y1: int
    y2: int


@dataclass(frozen=True)
class QuestionCrop:
    number: int
    pieces: tuple[Piece, ...]


def p(page: int, y1: int, y2: int) -> Piece:
    return Piece(page=page, y1=y1, y2=y2)


# The source pages are scanned images, so the crop manifest is reviewed in pixel
# coordinates against 1653x2337 source renders. Shared passages are duplicated by
# composing context pieces with the active question piece.
QUESTION_CROPS: tuple[QuestionCrop, ...] = (
    QuestionCrop(1, (p(5, 370, 620),)),
    QuestionCrop(2, (p(5, 650, 980),)),
    QuestionCrop(3, (p(5, 1030, 1460),)),
    QuestionCrop(4, (p(5, 1510, 1920),)),
    QuestionCrop(5, (p(6, 300, 820),)),
    QuestionCrop(6, (p(6, 830, 1320),)),
    QuestionCrop(7, (p(6, 1310, 1820),)),
    QuestionCrop(8, (p(6, 1820, 2280),)),
    QuestionCrop(9, (p(7, 300, 815),)),
    QuestionCrop(10, (p(7, 1260, 1930),)),
    QuestionCrop(11, (p(8, 300, 730),)),
    QuestionCrop(12, (p(8, 1110, 1530),)),
    QuestionCrop(13, (p(9, 300, 670),)),
    QuestionCrop(14, (p(9, 930, 1260),)),
    QuestionCrop(15, (p(9, 1500, 1860),)),
    QuestionCrop(16, (p(10, 300, 748),)),
    QuestionCrop(17, (p(10, 930, 1410),)),
    QuestionCrop(18, (p(10, 1540, 2065),)),
    QuestionCrop(19, (p(11, 300, 785), p(11, 830, 890))),
    QuestionCrop(20, (p(11, 300, 785), p(11, 1015, 1085))),
    QuestionCrop(21, (p(12, 300, 795), p(12, 815, 930))),
    QuestionCrop(22, (p(12, 300, 795), p(12, 1300, 1390))),
    QuestionCrop(23, (p(13, 300, 1175), p(13, 1220, 1276))),
    QuestionCrop(24, (p(13, 300, 1175), p(13, 1570, 1645))),
    QuestionCrop(25, (p(14, 300, 880),)),
    QuestionCrop(26, (p(14, 900, 1400),)),
    QuestionCrop(27, (p(14, 1420, 1950),)),
    QuestionCrop(28, (p(15, 300, 740),)),
    QuestionCrop(29, (p(15, 1110, 1532),)),
    QuestionCrop(30, (p(16, 300, 740),)),
    QuestionCrop(31, (p(16, 1110, 1532),)),
    QuestionCrop(32, (p(17, 300, 805),)),
    QuestionCrop(33, (p(17, 1170, 1660),)),
    QuestionCrop(34, (p(18, 300, 748),)),
    QuestionCrop(35, (p(18, 1210, 1686),)),
    QuestionCrop(36, (p(19, 260, 666),)),
    QuestionCrop(37, (p(19, 1040, 1518),)),
    QuestionCrop(38, (p(20, 300, 805),)),
    QuestionCrop(39, (p(20, 1310, 1535), p(20, 1550, 2000))),
    QuestionCrop(40, (p(21, 270, 395), p(21, 410, 860))),
    QuestionCrop(41, (p(21, 1065, 1195), p(21, 1205, 1660))),
    QuestionCrop(42, (p(22, 300, 1450),)),
    QuestionCrop(43, (p(22, 300, 1450),)),
    QuestionCrop(44, (p(23, 300, 1060),)),
    QuestionCrop(45, (p(23, 300, 1060),)),
    QuestionCrop(46, (p(24, 300, 1135),)),
    QuestionCrop(47, (p(24, 300, 1135),)),
    QuestionCrop(48, (p(25, 300, 1265),)),
    QuestionCrop(49, (p(25, 300, 1265),)),
    QuestionCrop(50, (p(25, 300, 1265),)),
)


def source_path(page: int) -> Path:
    return READING_DIR / f"page_{page:02d}.jpg"


def open_source(page: int) -> Image.Image:
    path = source_path(page)
    if not path.exists():
        raise FileNotFoundError(path)
    return Image.open(path).convert("RGB")


def tighten_vertical(image: Image.Image, y1: int, y2: int) -> tuple[int, int]:
    gray = np.asarray(image.convert("L"))
    y1 = max(0, min(image.height - 1, y1))
    y2 = max(y1 + 1, min(image.height, y2))
    crop = gray[y1:y2, CANVAS_LEFT:CANVAS_RIGHT]
    ink_rows = np.where((crop < 232).sum(axis=1) > 4)[0]
    if len(ink_rows) == 0:
        return y1, y2
    top = max(0, y1 + int(ink_rows[0]) - PAD_Y)
    bottom = min(image.height, y1 + int(ink_rows[-1]) + PAD_Y)
    return top, bottom


def crop_piece(piece: Piece) -> Image.Image:
    image = open_source(piece.page)
    top, bottom = tighten_vertical(image, piece.y1, piece.y2)
    return image.crop((CANVAS_LEFT, top, CANVAS_RIGHT, bottom))


def compose_question(question: QuestionCrop) -> Image.Image:
    parts = [crop_piece(piece) for piece in question.pieces]
    width = max(part.width for part in parts) + (PAD_X * 2)
    height = sum(part.height for part in parts) + (JOIN_GAP * (len(parts) - 1)) + (PAD_Y * 2)
    canvas = Image.new("RGB", (width, height), "white")
    y = PAD_Y
    for part in parts:
        x = (width - part.width) // 2
        canvas.paste(part, (x, y))
        y += part.height + JOIN_GAP
    return canvas


def draw_review_overlays(crops: Iterable[QuestionCrop]) -> None:
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    by_page: dict[int, list[tuple[int, Piece]]] = {}
    for crop in crops:
        for piece in crop.pieces:
            by_page.setdefault(piece.page, []).append((crop.number, piece))

    for page, pieces in by_page.items():
        image = open_source(page)
        draw = ImageDraw.Draw(image)
        for number, piece in pieces:
            color = (255, 0, 0) if len(pieces) < 8 else (30, 90, 255)
            draw.rectangle((CANVAS_LEFT, piece.y1, CANVAS_RIGHT, piece.y2), outline=color, width=4)
            draw.text((CANVAS_LEFT + 8, piece.y1 + 8), f"Q{number}", fill=color)
        image.save(REVIEW_DIR / f"page_{page:02d}_overlay.jpg", "JPEG", quality=90)


def main() -> None:
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    draw_review_overlays(QUESTION_CROPS)

    mapping = {
        "session": 96,
        "section": "reading",
        "source": "client/public/topik_exams/ky_96/reading/page_XX.jpg",
        "outputDir": "/topik_exams/ky_96/clean/reading",
        "questions": {},
    }

    for question in QUESTION_CROPS:
        output_name = f"q{question.number:03d}.jpg"
        output_path = CLEAN_DIR / output_name
        image = compose_question(question)
        image.save(output_path, "JPEG", quality=94, optimize=True)
        mapping["questions"][str(question.number)] = {
            "image": f"/topik_exams/ky_96/clean/reading/{output_name}",
            "pieces": [{"page": piece.page, "y1": piece.y1, "y2": piece.y2} for piece in question.pieces],
            "size": {"width": image.width, "height": image.height},
        }
        print(f"[OK] Q{question.number:02d} -> {output_path.relative_to(ROOT)} {image.width}x{image.height}")

    MAP_PATH.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] wrote {MAP_PATH.relative_to(ROOT)}")
    print(f"[OK] overlays: {REVIEW_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
