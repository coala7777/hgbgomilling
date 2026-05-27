import fs from "node:fs";

const questionPath = "data/question-ocr.json";
const sourcePath = "data/woongbo-ocr.json";
const outputPath = "data/explanations.js";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

const questions = readJson(questionPath);
const sourcePages = readJson(sourcePath)
  .map((page) => ({ page: page.page, text: clean(page.text || "") }))
  .filter((page) => page.text.length > 20);

const appSource = fs.readFileSync("app.js", "utf8");
const examsSource = appSource.match(/const EXAMS = (\{[\s\S]*?\n\});/)?.[1];
if (!examsSource) throw new Error("Could not find EXAMS in app.js");
const EXAMS = Function(`"use strict"; return (${examsSource});`)();

const stopwords = new Set([
  "다음", "가장", "대한", "것은", "것이", "있는", "없는", "아닌", "맞는", "옳은", "설명", "보기",
  "중", "때", "의", "를", "을", "이", "가", "은", "는", "으로", "에서", "하고", "하여",
]);

function clean(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function examAndQno(path) {
  const match = path.match(/assets\/exams\/([^/]+)\/(\d+)\.png$/);
  if (!match) throw new Error(`Bad question path: ${path}`);
  return { examId: match[1], qno: Number(match[2]) };
}

function normalizeOptionMarkers(text) {
  return clean(text)
    .replace(/(^|\n)\s*[lI]\s+/g, "$1① ")
    .replace(/(^|\n)\s*[@⑦]\s+/g, "$1② ")
    .replace(/(^|\n)\s*[.·]\s+/g, "$1④ ");
}

function optionsOf(text) {
  const normalized = normalizeOptionMarkers(text);
  const symbols = { "①": 1, "②": 2, "③": 3, "④": 4 };
  const options = {};
  [...normalized.matchAll(/([①②③④])\s*([\s\S]*?)(?=(?:\n?[①②③④]\s*)|$)/g)].forEach((match) => {
    options[symbols[match[1]]] = clean(match[2]).replace(/\s+/g, " ");
  });
  return options;
}

function stemOf(text) {
  const normalized = normalizeOptionMarkers(text);
  const optionStart = normalized.search(/[①②③④]/);
  return clean(optionStart >= 0 ? normalized.slice(0, optionStart) : normalized)
    .replace(/^\d+\s*/, "")
    .replace(/\s+/g, " ");
}

function tokensOf(text) {
  return [...new Set((clean(text).match(/[가-힣A-Za-z0-9]{2,}/g) || [])
    .map((token) => token.toLowerCase())
    .filter((token) => !stopwords.has(token) && !/^\d+$/.test(token))
    .slice(0, 28))];
}

function questionType(stem) {
  if (/틀린|아닌|옳지|적절하지|부적합|잘못|거리가 먼/.test(stem)) return "negative";
  if (/계산|구하|몇|얼마|회전수|절삭속도|이송|각도|테이퍼|공차|분할|동력|토크/.test(stem)) return "calculation";
  if (/옳은|맞는|적절|올바른|가장 알맞/.test(stem)) return "positive";
  return "concept";
}

function topicOf(text) {
  if (/열처리|담금질|뜨임|풀림|불림|경화|조직/.test(text)) return "열처리";
  if (/탄소강|합금강|주철|황동|청동|알루미늄|스테인리스|금속|재료|경도|강도|연신율|취성/.test(text)) return "기계 재료";
  if (/절삭속도|회전수|이송|절삭|커터|엔드밀|밀링|드릴|리머|탭|공구|바이트/.test(text)) return "절삭 가공";
  if (/기어|모듈|잇수|피치|분할|인덱스/.test(text)) return "기계 요소";
  if (/공차|끼워맞춤|허용차|치수|표면 거칠기/.test(text)) return "공차와 제도";
  if (/마이크로미터|버니어|다이얼|게이지|측정|정반/.test(text)) return "측정";
  if (/CNC|NC|G\d|M\d|좌표|보간|프로그램|서보/.test(text)) return "NC/CNC";
  if (/안전|보호구|재해|위험|감전|정리정돈|작업장/.test(text)) return "안전";
  if (/투상|제도|단면|중심선|숨은선|도면/.test(text)) return "기계 제도";
  if (/공작기계|선반|밀링머신|연삭기|보링|셰이퍼/.test(text)) return "공작 기계";
  return "기계 일반";
}

function findSource(questionText, answerText) {
  const queryTokens = tokensOf(`${questionText}\n${answerText}`);
  let best = { score: 0, page: null, text: "" };
  for (const page of sourcePages) {
    const lower = page.text.toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (lower.includes(token)) score += token.length >= 4 ? 2 : 1;
    }
    if (answerText && answerText.length >= 2 && lower.includes(answerText.toLowerCase())) score += 4;
    if (score > best.score) best = { score, page: page.page, text: page.text };
  }
  return best.score >= 3 ? best : null;
}

function sourceLabel(source) {
  return source ? `기계 일반_(웅보) ${source.page}쪽의 관련 설명을 기준으로 보면` : "교재 OCR에서 직접 대응 문단은 찾지 못했지만 기계 일반 표준 이론으로 보면";
}

function principle(topic) {
  const map = {
    "열처리": "열처리는 가열, 유지, 냉각 방법에 따라 경도, 인성, 내부 응력, 조직을 바꾸는 작업입니다. 담금질은 경화, 뜨임은 취성 완화와 인성 회복, 풀림은 연화와 내부 응력 제거가 핵심입니다.",
    "기계 재료": "기계 재료는 성분과 조직이 강도, 경도, 연신율, 취성, 내식성에 어떤 영향을 주는지로 구분합니다. 합금 원소나 탄소량이 바뀌면 가공성 및 기계적 성질도 함께 달라집니다.",
    "절삭 가공": "절삭 가공은 공구 형상, 회전 방향, 절삭속도, 이송, 절삭 깊이를 서로 맞추어 판단합니다. 절삭속도와 회전수는 단위를 맞춘 뒤 공식에 대입해야 합니다.",
    "기계 요소": "기계 요소 문항은 동력 전달, 위치 고정, 체결, 마찰 감소 같은 기능을 먼저 구분하면 됩니다. 기어는 모듈, 잇수, 피치원 지름의 관계를 기본으로 봅니다.",
    "공차와 제도": "공차와 제도는 기준 치수, 허용차, 최대·최소 치수, 선의 종류, 치수 기입 원칙을 구분하는 것이 핵심입니다.",
    "측정": "측정 문항은 측정 대상이 외측, 내측, 깊이, 비교 측정 중 어디에 속하는지와 측정기의 최소 눈금을 함께 봐야 합니다.",
    "NC/CNC": "NC/CNC에서는 주소 문자의 기능이 중요합니다. G는 준비 기능, M은 보조 기능, X·Y·Z는 좌표, F는 이송, S는 주축 속도, T는 공구 지령입니다.",
    "안전": "안전 문항은 사고 예방에 직접 연결되는지를 기준으로 판단합니다. 보호구, 전원 차단, 정리정돈, 방호 장치, 위험물 취급이 우선입니다.",
    "기계 제도": "기계 제도는 KS 제도 규칙을 기준으로 투상 방향, 선의 종류, 단면 표시, 치수 기입 원칙을 판단합니다.",
    "공작 기계": "공작 기계는 어떤 운동을 하며 어떤 면이나 형상을 가공하는지로 구분합니다. 선반은 회전하는 공작물, 밀링은 회전 공구, 연삭은 숫돌을 기준으로 봅니다.",
    "기계 일반": "기계 일반 문항은 용어의 정의, 목적, 사용 조건, 결과가 서로 맞는지 비교해 판단합니다.",
  };
  return map[topic] || map["기계 일반"];
}

function explanationFor(row) {
  const { examId, qno } = examAndQno(row.path);
  if (!EXAMS[examId]) return null;
  const answer = EXAMS[examId].answers[qno - 1];
  const stem = stemOf(row.text);
  const options = optionsOf(row.text);
  const answerText = options[answer] || `${answer}번 보기`;
  const combined = `${stem}\n${answerText}`;
  const topic = topicOf(combined);
  const type = questionType(stem);
  const source = findSource(combined, answerText);

  const lead = `${sourceLabel(source)}, 이 문항은 ${topic}의 기본 원리를 확인하는 문제입니다.`;
  const core = principle(topic);
  const answerGuide = answerText && !/^\d번 보기$/.test(answerText)
    ? `정답 보기는 "${answerText}"의 조건이 문제에서 묻는 개념과 가장 잘 맞습니다.`
    : `정답은 ${answer}번 보기이며, 보기의 조건이 문제에서 묻는 개념과 맞습니다.`;

  if (type === "negative") {
    return `${lead} ${core} 이 문제는 틀린 설명을 찾는 형식이므로 각 보기가 말하는 결과가 실제 원리와 어긋나는지 비교해야 합니다. ${answerGuide} 나머지 보기는 용어와 기능의 방향이 맞지만, 정답 보기는 핵심 조건이 어긋난다는 점이 판별 기준입니다.`;
  }
  if (type === "calculation") {
    return `${lead} ${core} 계산형 문항은 먼저 구해야 할 값을 정하고 단위를 통일한 뒤 공식에 대입해야 합니다. ${answerGuide} 특히 mm, m/min, rpm, 분당 이송처럼 단위가 섞이면 오답이 되기 쉬우므로 식에 넣기 전 단위를 먼저 맞추는 것이 중요합니다.`;
  }
  if (type === "positive") {
    return `${lead} ${core} 조건에 맞는 설명을 고를 때는 용어, 목적, 사용 조건이 모두 맞아야 합니다. ${answerGuide} 일부 조건만 맞거나 다른 재료, 공구, 코드, 측정 대상에 해당하는 보기는 제외하면 됩니다.`;
  }
  return `${lead} ${core} ${answerGuide} 비슷한 용어가 함께 나오면 기능, 목적, 적용 조건을 먼저 구분하면 보기 판단이 쉬워집니다.`;
}

const explanations = {};
let count = 0;
for (const row of questions) {
  const { examId, qno } = examAndQno(row.path);
  if (!EXAMS[examId]) continue;
  explanations[examId] ||= {};
  explanations[examId][qno] = explanationFor(row);
  count += 1;
}

fs.writeFileSync(outputPath, `window.HGBGO_EXPLANATIONS = ${JSON.stringify(explanations, null, 2)};\n`);
console.log(`Wrote ${outputPath}: ${count} explanations using ${sourcePages.length} OCR source pages`);
