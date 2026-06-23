import json
import re
import sys
from pathlib import Path

from docx import Document


ANSWER_PREFIX = "\uc815\ub2f5:"
EXPLANATION_MARKER = "\ud574\uc124:"
CIRCLED = {
    "\u2460": 1,
    "\u2461": 2,
    "\u2462": 3,
    "\u2463": 4,
    "\u2464": 5,
}


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: extract-2026-teacher-answers.py <teacher.docx>")

    paragraphs = [
        " ".join(paragraph.text.split())
        for paragraph in Document(sys.argv[1]).paragraphs
    ]
    answers = []
    current = None

    for text in paragraphs:
        question_match = re.match(r"^(\d{1,2})\.\s+", text)
        if question_match:
            current = int(question_match.group(1))
        if not current or not text.startswith(ANSWER_PREFIX):
            continue

        answer_part, separator, explanation = text.partition(EXPLANATION_MARKER)
        if not separator:
            continue
        mark = next((char for char in answer_part if char in CIRCLED), None)
        if mark is None:
            continue
        answers.append((current, CIRCLED[mark]))

    if [number for number, _answer in answers] != list(range(1, 71)):
        raise ValueError(f"Expected sequential answers 1-70, got {len(answers)}")

    output = {
        "source": Path(sys.argv[1]).name,
        "answers": [answer for _number, answer in answers],
    }
    output_path = Path(__file__).resolve().parents[1] / "data" / "teacher-2026-1-answers.json"
    output_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {output_path}: {len(answers)} answers")


if __name__ == "__main__":
    main()
