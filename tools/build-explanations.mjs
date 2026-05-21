import fs from "node:fs";

const inputPath = "data/question-ocr.json";
const outputPath = "data/explanations.js";

const rows = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const appSource = fs.readFileSync("app.js", "utf8");
const examsSource = appSource.match(/const EXAMS = (\{[\s\S]*?\n\});/)?.[1];
if (!examsSource) throw new Error("Could not find EXAMS in app.js");
const EXAMS = Function(`"use strict"; return (${examsSource});`)();

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

function normalizeOptionMarkers(text) {
  return cleanText(text)
    .replace(/(^|\n)\s*[lI]\s+/g, "$1① ")
    .replace(/(^|\n)\s*⑦\s+/g, "$1② ")
    .replace(/(^|\n)\s*[.·]\s+/g, "$1④ ");
}

function cleanForDisplay(text) {
  return String(text || "")
    .replace(/\bZm\b/g, "Zn")
    .replace(/Y-2평면/g, "Y-Z평면")
    .replace(/플리그 게이지/g, "플러그 게이지")
    .replace(/603\s*\(/g, "G03 (")
    .replace(/프로\s+그램/g, "프로그램")
    .replace(/공작기\s+계/g, "공작기계")
    .replace(/지령되어\s+야/g, "지령되어야")
    .replace(/\s+/g, " ")
    .trim();
}

function stemOf(text) {
  const normalized = normalizeOptionMarkers(text);
  const optionStart = normalized.search(/[①②③④]/);
  return (optionStart >= 0 ? normalized.slice(0, optionStart) : normalized)
    .replace(/^\d+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function optionsOf(text) {
  const normalized = normalizeOptionMarkers(text);
  const symbols = { "①": 1, "②": 2, "③": 3, "④": 4 };
  const options = {};

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  let current = null;
  let fallbackNo = 1;
  lines.forEach((line) => {
    const marker = line.match(/^([①②③④@])\s*(.+)$/);
    if (marker) {
      const explicit = symbols[marker[1]];
      const no = explicit || fallbackNo;
      options[no] = marker[2].trim();
      current = no;
      fallbackNo = Math.min(5, no + 1);
      while (options[fallbackNo]) fallbackNo += 1;
      return;
    }

    const numeric = line.match(/^([1-4])[\).]?\s+(.+)$/);
    if (numeric) {
      current = Number(numeric[1]);
      if (!options[current]) options[current] = numeric[2].trim();
      fallbackNo = Math.min(5, current + 1);
      return;
    }

    if (current && options[current]) options[current] += ` ${line}`;
  });

  if (Object.keys(options).length >= 3) return options;

  const matches = [...normalized.matchAll(/([①②③④])\s*([\s\S]*?)(?=(?:\n?[①②③④]\s*)|$)/g)];
  matches.forEach((match) => {
    if (!options[symbols[match[1]]]) options[symbols[match[1]]] = match[2].replace(/\s+/g, " ").trim();
  });
  return options;
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
  return rule?.hint || "";
}

function fallbackReason(source, answerText, type) {
  const displayAnswer = cleanForDisplay(answerText);
  const combined = cleanForDisplay(source);

  if (/비중/.test(combined) && /철/.test(combined) && /7\.8/.test(displayAnswer)) {
    return "철의 비중은 약 7.8입니다. 비중은 물의 밀도를 1로 보았을 때 재료가 물보다 몇 배 무거운지를 나타내는 값입니다. 기계재료에서 자주 비교하는 값은 알루미늄 약 2.7, 철 약 7.8, 구리 약 8.9이므로 철은 7.8에 가까운 값을 고르면 됩니다.";
  }
  if (/비중/.test(combined) && displayAnswer) {
    return `비중은 물을 1로 보았을 때의 상대적인 무게입니다. 이 문항에서는 표준 재료값이 ${displayAnswer}로 정리되므로, 보기를 계산식으로 풀기보다 재료별 대표 비중값과 비교해 판단합니다.`;
  }
  if (/색깔|색상|표시색/.test(combined) && displayAnswer) {
    return `색상 구분 문제는 규정된 표시색을 그대로 연결해야 합니다. 이 경우 기준이 되는 표시가 ${displayAnswer}이므로, 임의의 색감을 고르지 말고 안전·제도·작업 표준에서 정한 색상 대응을 확인합니다.`;
  }
  if (/기호|약호|명칭|무엇이라/.test(combined) && displayAnswer) {
    return `${displayAnswer}는 이 조건에서 쓰는 표준 명칭 또는 기호입니다. 이런 문항은 설명 속 기능과 보기의 용어가 같은 대상을 가리키는지 확인하면 되며, 비슷한 이름이라도 기능이 다르면 제외해야 합니다.`;
  }
  if (/사용|쓰이는|용도|적합/.test(combined) && displayAnswer) {
    return `${displayAnswer}는 제시된 작업 조건에 맞는 용도나 재료입니다. 용도 문제는 강도, 내마멸성, 가공성, 측정 대상처럼 조건으로 제시된 성질을 먼저 잡고 그 성질을 만족하는 보기를 고릅니다.`;
  }
  if (/공식|계산|구하|값|몇|회전수|이송|속도|시간|각도|공차/.test(combined) || type === "calculation") {
    return `계산 결과는 ${displayAnswer}와 대응됩니다. 먼저 문제에서 구하는 값을 하나로 정하고, 주어진 수치의 단위를 맞춘 뒤 기본식에 대입합니다. 계산값과 보기값이 정확히 같지 않으면 가장 가까운 값 또는 반올림 조건을 확인합니다.`;
  }
  if (type === "negative" && displayAnswer) {
    return `'${displayAnswer}'라는 설명은 문제의 개념과 어긋나는 부분입니다. 틀린 설명을 찾을 때는 보기의 핵심어와 결과를 분리해서, 원래 개념의 방향과 반대로 말한 부분이나 서로 연결되지 않는 용어를 찾아야 합니다.`;
  }
  if (displayAnswer) {
    return `'${displayAnswer}'가 이 문항의 판단 기준입니다. 보기의 단어를 외워서 고르기보다, 그 용어가 나타내는 기능·조건·결과가 문제에서 요구한 상황과 같은지 확인해야 합니다.`;
  }
  return "보기의 핵심 조건을 하나씩 분리해 실제 개념과 맞는지 확인해야 합니다. 숫자가 있으면 단위를 먼저 맞추고, 용어가 있으면 정의와 사용 상황을 먼저 대조합니다.";
}

function concreteReason(source, answerText, type) {
  const combined = `${source}\n${answerText}`;
  if (/탄소강에 인\(P\)|인\(P\).*영향/.test(combined) && /연신율/.test(answerText)) {
    return "인(P)은 강도와 경도를 높일 수 있지만 재료를 취약하게 만들어 충격값과 연신율은 낮추는 원소입니다. 균열이 생기기 쉬워지는 방향으로 작용하므로, 연신율이 증가한다는 설명은 인의 일반적인 영향과 반대입니다.";
  }
  if (/황동/.test(combined) && /전도도/.test(answerText)) {
    return "황동은 구리(Cu)에 아연(Zn)을 넣은 합금입니다. Zn 함량에 따라 연신율과 인장강도 같은 기계적 성질은 특정 조성에서 크게 나타날 수 있지만, 전기전도도는 구리에 비해 낮아지는 성질로 이해해야 합니다. 그래서 '전도도가 50% Zn에서 최소가 된다'처럼 특정 조성의 최소값으로 단정한 문장은 황동의 대표 성질 설명으로 보기 어렵습니다.";
  }
  if (/철강의 5대 원소/.test(combined) && /아연/.test(answerText)) {
    return "철강의 5대 원소는 탄소(C), 규소(Si), 망간(Mn), 인(P), 황(S)입니다. 아연(Zn)은 도금이나 합금에서 따로 다루는 원소이지 철강의 5대 원소 목록에는 포함되지 않습니다. 따라서 5대 원소의 암기 목록과 보기를 직접 대조하면 판단할 수 있습니다.";
  }
  if (/담금질/.test(combined) && /서냉|연화/.test(answerText)) {
    return "담금질은 가열한 뒤 급랭하여 경도와 강도를 높이는 처리입니다. 서냉시켜 연하게 만드는 설명은 담금질이 아니라 풀림에 가깝습니다.";
  }
  if (/질량효과/.test(answerText)) {
    return "같은 강재라도 굵거나 두꺼운 재료는 중심부가 늦게 식고, 얇은 재료는 빨리 식습니다. 이처럼 재료의 크기 때문에 냉각속도와 담금질 결과가 달라지는 현상을 질량효과라고 합니다. 문제의 '굵기, 두께가 다르면 냉각속도가 달라진다'는 표현을 이 용어와 연결하면 됩니다.";
  }
  if (/불림/.test(combined) && /공냉|표준화/.test(answerText)) {
    return "불림은 가열 후 공랭하여 조직을 표준화하고 결정립을 고르게 만드는 처리입니다.";
  }
  if (/풀림/.test(combined) && /연하|균일|응력/.test(answerText)) {
    return "풀림은 재료를 연하게 하고 내부 응력을 줄이며 조직을 균일하게 만드는 처리입니다.";
  }
  if (/뜨임/.test(combined) && /인성|취성/.test(answerText)) {
    return "뜨임은 담금질 뒤 다시 가열해 취성을 줄이고 인성을 보완하는 처리입니다.";
  }
  if (/하향 절삭|하향절삭/.test(combined) && /백\s*래시|백래시/.test(answerText)) {
    return "하향 절삭은 커터 회전 방향과 테이블 이송 방향이 같아 절삭성이 좋지만, 절삭력이 테이블을 끌어당기는 방향으로 작용합니다. 이때 이송나사에 백래시가 있으면 테이블이 갑자기 빨려 들어가 공구나 공작물이 손상될 수 있습니다. 그래서 하향 절삭에서는 백래시 제거장치가 필요하다는 점을 기준으로 판단합니다.";
  }
  if (/작업평면.*Y-?Z|Y-2평면|YZ평면/.test(combined) && /G19/.test(answerText)) {
    return "머시닝센터의 평면 선택 코드는 G17이 X-Y 평면, G18이 X-Z 평면, G19가 Y-Z 평면입니다. 문제에서 Y-Z 평면을 묻고 있으므로 세 평면 코드의 짝을 그대로 대응시키면 됩니다.";
  }
  if (/X-Y 작업평면|XY 작업평면|X-Y 평면/.test(combined) && /G17/.test(answerText)) {
    return "머시닝센터에서 평면 선택은 G17, G18, G19로 구분합니다. G17은 X-Y 평면, G18은 X-Z 평면, G19는 Y-Z 평면이므로 문제의 X-Y 작업평면 조건과 코드를 직접 짝지어 확인하면 됩니다.";
  }
  if (/원 가공|원호|G41|D01/.test(combined) && /J-?20/.test(answerText)) {
    return "원호보간에서 I는 현재 위치에서 원 중심까지의 X방향 거리, J는 Y방향 거리입니다. 도면에서 원 중심이 현재점보다 Y의 음의 방향에 있으면 J값은 음수가 됩니다. 따라서 중심 이동 방향과 부호를 먼저 판별한 뒤 보기의 J값과 비교합니다.";
  }
  if (/유효한G기능|유효한 G기능|실행되는.*G기능/.test(combined)) {
    return "한 블록 안에 같은 그룹의 G코드가 여러 개 나오면 같은 그룹에서는 뒤에 지령된 코드가 최종적으로 유효합니다. 제시된 블록을 앞에서부터 읽되, 같은 기능군이 겹치는지 확인하고 마지막에 남는 이동 지령을 기준으로 판단합니다.";
  }
  if (/CNC 공작기계.*안전|안전사항/.test(combined) && /문을 열고|문을.*열/.test(answerText)) {
    return "CNC 가공 중에는 칩 비산, 절삭유 튐, 공구 파손 위험이 있으므로 방호문을 닫고 운전해야 합니다. 가공 상태를 보겠다고 앞쪽 문을 열고 작업하는 행동은 작업자 보호 원칙에 맞지 않습니다.";
  }
  if (/작업 시작 전 점검사항|작업 시작 전/.test(combined) && /냉난방/.test(answerText)) {
    return "작업 시작 전 점검은 사고와 직접 연결되는 위험물, 전기장치, 조명, 보호구, 정리정돈을 확인하는 절차입니다. 냉난방 설비 설치 여부는 작업 환경 편의에 가까워 일반적인 기계가공 안전 점검의 핵심 항목으로 보기 어렵습니다.";
  }
  if (/한계 게이지/.test(combined) && /플.*그 게이지|플러그 게이지|플리그 게이지/.test(answerText)) {
    return "한계 게이지는 치수를 숫자로 읽는 측정기가 아니라, 제품 치수가 허용범위 안에 있는지 통과와 불통과로 판정하는 검사구입니다. 플러그 게이지는 구멍 치수의 허용 한계를 검사할 때 쓰는 대표적인 한계 게이지입니다.";
  }
  if (/7:\s*3황동|7\s*:\s*3황동/.test(combined) && /구리 70%.*아연 30%/.test(answerText)) {
    return "7:3 황동은 구리 70%, 아연 30%의 황동을 뜻합니다. 황동은 구리와 아연의 합금이고, 청동은 구리와 주석의 합금이므로 주석, 니켈, 규소가 들어간 보기는 재료명이 달라집니다.";
  }
  if (/Cu-Sn|Cu Sn|구리.*주석|청동/.test(combined) && /청동/.test(answerText)) {
    return "Cu-Sn 합금은 구리(Cu)와 주석(Sn)의 합금인 청동입니다. 황동은 Cu-Zn 합금이므로, 문제에 Sn이 보이면 청동으로 연결하는 것이 핵심입니다.";
  }
  if (/60%Cu.*40%.*Zn|40%2|문쯔|Muntz/i.test(combined) && /문쯔|문쯔 메탈|문쯔메탈/.test(answerText)) {
    return "문쯔 메탈은 구리 약 60%, 아연 약 40%의 황동입니다. 열교환기, 파이프, 탄피처럼 문제에 60% Cu와 40% Zn 조성이 함께 나오면 황동의 종류 중 문쯔 메탈로 연결합니다.";
  }
  if (/담금질.*내마멸성|공작기계의 안내면|실린더/.test(combined) && /미하나이트/.test(answerText)) {
    return "미하나이트 주철은 강도, 내마멸성, 기계가공성이 좋아 공작기계 안내면이나 기관 실린더처럼 마찰과 강도가 동시에 필요한 곳에 쓰입니다. 문제의 '내마멸성'과 '강도'라는 조건을 주철의 용도와 연결하면 됩니다.";
  }
  if (/와이어 컷|와이어 전극/.test(combined) && /납/.test(answerText)) {
    return "와이어 컷 방전가공의 전극선은 전기가 잘 통하고 일정한 인장강도를 가져야 하므로 황동, 구리, 텅스텐 계열이 쓰입니다. 납은 무르고 전극선으로 유지하기 어려워 와이어 전극 재질로 적합하지 않습니다.";
  }
  if (/알루미늄/.test(combined) && /전연성이 나쁘|주조가 곤란/.test(answerText)) {
    return "알루미늄은 가볍고 내식성이 좋으며 전성과 연성이 좋아 판재나 형재로 가공하기 쉽습니다. 순수 알루미늄은 전연성이 나쁘다고 보기 어렵기 때문에, 전연성이 나쁘다는 표현을 알루미늄의 대표 성질과 반대로 판단합니다.";
  }
  if (/연삭 가공의 일반적인 특징/.test(combined) && /온도가 낮다/.test(answerText)) {
    return "연삭은 숫돌 입자가 아주 빠른 속도로 공작물을 깎는 가공이어서 접촉점의 온도가 높아지기 쉽습니다. 경화강 가공이 가능하고 가공면이 매끈한 것은 연삭의 특징이지만, 연삭점의 온도가 낮다는 설명은 실제 현상과 반대입니다.";
  }
  if (/연삭가공 방법/.test(combined) && /탄성연삭/.test(answerText)) {
    return "연삭가공 방법에는 원통연삭, 평면연삭, 내면연삭처럼 공작물의 형상이나 가공면에 따른 분류가 쓰입니다. 탄성연삭은 이 기본 분류에 해당하는 표준적인 연삭가공 방법으로 보지 않습니다.";
  }
  if (/연삭 숫돌의 구성 요소/.test(combined) && /드레싱/.test(answerText)) {
    return "연삭숫돌의 3요소는 숫돌 입자, 결합제, 기공입니다. 드레싱은 무뎌진 숫돌 표면을 정리해 절삭성을 회복시키는 작업이지 숫돌을 이루는 구성 요소가 아닙니다.";
  }
  if (/규격화 하는 이유/.test(combined) && /생산단가를 높여/.test(answerText)) {
    return "제품 규격화의 목적은 품질 안정, 생산성 향상, 호환성 확보, 원가 절감입니다. 생산단가를 일부러 높이는 것은 규격화의 목적과 반대이므로 규격화의 이유로 볼 수 없습니다.";
  }
  if (/줄의 작업 방법/.test(combined) && /후진법/.test(answerText)) {
    return "줄 작업은 줄을 앞으로 밀 때 절삭이 이루어지므로 전진 동작을 기준으로 힘을 주어야 합니다. 직진법, 사진법, 병진법은 줄 작업 방식으로 다루지만, 뒤로 당기는 후진법을 절삭 작업 방법으로 보지는 않습니다.";
  }
  if (/소성가공의 종류/.test(combined) && /호빙/.test(answerText)) {
    return "소성가공은 재료를 깎아내지 않고 힘을 가해 영구 변형시키는 가공입니다. 단조, 압연, 인발은 소성변형을 이용하지만, 호빙은 기어 이를 절삭하는 가공이므로 소성가공에 속하지 않습니다.";
  }
  if (/V\s*벨트/.test(combined) && /설치면적이 넓어/.test(answerText)) {
    return "V 벨트는 홈에 쐐기처럼 물리는 효과 때문에 평 벨트보다 작은 장력으로도 큰 동력을 전달하고 미끄럼이 적습니다. 그래서 설치 공간도 비교적 작게 잡을 수 있는데, 설치면적이 넓어 공간이 필요하다는 설명은 V 벨트의 장점과 맞지 않습니다.";
  }
  if (/래핑가공의 단점/.test(combined) && /대량생산이 어렵다/.test(answerText)) {
    return "래핑은 매우 정밀하고 매끈한 표면을 얻는 마무리 가공입니다. 작업이 지저분하거나 랩제가 남아 마모를 일으킬 수 있는 점은 단점이지만, 문제에서 틀린 단점을 고르는 경우에는 실제 단점과 표현이 맞는지 비교해야 합니다.";
  }
  if (/SI단위계/.test(combined) && /dyne/.test(answerText)) {
    return "SI 단위계에서 에너지의 단위는 줄(J)입니다. dyne은 CGS 단위계에서 힘을 나타내는 단위이므로, 에너지와 dyne을 연결한 설명은 물리량과 단위의 대응이 맞지 않습니다.";
  }
  if (/CAD.*명령/.test(combined) && /지우기|erase/.test(answerText)) {
    return "CAD에서 erase는 잘못 그렸거나 필요 없는 요소를 삭제하는 명령입니다. 설명에 '불필요한 요소를 없앤다'고 되어 있으면 삭제 기능을 뜻하므로 erase와 연결해야 합니다.";
  }
  if (/스테인리스강의 주성분/.test(combined) && /A1|Al/.test(answerText)) {
    return "스테인리스강은 철(Fe)을 바탕으로 크롬(Cr)을 많이 넣고, 종류에 따라 니켈(Ni) 등을 더해 내식성을 높인 강입니다. 알루미늄(Al)은 스테인리스강의 대표 주성분으로 보지 않으므로 주성분 목록에서 제외합니다.";
  }
  if (/연삭숫돌의 표시방법/.test(combined) && /V\s*:\s*조직/.test(answerText)) {
    return "연삭숫돌 표시에서 앞의 문자와 숫자는 입자 종류, 입도, 결합도, 조직, 결합제 등을 순서대로 나타냅니다. V는 vitrified, 즉 비트리파이드 결합제를 뜻하므로 조직이라고 설명하면 표시 항목의 의미가 맞지 않습니다.";
  }
  if (/연동척/.test(combined) && /고정력이.*단동척보다 강하다/.test(answerText)) {
    return "연동척은 3개의 조가 동시에 움직여 원형이나 정다각형 공작물을 빠르게 중심 맞춤하기 좋습니다. 하지만 각 조를 따로 강하게 조일 수 있는 단동척보다 고정력이 강하다고 보기는 어렵습니다.";
  }
  if (/CNC|NC|프로그램|G\d|M\d|준비기능|보조기능/.test(combined)) {
    return "NC 문항은 주소 문자의 기능을 기준으로 판단합니다. G는 준비기능, M은 보조기능, X·Y·Z는 좌표, F는 이송, S는 주축속도, T는 공구 지령입니다.";
  }
  if (/절삭속도|회전수|rpm/.test(combined)) {
    return "절삭속도와 회전수는 V = πDN / 1000 관계로 연결됩니다. 지름은 mm, 절삭속도는 m/min 단위인지 확인한 뒤 보기의 값과 맞춰야 합니다.";
  }
  if (/이송|날당|테이블/.test(combined)) {
    return "이송은 날당 이송, 날 수, 회전수의 곱으로 판단하는 경우가 많습니다. 문제에서 분당 이송인지 1회전당 이송인지부터 구분하세요.";
  }
  if (/기어|모듈|잇수|피치원/.test(combined)) {
    return "기어는 모듈 m, 잇수 Z, 피치원 지름 D의 관계 D = mZ가 기본입니다. 보기의 설명이나 계산값이 이 관계와 맞는지 확인하세요.";
  }
  if (/분할|분할대|인덱싱/.test(combined)) {
    return "분할대 문항은 40:1 웜기어 기준의 크랭크 회전수 계산이 핵심입니다. 등분 수와 구멍판 조건이 맞는 보기를 골라야 합니다.";
  }
  if (/테이퍼|경사|tan|탄젠트/.test(combined)) {
    return "테이퍼는 큰 지름과 작은 지름의 차이, 길이, 반각의 관계를 봅니다. 각도를 구할 때 지름 차이를 그대로 쓰는지 반으로 나누는지 확인해야 합니다.";
  }
  if (/공차|끼워맞춤|허용차|한계치수/.test(combined)) {
    return "공차는 최대치수와 최소치수를 따로 계산한 뒤 판단합니다. 구멍 기준인지 축 기준인지, 틈새인지 죔새인지가 보기 판정의 기준입니다.";
  }
  if (/마이크로미터|버니어|다이얼|게이지|측정/.test(combined)) {
    return "측정기는 측정 대상과 최소눈금으로 구분합니다. 외측·내측·깊이·비교 측정 중 무엇을 묻는지 보면 맞는 기구가 좁혀집니다.";
  }
  if (/안전|보호구|작업장|점검|위험|재해/.test(combined)) {
    return "안전 문항은 작업자의 사고 예방에 직접 관련되는지를 기준으로 봅니다. 생산 편의나 부가 설비보다 위험물, 전기, 조명, 보호구, 정리정돈이 우선입니다.";
  }
  if (/탄소강|합금강|황동|청동|주철|금속|연신율|경도|강도|취성/.test(combined)) {
    return "재료 문항은 성분이나 열처리가 강도, 경도, 연신율, 취성에 어떤 영향을 주는지 묻습니다. 보기의 성질 변화가 재료의 일반적 특징과 맞는지 대조하세요.";
  }
  if (/밀링|엔드밀|커터|공구|드릴|리머|탭/.test(combined)) {
    return "공구 문항은 공구의 형상과 용도를 연결하면 됩니다. 평면, 홈, 윤곽, 구멍, 나사 가공 중 어느 작업에 쓰는 공구인지가 핵심입니다.";
  }
  if (/도면|투상|제도|단면|중심선|숨은선|치수/.test(combined)) {
    return "도면 문항은 KS 제도 규칙을 기준으로 선의 종류, 투상 방향, 단면 표시, 치수 기입 원칙이 맞는지 판단합니다.";
  }
  if (type === "calculation") {
    return fallbackReason(combined, answerText, type);
  }
  return topicHint(combined) || fallbackReason(combined, answerText, type);
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
  const { examId, qno } = examAndQno(row.path);
  const answer = EXAMS[examId]?.answers?.[qno - 1];
  const stem = cleanForDisplay(stemOf(text));
  const options = optionsOf(text);
  const answerText = cleanForDisplay(options[answer] || "");
  const type = questionType(stem);
  const reason = concreteReason(text, answerText, type);

  if (!answerText) return fallbackReason(text, "", type);

  if (type === "negative") {
    return `${reason} 따라서 이 보기는 다른 보기와 달리 원리, 용어, 결과 중 하나가 맞지 않는 설명으로 판단합니다.`;
  }
  if (type === "positive") {
    return `${reason} 따라서 보기에서 같은 조건을 말하는 항목을 고르고, 일부 조건만 맞거나 재료·코드·용도가 다른 항목은 제외합니다.`;
  }
  if (type === "calculation") {
    return `${reason} 계산 중에는 단위 변환과 반올림 위치를 먼저 확인해야 보기값과 어긋나지 않습니다.`;
  }
  return `${reason} 비슷한 보기가 있으면 기능, 재료, 코드, 측정 대상처럼 서로 달라지는 기준을 하나 잡아 비교합니다.`;
}

const explanations = {};
for (const row of rows) {
  const { examId, qno } = examAndQno(row.path);
  explanations[examId] ||= {};
  explanations[examId][qno] = explanationFor(row);
}

const content = `window.HGBGO_EXPLANATIONS = ${JSON.stringify(explanations, null, 2)};\n`;
fs.writeFileSync(outputPath, content);
console.log(`Wrote ${outputPath}`);
