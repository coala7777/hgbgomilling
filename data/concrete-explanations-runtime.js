(function () {
  const runtime = {
    exams: null,
    titleToId: {},
    questionTexts: {},
    ready: null,
  };

  runtime.ready = Promise.all([
    fetch("app.js").then((response) => response.text()),
    fetch("data/question-ocr.json").then((response) => response.json()),
  ]).then(([appSource, rows]) => {
    const examsSource = appSource.match(/const EXAMS = (\{[\s\S]*?\n\});/)?.[1];
    if (!examsSource) throw new Error("Could not find EXAMS in app.js");
    runtime.exams = Function(`"use strict"; return (${examsSource});`)();
    Object.entries(runtime.exams).forEach(([examId, exam]) => {
      runtime.titleToId[exam.title] = examId;
    });
    rows.forEach((row) => {
      const match = row.path && row.path.match(/assets\/exams\/([^/]+)\/(\d+)\.png$/);
      if (!match) return;
      runtime.questionTexts[match[1]] ||= {};
      runtime.questionTexts[match[1]][Number(match[2])] = row.text || "";
    });
    replaceVisibleExplanations();
  }).catch((error) => {
    console.warn("Concrete explanation runtime failed", error);
  });

  function cleanQuestionText(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function questionStem(text) {
    const normalized = cleanQuestionText(text);
    const optionStart = normalized.search(/[①②③④]/);
    return (optionStart >= 0 ? normalized.slice(0, optionStart) : normalized)
      .replace(/^\d+\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function questionOptions(text) {
    const normalized = cleanQuestionText(text);
    const symbols = { "①": 1, "②": 2, "③": 3, "④": 4 };
    const options = {};
    [...normalized.matchAll(/([①②③④])\s*([\s\S]*?)(?=(?:\n?[①②③④]\s*)|$)/g)].forEach((match) => {
      options[symbols[match[1]]] = match[2].replace(/\s+/g, " ").trim();
    });
    return options;
  }

  function questionKind(stem) {
    if (/틀린|아닌|적절하지|옳지|부적합|잘못/.test(stem)) return "negative";
    if (/옳은|맞는|적절|올바른|가장 알맞/.test(stem)) return "positive";
    if (/값|구하|계산|몇|얼마|회전수|속도|이송|시간|길이|각도|테이퍼|공차|동력|토크|절삭/.test(stem)) return "calculation";
    return "concept";
  }

  function concreteReason(source, answerText, kind) {
    const combined = `${source}\n${answerText}`;
    if (/탄소강에 인\(P\)|인\(P\).*영향/.test(combined) && /연신율/.test(answerText)) return "인(P)은 강도와 경도를 높일 수 있지만 재료를 취약하게 만들어 충격값과 연신율은 떨어뜨립니다. 또한 가공 중 균열이 생기기 쉬워집니다. 따라서 연신율이 증가한다는 설명은 인의 일반적인 영향과 반대입니다.";
    if (/하향 절삭|하향절삭/.test(combined) && /백\s*래시|백래시/.test(answerText)) return "하향 절삭은 커터 회전 방향과 테이블 이송 방향이 같아서 가공면과 공구 수명에는 유리하지만, 절삭력이 테이블을 끌어당기는 방향으로 작용합니다. 백래시가 있으면 공작물이 갑자기 말려 들어갈 수 있으므로 백래시 제거장치가 필요합니다.";
    if (/철강의 5대 원소/.test(combined) && /아연/.test(answerText)) return "철강의 5대 원소는 탄소(C), 규소(Si), 망간(Mn), 인(P), 황(S)입니다. 아연은 철강의 5대 원소에 포함되지 않으므로, 5대 원소 목록을 기준으로 구분하면 됩니다.";
    if (/담금질/.test(combined) && /서냉|연화/.test(answerText)) return "담금질은 가열한 뒤 급랭하여 경도와 강도를 높이는 처리입니다. 서냉시켜 연하게 만드는 설명은 담금질이 아니라 풀림에 가깝습니다.";
    if (/CNC 공작기계.*안전|안전사항/.test(combined) && /문을 열고|문을.*열/.test(answerText)) return "CNC 가공 중에는 칩이 튀거나 공구가 파손될 위험이 있으므로 문을 닫은 상태에서 확인해야 합니다. 가공 상태를 보려고 앞쪽 문을 열고 작업하는 행동은 작업자 보호 원칙에 맞지 않습니다.";
    if (/작업평면.*Y-?Z|Y-2평면|YZ평면/.test(combined) && /G19/.test(answerText)) return "머시닝센터의 평면 선택 코드는 G17이 X-Y 평면, G18이 X-Z 평면, G19가 Y-Z 평면입니다. 문제에서 Y-Z 평면을 묻고 있으므로 평면 선택 코드의 짝을 기준으로 판단합니다.";
    if (/원 가공|원호|G41|D01/.test(combined) && /J-?20/.test(answerText)) return "원호보간에서 I는 X방향 중심 이동량, J는 Y방향 중심 이동량입니다. 도면과 프로그램의 현재 위치에서 원호 중심이 Y방향 음의 쪽에 있으므로 J에 음수값을 넣어야 합니다. 먼저 중심 이동 방향이 X인지 Y인지 판단하는 것이 핵심입니다.";
    if (/유효한G기능|유효한 G기능|실행되는.*G기능/.test(combined)) return "한 블록 안에 같은 그룹의 G코드가 여러 개 나오면 같은 그룹에서는 뒤에 나온 지령이 최종적으로 유효합니다. 제시된 블록에서 이동 관련 G기능을 순서대로 확인하고 마지막에 남는 지령을 고르면 됩니다.";
    if (/한계 게이지/.test(combined) && /플.*그 게이지|플러그 게이지|플리그 게이지/.test(answerText)) return "한계 게이지는 치수를 눈금으로 읽는 측정기가 아니라, 제품이 허용 한계 안에 들어가는지 통과/불통과로 판정하는 게이지입니다. 플러그 게이지는 구멍 치수의 허용 범위를 검사하는 대표적인 한계 게이지입니다.";
    if (/작업 시작 전 점검사항|작업 시작 전/.test(combined) && /냉난방/.test(answerText)) return "작업 시작 전 점검은 사고 예방과 직접 관련된 항목을 확인하는 절차입니다. 위험물, 전기 장치, 조명은 안전과 직접 관련되지만 냉난방 설비 설치 여부는 일반적인 기계가공 안전 점검의 핵심 항목으로 보기 어렵습니다.";
    if (/CNC|NC|프로그램|G\d|M\d|준비기능|보조기능/.test(combined)) return "NC 문항은 주소 문자의 기능을 기준으로 판단합니다. G는 준비기능, M은 보조기능, X·Y·Z는 좌표, F는 이송, S는 주축속도, T는 공구 지령입니다.";
    if (/절삭속도|회전수|rpm/.test(combined)) return "절삭속도와 회전수는 V = πDN / 1000 관계로 연결됩니다. 지름은 mm, 절삭속도는 m/min 단위인지 확인한 뒤 보기의 값과 맞춰야 합니다.";
    if (/기어|모듈|잇수|피치원/.test(combined)) return "기어는 모듈 m, 잇수 Z, 피치원 지름 D의 관계 D = mZ가 기본입니다. 보기의 설명이나 계산값이 이 관계와 맞는지 확인하세요.";
    if (/공차|끼워맞춤|허용차|한계치수/.test(combined)) return "공차는 최대치수와 최소치수를 따로 계산한 뒤 판단합니다. 구멍 기준인지 축 기준인지, 틈새인지 죔새인지가 보기 판정의 기준입니다.";
    if (/마이크로미터|버니어|다이얼|게이지|측정/.test(combined)) return "측정기는 측정 대상과 최소눈금으로 구분합니다. 외측·내측·깊이·비교 측정 중 무엇을 묻는지 보면 맞는 기구가 좁혀집니다.";
    if (/안전|보호구|작업장|점검|위험|재해/.test(combined)) return "안전 문항은 작업자의 사고 예방에 직접 관련되는지를 기준으로 봅니다. 생산 편의나 부가 설비보다 위험물, 전기, 조명, 보호구, 정리정돈이 우선입니다.";
    if (/탄소강|합금강|황동|청동|주철|금속|연신율|경도|강도|취성/.test(combined)) return "재료 문항은 성분이나 열처리가 강도, 경도, 연신율, 취성에 어떤 영향을 주는지 묻습니다. 보기의 성질 변화가 재료의 일반적 특징과 맞는지 대조하세요.";
    if (/밀링|엔드밀|커터|공구|드릴|리머|탭/.test(combined)) return "공구 문항은 공구의 형상과 용도를 연결하면 됩니다. 평면, 홈, 윤곽, 구멍, 나사 가공 중 어느 작업에 쓰는 공구인지가 핵심입니다.";
    if (/도면|투상|제도|단면|중심선|숨은선|치수/.test(combined)) return "도면 문항은 KS 제도 규칙을 기준으로 선의 종류, 투상 방향, 단면 표시, 치수 기입 원칙이 맞는지 판단합니다.";
    if (kind === "calculation") return "계산형 문항이므로 문제에서 요구한 값을 먼저 정하고, 단위를 맞춘 뒤 공식에 대입한 결과와 일치하는 보기를 고르면 됩니다.";
    return "문제의 핵심 용어와 선택지의 정의, 목적, 방법, 결과가 서로 맞는지 비교하면 답을 고를 수 있습니다.";
  }

  function concreteExplanationFor(examId, qno) {
    const source = runtime.questionTexts[examId]?.[qno];
    const answer = runtime.exams?.[examId]?.answers?.[qno - 1];
    const answerText = questionOptions(source)[answer];
    if (!source || !answerText) return "";
    const stem = questionStem(source);
    const kind = questionKind(stem);
    const reason = concreteReason(source, answerText, kind);
    if (kind === "negative") return `${stem} 이 문제는 틀린 설명을 찾는 문항입니다. 핵심 선택지는 '${answerText}'입니다. ${reason} 따라서 다른 보기가 개념에 맞는지 확인한 뒤, 이 문장이 문제에서 요구한 틀린 설명임을 판단하면 됩니다.`;
    if (kind === "positive") return `${stem} 이 문제는 조건에 맞는 설명을 찾는 문항입니다. 핵심 선택지는 '${answerText}'입니다. ${reason} 따라서 보기의 용어와 조건이 문제에서 묻는 내용과 정확히 대응되는지 확인하면 됩니다.`;
    if (kind === "calculation") return `${stem} 계산 결과와 맞춰야 하는 선택지는 '${answerText}'입니다. ${reason} 먼저 문제에서 구하라는 값을 정하고, 단위를 맞춘 뒤 계산값과 보기를 비교하면 됩니다.`;
    return `${stem} 핵심 선택지는 '${answerText}'입니다. ${reason} 이 문항은 보기의 용어가 문제의 정의, 목적, 사용 상황과 맞는지 대조하는 방식으로 풀면 됩니다.`;
  }

  function questionFromImage(img) {
    const pathMatch = img?.getAttribute("src")?.match(/assets\/exams\/([^/]+)\/(\d+)\.png/);
    if (pathMatch) return { examId: pathMatch[1], qno: Number(pathMatch[2]) };
    const altMatch = img?.getAttribute("alt")?.match(/(.+년 \d회차) (\d+)번 문제/);
    if (altMatch) return { examId: runtime.titleToId[altMatch[1]], qno: Number(altMatch[2]) };
    return null;
  }

  function replaceTextForImage(img, textNode) {
    const question = questionFromImage(img);
    if (!question?.examId || !question.qno || !textNode) return;
    const text = concreteExplanationFor(question.examId, question.qno);
    if (text && textNode.textContent !== text) textNode.textContent = text;
  }

  function replaceVisibleExplanations() {
    const practicePanel = document.querySelector("#explanationPanel:not([hidden])");
    if (practicePanel) replaceTextForImage(document.querySelector("#questionImage"), practicePanel.querySelector("#explanationText"));

    document.querySelectorAll(".wrong-card, .miss-card").forEach((card) => {
      replaceTextForImage(card.querySelector("img"), card.querySelector(".wrong-explanation p"));
    });
  }

  const observer = new MutationObserver(() => {
    runtime.ready?.then(replaceVisibleExplanations);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "src"] });
}());
