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
    if (/담금질/.test(combined) && /서냉|연화/.test(answerText)) return "담금질은 가열한 뒤 급랭하여 경도와 강도를 높이는 처리입니다. 서냉시켜 연하게 만드는 설명은 담금질이 아니라 풀림에 가깝습니다.";
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
    if (kind === "negative") return `${stem} 핵심 선택지는 '${answerText}'입니다. ${reason} 따라서 이 문장이 문제에서 요구한 틀린 설명입니다.`;
    if (kind === "positive") return `${stem} 핵심 선택지는 '${answerText}'입니다. ${reason} 따라서 이 문장이 문제 조건에 가장 잘 맞습니다.`;
    if (kind === "calculation") return `${stem} 계산 결과와 맞춰야 하는 선택지는 '${answerText}'입니다. ${reason}`;
    return `${stem} 핵심 선택지는 '${answerText}'입니다. ${reason}`;
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
    if (text) textNode.textContent = text;
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
