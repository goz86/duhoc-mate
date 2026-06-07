"""
TOPIK 83 Listening — Clean crop v2
Fixes Q21-Q50 to include FULL question text + all 4 options
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
LISTENING_DIR = ROOT / "public" / "topik_exams" / "ky_83" / "listening"
CLEAN_DIR = ROOT / "public" / "topik_exams" / "ky_83" / "clean" / "listening"
REVIEW_DIR = ROOT / "scripts" / "crop_review" / "topik83_listening_clean_v2"
MAP_PATH = ROOT / "scripts" / "topik83_listening_clean_map.json"

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


# Build the crop configurations
crops_list = []

# Q1-Q3: Keep the full page content but strip header/footer
crops_list.append(QuestionCrop(1, (p(1, 245, 2150),)))
crops_list.append(QuestionCrop(2, (p(2, 245, 2150),)))
crops_list.append(QuestionCrop(3, (p(3, 245, 2150),)))

# Q4-Q6 (Page 4): 3 single short questions
crops_list.append(QuestionCrop(4, (p(4, 245, 600),)))
crops_list.append(QuestionCrop(5, (p(4, 980, 1250),)))
crops_list.append(QuestionCrop(6, (p(4, 1630, 1910),)))

# Q7-Q20 (Pages 5-11): 2 single questions per page
for page_num in range(5, 12):
    q_odd = 7 + (page_num - 5) * 2
    q_even = q_odd + 1
    crops_list.append(QuestionCrop(q_odd, (p(page_num, 245, 650),)))
    crops_list.append(QuestionCrop(q_even, (p(page_num, 950, 1350),)))

# Q21-Q50 (Pages 12-26): Each page has a shared dialogue + 2 questions with 4 options each
# The layout per page is:
#   - Header/Instructions: ~y=100-200
#   - Shared Dialogue box: ~y=200-700 (varies by page, some dialogues are longer)
#   - Q_odd: question text + 4 options: ~y=700-1150
#   - Q_even: question text + 4 options: ~y=1250-1600
# We include the shared dialogue + the specific question's options
for page_num in range(12, 27):
    q_odd = 21 + (page_num - 12) * 2
    q_even = q_odd + 1
    # Odd question: Shared dialogue (245->700) + question text + all 4 options (700->1200)
    crops_list.append(QuestionCrop(q_odd, (p(page_num, 245, 700), p(page_num, 700, 1200))))
    # Even question: Shared dialogue (245->700) + question text + all 4 options (1220->1700)
    crops_list.append(QuestionCrop(q_even, (p(page_num, 245, 700), p(page_num, 1220, 1700))))

QUESTION_CROPS: tuple[QuestionCrop, ...] = tuple(crops_list)


def source_path(page: int) -> Path:
    return LISTENING_DIR / f"page_{page:02d}.jpg"


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
        "section": "listening",
        "source": "client/public/topik_exams/ky_83/listening/page_XX.jpg",
        "outputDir": "/topik_exams/ky_83/clean/listening",
        "questions": {},
    }

    for question in QUESTION_CROPS:
        output_name = f"q{question.number:03d}.jpg"
        output_path = CLEAN_DIR / output_name
        image = compose_question(question)
        image.save(output_path, "JPEG", quality=94, optimize=True)
        mapping["questions"][str(question.number)] = {
            "image": f"/topik_exams/ky_83/clean/listening/{output_name}",
            "pieces": [{"page": piece.page, "y1": piece.y1, "y2": piece.y2} for piece in question.pieces],
            "size": {"width": image.width, "height": image.height},
        }
        print(f"[OK] Q{question.number:02d} -> {output_path.relative_to(ROOT)} {image.width}x{image.height}")

    MAP_PATH.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] wrote {MAP_PATH.relative_to(ROOT)}")
    print(f"[OK] overlays: {REVIEW_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
