import fs from "node:fs";

const inputPath = "data/question-ocr.json";
const outputPath = "data/explanations.js";

const rows = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function examAndQno(path) {
  const match = path.match(/assets\/exams\/([^/]+)\/(\d+)\.png$/);
  if (!match) throw new Error(`Bad question path: ${path}`);
  return { examId: match[1], qno: Number(match[2]) };
}

function cleanText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stemOf(text) {
  const normalized = cleanText(text);
  const optionStart = normalized.search(/[①②③④]/);
  return (optionStart >= 0 ? normalized.slice(0, optionStart) : normalized)
    .replace(/^\d+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function questionType(stem) {
  if (/틀린|아닌|적절하지|옳지|부적합|잘못/.test(stem)) return "negative";
  if (/옳은|맞는|적절|올바른|가장 알맞/.test(stem)) return "positive";
  if (/값|구하|계산|몇|얼마|회전수|속도|이송|시간|길이|각도|테이퍼|공차|동력|토크|절삭/.test(stem)) return "calculation";
  return "concept";
}

const topicRules = [
  {
    test: /열처리|불림|풀림|담금질|뜨임|소입|소려|소둔|노멀라이징|어닐링/,
    hint: "열처리는 이름보다 목적과 냉각 방법을 짝지어 보세요. 풀림은 연화와 내부응력 완화, 불림은 조직 표준화, 담금질은 급랭에 의한 경화, 뜨임은 담금질 뒤 취성 감소와 인성 보완이 핵심입니다.",
  },
  {
    test: /탄소강|합금강|황동|청동|주철|금속|재료|인장|경도|연신|취성|인성|강도|크롬|니켈|몰리브덴|알루미늄|구리/,
    hint: "재료 문제는 첨가 원소나 조직 변화가 성질에 어떤 방향으로 작용하는지 확인하면 됩니다. 강도·경도·인성·연신율·취성처럼 서로 반대되는 성질을 묶어 비교하세요.",
  },
  {
    test: /밀링|엔드밀|커터|바이트|공구|절삭공구|초경|드릴|리머|탭|호브|커터날|날끝/,
    hint: "공구 문제는 공구의 형상, 절삭날 위치, 가공면, 사용 목적을 먼저 분리하세요. 같은 절삭공구라도 홈 가공, 평면 가공, 윤곽 가공, 구멍 가공에서 쓰임이 다릅니다.",
  },
  {
    test: /절삭속도|회전수|rpm|이송|절삭깊이|절삭조건|칩|절삭유|절삭저항|가공시간/,
    hint: "절삭조건 문제는 단위를 먼저 맞추는 것이 출발점입니다. 절삭속도는 공구 지름과 회전수, 이송은 날당 이송·날 수·회전수와 연결되므로 어떤 값이 주어졌는지 표로 정리해 보세요.",
  },
  {
    test: /기어|잇수|피치|모듈|압력각|원주피치|분할|인덱싱|분할대/,
    hint: "기어와 분할 문제는 모듈, 피치원 지름, 잇수의 관계를 먼저 잡으세요. 분할대 문제라면 직접분할인지 단식분할인지 확인하고, 크랭크 회전수와 구멍판 조건을 차례로 대응시키면 됩니다.",
  },
  {
    test: /테이퍼|경사|각도|삼각함수|사인|코사인|탄젠트|sin|cos|tan/,
    hint: "테이퍼와 각도 문제는 큰 지름, 작은 지름, 길이의 위치 관계를 그림으로 단순화하세요. 양쪽 지름 차이를 그대로 쓰는지 반으로 나누어 쓰는지에 따라 식이 달라집니다.",
  },
  {
    test: /공차|치수|끼워맞춤|한계|허용차|기하공차|표면거칠기|조도|데이텀/,
    hint: "공차 문제는 기준치수, 위 치수허용차, 아래 치수허용차를 구분해야 합니다. 끼워맞춤은 구멍과 축의 최대·최소 치수를 따로 구한 뒤 틈새 또는 죔새의 범위를 판단하세요.",
  },
  {
    test: /측정|마이크로미터|버니어|다이얼|게이지|측정기|정반|하이트|블록게이지/,
    hint: "측정 문제는 측정기의 용도와 최소눈금을 먼저 확인하세요. 직접 측정인지 비교 측정인지, 외측·내측·깊이 중 무엇을 재는지에 따라 알맞은 기구가 갈립니다.",
  },
  {
    test: /CNC|NC|프로그램|G\d|M\d|준비기능|보조기능|좌표|원호|보간|절대|증분|지령|블록/,
    hint: "NC 프로그램 문제는 주소 문자의 역할을 먼저 나누세요. G는 준비기능, M은 보조기능, X·Y·Z는 좌표, F는 이송, S는 주축속도, T는 공구와 연결됩니다. 한 블록 안에서는 같은 계열 명령의 우선 관계도 확인해야 합니다.",
  },
  {
    test: /안전|보호구|작업장|점검|화재|감전|위험|재해|정리정돈|응급/,
    hint: "안전 문제는 작업 전 점검, 작업 중 행동, 작업 후 정리로 나누어 판단하세요. 생산 편의보다 사고 예방과 작업자 보호에 직접 관련되는 항목이 우선입니다.",
  },
  {
    test: /윤활|유압|공압|기계요소|베어링|축|키|볼트|너트|나사|스프링|클러치|브레이크/,
    hint: "기계요소 문제는 부품의 기능을 한 문장으로 정리하면 보기 판단이 쉬워집니다. 힘 전달, 위치 고정, 마찰 감소, 완충, 체결처럼 역할을 기준으로 구분하세요.",
  },
  {
    test: /도면|투상|제도|단면|치수기입|선의|중심선|숨은선|KS|기호/,
    hint: "도면 문제는 선의 종류와 기호가 나타내는 약속을 먼저 확인하세요. 실제 형상, 숨은 형상, 중심, 절단 위치, 치수 보조선이 각각 어떤 선으로 표현되는지 구분하면 됩니다.",
  },
];

function topicHint(text) {
  const source = cleanText(text);
  const rule = topicRules.find((item) => item.test.test(source));
  return rule?.hint || "문제의 핵심 용어를 표시하고, 각 보기가 그 용어의 정의·목적·방법·결과와 일치하는지 비교하세요. 계산형이면 단위와 공식의 적용 순서를 먼저 정리하면 선택지가 좁혀집니다.";
}

function solveGuide(type) {
  if (type === "negative") {
    return "이 문제는 맞는 설명을 찾는 것이 아니라, 보기 중 한 곳의 조건이 어긋난 것을 찾는 방식입니다. 보기마다 핵심어와 결과를 따로 표시해 서로 대응이 맞는지 확인하세요.";
  }
  if (type === "positive") {
    return "보기 중 개념과 조건이 모두 맞는 것을 골라야 합니다. 일부만 맞는 설명에 끌리지 않도록 목적, 방법, 결과가 모두 일치하는지 끝까지 대조하세요.";
  }
  if (type === "calculation") {
    return "계산 문제는 숫자를 바로 대입하기 전에 단위부터 맞추세요. 문제에서 묻는 값, 주어진 값, 필요한 공식을 세 줄로 나누어 쓰면 실수를 줄일 수 있습니다.";
  }
  return "개념 문제는 용어의 정의를 떠올린 뒤, 보기가 말하는 원인과 결과가 자연스럽게 이어지는지 확인하는 방식으로 풀면 됩니다.";
}

function explanationFor(row) {
  const text = cleanText(row.text);
  const stem = stemOf(text);
  const type = questionType(stem);
  const guide = solveGuide(type);
  const topic = topicHint(text);
  return `${stem} ${guide} ${topic}`;
}

const explanations = {};
for (const row of rows) {
  const { examId, qno } = examAndQno(row.path);
  explanations[examId] ||= {};
  explanations[examId][qno] = explanationFor(row);
}

if (explanations["2015_2"]) {
  explanations["2015_2"][4] = "열처리 문제는 각 처리의 목적과 냉각 방법을 먼저 대응시키면 됩니다. 불림은 조직을 표준화하고, 풀림은 재료를 연하게 하며, 담금질은 급격히 식혀 단단하게 만드는 쪽이고, 뜨임은 담금질 뒤 취성을 줄여 인성을 보완하는 과정입니다. 보기 중 처리 이름과 목적, 냉각 방식이 서로 다른 설명을 찾으세요.";
}

const content = `window.HGBGO_EXPLANATIONS = ${JSON.stringify(explanations, null, 2)};\n`;
fs.writeFileSync(outputPath, content);
console.log(`Wrote ${outputPath}`);
