from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
READING_DIR = ROOT / "public" / "topik_exams" / "ky_83" / "reading"
CLEAN_DIR = ROOT / "public" / "topik_exams" / "ky_83" / "clean" / "reading"
REVIEW_DIR = ROOT / "scripts" / "crop_review" / "topik83_reading_clean"
MAP_PATH = ROOT / "scripts" / "topik83_reading_clean_map.json"

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
    QuestionCrop(1, (p(5, 360, 610),)),
    QuestionCrop(2, (p(5, 690, 915),)),
    QuestionCrop(3, (p(5, 1040, 1360),)),
    QuestionCrop(4, (p(5, 1440, 1670),)),
    QuestionCrop(5, (p(6, 245, 675),)),
    QuestionCrop(6, (p(6, 760, 1120),)),
    QuestionCrop(7, (p(6, 1200, 1570),)),
    QuestionCrop(8, (p(6, 1645, 2015),)),
    QuestionCrop(9, (p(7, 245, 1080),)),
    QuestionCrop(10, (p(7, 1180, 2035),)),
    QuestionCrop(11, (p(8, 245, 875),)),
    QuestionCrop(12, (p(8, 965, 1595),)),
    QuestionCrop(13, (p(9, 245, 760),)),
    QuestionCrop(14, (p(9, 850, 1300),)),
    QuestionCrop(15, (p(9, 1385, 1840),)),
    QuestionCrop(16, (p(10, 245, 760),)),
    QuestionCrop(17, (p(10, 850, 1360),)),
    QuestionCrop(18, (p(10, 1445, 1955),)),
    QuestionCrop(19, (p(11, 245, 745), p(11, 780, 925))),
    QuestionCrop(20, (p(11, 245, 745), p(11, 1025, 1365))),
    QuestionCrop(21, (p(12, 245, 745), p(12, 780, 1110))),
    QuestionCrop(22, (p(12, 245, 745), p(12, 1205, 1540))),
    QuestionCrop(23, (p(13, 245, 1040), p(13, 1065, 1400))),
    QuestionCrop(24, (p(13, 245, 1040), p(13, 1500, 1835))),
    QuestionCrop(25, (p(14, 245, 705),)),
    QuestionCrop(26, (p(14, 790, 1185),)),
    QuestionCrop(27, (p(14, 1270, 1665),)),
    QuestionCrop(28, (p(15, 245, 880),)),
    QuestionCrop(29, (p(15, 960, 1595),)),
    QuestionCrop(30, (p(16, 245, 880),)),
    QuestionCrop(31, (p(16, 960, 1595),)),
    QuestionCrop(32, (p(17, 245, 935),)),
    QuestionCrop(33, (p(17, 1010, 1655),)),
    QuestionCrop(34, (p(18, 245, 935),)),
    QuestionCrop(35, (p(18, 1060, 1785),)),
    QuestionCrop(36, (p(18, 1060, 1145), p(19, 245, 865))),
    QuestionCrop(37, (p(18, 1060, 1145), p(19, 940, 1645))),
    QuestionCrop(38, (p(18, 1060, 1145), p(20, 245, 935))),
    QuestionCrop(39, (p(20, 1040, 1850),)),
    QuestionCrop(40, (p(20, 1040, 1145), p(21, 245, 930))),
    QuestionCrop(41, (p(20, 1040, 1145), p(21, 990, 1750))),
    QuestionCrop(42, (p(22, 245, 1420), p(22, 1440, 1665))),
    QuestionCrop(43, (p(22, 245, 1420), p(22, 1750, 2095))),
    QuestionCrop(44, (p(23, 245, 980), p(23, 1005, 1360))),
    QuestionCrop(45, (p(23, 245, 980), p(23, 1430, 1780))),
    QuestionCrop(46, (p(24, 245, 1040), p(24, 1060, 1410))),
    QuestionCrop(47, (p(24, 245, 1040), p(24, 1485, 1835))),
    QuestionCrop(48, (p(25, 245, 1100), p(25, 1115, 1460))),
    QuestionCrop(49, (p(25, 245, 1100), p(25, 1490, 1725))),
    QuestionCrop(50, (p(25, 245, 1100), p(25, 1750, 2105))),
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
        "session": 83,
        "section": "reading",
        "source": "client/public/topik_exams/ky_83/reading/page_XX.jpg",
        "outputDir": "/topik_exams/ky_83/clean/reading",
        "questions": {},
    }

    for question in QUESTION_CROPS:
        output_name = f"q{question.number:03d}.jpg"
        output_path = CLEAN_DIR / output_name
        image = compose_question(question)
        image.save(output_path, "JPEG", quality=94, optimize=True)
        mapping["questions"][str(question.number)] = {
            "image": f"/topik_exams/ky_83/clean/reading/{output_name}",
            "pieces": [{"page": piece.page, "y1": piece.y1, "y2": piece.y2} for piece in question.pieces],
            "size": {"width": image.width, "height": image.height},
        }
        print(f"[OK] Q{question.number:02d} -> {output_path.relative_to(ROOT)} {image.width}x{image.height}")

    MAP_PATH.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] wrote {MAP_PATH.relative_to(ROOT)}")
    print(f"[OK] overlays: {REVIEW_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
