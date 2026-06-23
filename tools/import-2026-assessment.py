import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader


EXAM_ID = "2026_1"
OPTION_MARKS = "①②③④⑤"
WIDTH = 1200
SIDE = 72
TOP = 58
BOTTOM = 58
LINE_GAP = 13
FONT_PATH = r"C:\Windows\Fonts\malgun.ttf"
FONT_BOLD_PATH = r"C:\Windows\Fonts\malgunbd.ttf"


def extract_questions(pdf_path):
    text = "\n".join((page.extract_text() or "") for page in PdfReader(pdf_path).pages)
    text = re.sub(r"학번:\s*이름:", " ", text)
    markers = list(re.finditer(r"(?<!\d)(\d{1,2})\.\s*", text))
    start = next(
        index
        for index in range(len(markers) - 69)
        if [int(item.group(1)) for item in markers[index:index + 70]] == list(range(1, 71))
    )
    selected = markers[start:start + 70]
    end = markers[start + 70].start() if start + 70 < len(markers) else len(text)

    questions = []
    for index, marker in enumerate(selected):
        chunk_end = selected[index + 1].start() if index + 1 < len(selected) else end
        chunk = re.sub(r"\s+", " ", text[marker.end():chunk_end]).strip()
        parts = re.split(f"([{OPTION_MARKS}])", chunk)
        stem = parts[0].strip()
        options = []
        for part_index in range(1, len(parts), 2):
            mark = parts[part_index]
            option = parts[part_index + 1].strip() if part_index + 1 < len(parts) else ""
            options.append(f"{mark} {option}")
        if len(options) != 5:
            raise ValueError(f"Question {index + 1} has {len(options)} options")
        questions.append({"qno": index + 1, "stem": stem, "options": options})
    return questions


def wrap_pixels(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        if draw.textlength(word, font=font) <= max_width:
            current = word
            continue
        current = ""
        segment = ""
        for char in word:
            candidate = segment + char
            if draw.textlength(candidate, font=font) <= max_width:
                segment = candidate
            else:
                if segment:
                    lines.append(segment)
                segment = char
        current = segment
    if current:
        lines.append(current)
    return lines or [""]


def render_question(question, output_path):
    title_font = ImageFont.truetype(FONT_BOLD_PATH, 38)
    option_font = ImageFont.truetype(FONT_PATH, 32)
    probe = Image.new("RGB", (WIDTH, 200), "white")
    draw = ImageDraw.Draw(probe)
    max_width = WIDTH - SIDE * 2
    title_lines = wrap_pixels(
        draw, f"{question['qno']}. {question['stem']}", title_font, max_width
    )
    option_lines = [
        wrap_pixels(draw, option, option_font, max_width - 10)
        for option in question["options"]
    ]
    title_height = len(title_lines) * 54
    options_height = sum(len(lines) * 45 + 18 for lines in option_lines)
    height = max(500, TOP + title_height + 32 + options_height + BOTTOM)

    image = Image.new("RGB", (WIDTH, height), "#ffffff")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (2, 2, WIDTH - 3, height - 3),
        radius=14,
        outline="#d9e0e7",
        width=3,
    )
    y = TOP
    for line in title_lines:
        draw.text((SIDE, y), line, font=title_font, fill="#17202a")
        y += 54
    y += 26
    draw.line((SIDE, y, WIDTH - SIDE, y), fill="#d9e0e7", width=2)
    y += 28
    for lines in option_lines:
        for line in lines:
            draw.text((SIDE + 6, y), line, font=option_font, fill="#263442")
            y += 45
        y += 18
    image.save(output_path, optimize=True)


def update_question_data(root, questions):
    data_path = root / "data" / "question-2026-1.json"
    rows = [
        {
            "path": f"assets/exams/{EXAM_ID}/{question['qno']}.png",
            "text": (
                f"{question['qno']}. {question['stem']}\n"
                + "\n".join(question["options"])
            ),
        }
        for question in questions
    ]
    data_path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: import-2026-assessment.py <source.pdf>")
    pdf_path = Path(sys.argv[1])
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "assets" / "exams" / EXAM_ID
    output_dir.mkdir(parents=True, exist_ok=True)

    questions = extract_questions(pdf_path)
    for question in questions:
        render_question(question, output_dir / f"{question['qno']}.png")
    update_question_data(root, questions)
    print(f"Created {len(questions)} questions in {output_dir}")


if __name__ == "__main__":
    main()
