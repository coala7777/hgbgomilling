const ATTEMPTS_KEY = "hankibu_cbt_attempts_v3";
const ACCESS_KEY = "hankibu_cbt_access_v1";
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const ACCESS_HEARTBEAT_MS = 2 * 60 * 1000;

const EXAMS = {
  "2014_1": {
    title: "2014년 1회차",
    folder: "2014_1",
    answers: [
      1, 4, 1, 4, 2, 3, 3, 2, 4, 2,
      2, 1, 1, 1, 2, 4, 2, 1, 3, 4,
      2, 2, 3, 1, 2, 1, 4, 3, 1, 3,
      1, 3, 4, 3, 4, 2, 2, 4, 1, 2,
      3, 2, 1, 1, 4, 2, 1, 1, 3, 3,
      2, 2, 1, 1, 3, 4, 4, 3, 1, 4,
    ],
  },
  "2014_2": {
    title: "2014년 2회차",
    folder: "2014_2",
    answers: [
      4, 4, 2, 2, 1, 4, 4, 4, 3, 1,
      4, 4, 2, 3, 4, 4, 4, 1, 4, 3,
      2, 1, 2, 1, 1, 2, 1, 1, 4, 4,
      1, 1, 3, 3, 2, 3, 3, 1, 4, 4,
      1, 2, 1, 3, 2, 4, 1, 3, 2, 1,
      2, 3, 3, 2, 2, 4, 4, 4, 1, 1,
    ],
  },
  "2014_3": {
    title: "2014년 3회차",
    folder: "2014_3",
    answers: [
      2, 1, 4, 3, 2, 1, 1, 2, 2, 4,
      1, 3, 1, 3, 4, 2, 3, 3, 1, 4,
      3, 3, 4, 2, 1, 3, 4, 3, 2, 4,
      1, 3, 1, 2, 4, 4, 3, 4, 2, 1,
      4, 1, 2, 2, 4, 1, 4, 1, 3, 1,
      4, 4, 4, 3, 3, 2, 3, 4, 2, 1,
    ],
  },
  "2014_4": {
    title: "2014년 4회차",
    folder: "2014_4",
    answers: [
      4, 2, 4, 3, 2, 3, 2, 1, 2, 3,
      2, 1, 1, 3, 4, 1, 1, 1, 3, 4,
      3, 4, 2, 2, 2, 1, 2, 4, 2, 4,
      1, 2, 3, 1, 1, 1, 4, 2, 4, 3,
      3, 2, 3, 1, 2, 2, 4, 2, 4, 1,
      1, 4, 2, 3, 3, 3, 4, 2, 1, 3,
    ],
  },
  "2015_1": {
    title: "2015년 1회차",
    folder: "2015_1",
    answers: [
      3, 1, 2, 3, 4, 3, 2, 1, 4, 3,
      3, 2, 3, 3, 4, 1, 4, 2, 2, 3,
      3, 4, 4, 2, 1, 1, 3, 3, 3, 3,
      2, 2, 1, 3, 3, 2, 3, 1, 4, 3,
      4, 3, 3, 4, 4, 4, 3, 2, 2, 4,
      2, 2, 3, 1, 2, 2, 3, 1, 3, 1,
    ],
  },
  "2015_2": {
    title: "2015년 2회차",
    folder: "2015_2",
    answers: [
      4, 3, 2, 3, 1, 1, 2, 1, 3, 1,
      4, 4, 2, 4, 1, 1, 2, 4, 3, 3,
      4, 2, 2, 1, 2, 1, 2, 4, 4, 3,
      1, 4, 2, 3, 1, 3, 4, 3, 4, 2,
      1, 3, 4, 1, 1, 2, 2, 4, 4, 2,
      1, 3, 4, 4, 4, 3, 3, 1, 2, 1,
    ],
  },
  "2015_3": {
    title: "2015년 3회차",
    folder: "2015_3",
    answers: [
      4, 2, 4, 3, 1, 1, 3, 2, 4, 1,
      3, 2, 3, 3, 3, 4, 2, 4, 4, 3,
      3, 4, 4, 3, 4, 3, 1, 3, 3, 3,
      3, 2, 3, 3, 4, 4, 1, 2, 3, 4,
      2, 3, 2, 1, 1, 3, 4, 3, 4, 3,
      2, 2, 1, 1, 2, 2, 4, 4, 3, 2,
    ],
  },
  "2015_4": {
    title: "2015년 4회차",
    folder: "2015_4",
    answers: [
      2, 3, 2, 4, 4, 4, 4, 4, 2, 1,
      3, 1, 1, 3, 2, 4, 2, 3, 3, 2,
      2, 1, 4, 1, 3, 3, 2, 3, 2, 2,
      2, 2, 1, 2, 4, 1, 2, 3, 2, 3,
      3, 4, 1, 2, 3, 2, 2, 2, 3, 3,
      3, 3, 2, 4, 2, 4, 2, 3, 1, 2,
    ],
  },
  "2016_1": {
    title: "2016년 1회차",
    folder: "2016_1",
    answers: [
      2, 3, 1, 4, 4, 1, 3, 4, 1, 3,
      2, 1, 2, 4, 2, 1, 4, 3, 2, 1,
      2, 1, 2, 4, 3, 1, 1, 1, 2, 1,
      4, 3, 1, 2, 4, 3, 4, 2, 4, 3,
      4, 1, 3, 2, 1, 2, 1, 4, 4, 1,
      3, 3, 1, 3, 4, 3, 3, 2, 4, 3,
    ],
  },
  "2016_2": {
    title: "2016년 2회차",
    folder: "2016_2",
    answers: [
      2, 3, 1, 2, 2, 4, 1, 1, 2, 3,
      4, 1, 4, 2, 3, 1, 1, 3, 2, 4,
      4, 4, 2, 3, 3, 3, 1, 1, 2, 1,
      3, 3, 3, 4, 4, 2, 4, 4, 1, 2,
      1, 2, 3, 4, 4, 4, 2, 1, 4, 1,
      2, 1, 1, 2, 1, 3, 2, 4, 4, 3,
    ],
  },
  "2016_3": {
    title: "2016년 3회차",
    folder: "2016_3",
    answers: [
      4, 2, 1, 3, 2, 4, 3, 3, 2, 2,
      4, 2, 3, 2, 4, 4, 1, 3, 2, 3,
      4, 4, 2, 1, 3, 3, 2, 4, 1, 1,
      4, 3, 4, 1, 4, 3, 3, 2, 1, 2,
      2, 4, 4, 4, 3, 2, 2, 4, 1, 1,
      4, 1, 3, 4, 2, 1, 4, 4, 1, 3,
    ],
  },
  "2026_1": {
    title: "2026 1학기 수행평가",
    folder: "2026_1",
    choiceCount: 5,
    answers: [
      1, 2, 3, 2, 3, 3, 3, 1, 4, 2,
      5, 5, 1, 1, 1, 5, 1, 2, 3, 1,
      5, 4, 2, 3, 4, 3, 4, 3, 1, 3,
      1, 4, 2, 4, 2, 4, 1, 5, 2, 1,
      3, 4, 2, 5, 4, 3, 3, 5, 3, 2,
      4, 4, 4, 5, 2, 2, 1, 5, 4, 1,
      1, 2, 3, 2, 4, 2, 2, 3, 2, 2,
    ],
  },
};

const EXPLANATIONS = window.HGBGO_EXPLANATIONS || {};
const QUESTION_TEXTS = {};

const USERS = {
  "0000": { password: "0000", role: "teacher", name: "교사" },
  "1199": { password: "1199", role: "teacher", name: "1학년 1반 담임", classPrefix: "11" },
  "1299": { password: "1299", role: "teacher", name: "1학년 2반 담임", classPrefix: "12" },
};

for (let id = 1101; id <= 1121; id += 1) {
  USERS[String(id)] = { password: String(id), role: "student", name: String(id) };
}
for (let id = 1201; id <= 1221; id += 1) {
  USERS[String(id)] = { password: String(id), role: "student", name: String(id) };
}

const state = {
  user: null,
  currentExamId: null,
  currentMode: "real",
  current: 1,
  selections: [],
  practiceFeedback: null,
  startedAt: null,
  lastResult: null,
  dashboardReturn: "examSelect",
  dashboardMode: "students",
  dashboardDetail: null,
  dataStatus: "",
  accessHeartbeatId: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const screens = {
  login: $("#loginScreen"),
  examSelect: $("#examSelectScreen"),
  exam: $("#examScreen"),
  result: $("#resultScreen"),
  dashboard: $("#dashboardScreen"),
};

const supabaseSettings = window.HGBGO_SUPABASE || {};
const supabaseClient = window.supabase && supabaseSettings.url && supabaseSettings.anonKey
  ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey)
  : null;

let loadingCount = 0;

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setLoading(active, message = "데이터 연결 중") {
  const overlay = $("#loadingOverlay");
  if (!overlay) return;
  if (active) {
    loadingCount += 1;
    $("#loadingTitle").textContent = message;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    return;
  }

  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }
}

async function withLoading(message, task) {
  setLoading(true, message);
  try {
    return await task();
  } finally {
    setLoading(false);
  }
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isToday(isoString) {
  return isoString && todayKey(new Date(isoString)) === todayKey();
}

function attemptMinutes(attempt) {
  const start = new Date(attempt.startedAt).getTime();
  const end = new Date(attempt.submittedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(Math.round((end - start) / 60000), 180);
}

function formatMinutes(minutes) {
  if (!minutes) return "0분";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}시간 ${mins}분` : `${mins}분`;
}

function currentExam() {
  return EXAMS[state.currentExamId];
}

function questionCount(examId = state.currentExamId) {
  return EXAMS[examId]?.answers?.length || 0;
}

function attemptQuestionCount(attempt) {
  return attempt.items?.length || questionCount(attempt.examId) || 60;
}

function isPracticeMode() {
  return state.currentMode === "practice";
}

function modeLabel(mode = state.currentMode) {
  return mode === "practice" ? "연습용" : "실전용";
}

async function loadQuestionTexts() {
  if (Object.keys(QUESTION_TEXTS).length) return;
  try {
    const sources = ["data/question-ocr.json", "data/question-2026-1.json"];
    const responses = await Promise.all(sources.map((path) => fetch(path)));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`question OCR load failed: ${failed.status}`);
    const rows = (await Promise.all(responses.map((response) => response.json()))).flat();
    rows.forEach((row) => {
      const match = row.path?.match(/assets\/exams\/([^/]+)\/(\d+)\.png$/);
      if (!match) return;
      QUESTION_TEXTS[match[1]] ||= {};
      QUESTION_TEXTS[match[1]][Number(match[2])] = row.text || "";
    });
  } catch (error) {
    console.warn("Question OCR load failed", error);
  }
}

function cleanQuestionText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function questionStem(text) {
  const normalized = cleanQuestionText(text);
  const optionStart = normalized.search(/[①②③④⑤]/);
  return (optionStart >= 0 ? normalized.slice(0, optionStart) : normalized)
    .replace(/^\d+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function questionOptions(text) {
  const normalized = cleanQuestionText(text)
    .replace(/(^|\n)\s*[lI]\s+/g, "$1① ")
    .replace(/(^|\n)\s*[@⑦]\s+/g, "$1② ")
    .replace(/(^|\n)\s*[.·]\s+/g, "$1④ ");
  const symbols = { "①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5 };
  const options = {};
  [...normalized.matchAll(/([①②③④⑤])\s*([\s\S]*?)(?=(?:\n?[①②③④⑤]\s*)|$)/g)].forEach((match) => {
    options[symbols[match[1]]] = match[2].replace(/\s+/g, " ").trim();
  });
  if (Object.keys(options).length >= 3) return options;

  normalized.split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const match = line.match(/^([1-5])[\).]?\s+(.+)$/);
    if (match && !options[Number(match[1])]) options[Number(match[1])] = match[2].trim();
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

function explanationFor(examId, qno) {
  const generated = EXPLANATIONS[examId]?.[qno];
  if (generated) return generated;

  const source = QUESTION_TEXTS[examId]?.[qno];
  const answer = EXAMS[examId]?.answers?.[qno - 1];
  const answerText = questionOptions(source)[answer];
  if (source && answerText) {
    const stem = questionStem(source);
    const kind = questionKind(stem);
    const reason = concreteReason(source, answerText, kind);
    if (kind === "negative") return `틀린 설명을 찾을 때는 보기의 핵심어와 결과가 실제 개념과 맞는지 대조해야 합니다. ${reason} 이 기준으로 보면 나머지 보기는 개념의 방향과 맞고, 이 설명만 원리나 용어가 어긋난다는 점을 찾아낼 수 있습니다.`;
    if (kind === "positive") return `조건에 맞는 설명을 고를 때는 용어, 목적, 사용 조건이 모두 맞아야 합니다. ${reason} 따라서 보기에서 같은 핵심 조건을 말하는 문장을 찾고, 일부 조건만 맞거나 재료·코드·용도가 다른 보기는 제외하면 됩니다.`;
    if (kind === "calculation") return `계산형 문항은 먼저 구해야 할 값을 정하고 단위를 통일해야 합니다. ${reason} 식에 넣기 전 mm, m/min, rpm, 분당 이송처럼 단위가 서로 맞는지 확인한 뒤 계산값과 같은 보기를 고르면 됩니다.`;
    return `개념형 문항은 보기의 용어가 정의, 목적, 사용 상황과 맞는지 확인하면 됩니다. ${reason} 비슷한 용어가 함께 나오면 재료 조성, 가공 목적, 측정 대상처럼 구분 기준이 되는 단어를 먼저 표시해 보기를 좁히면 됩니다.`;
  }
  return "문제의 핵심 용어와 보기의 조건을 먼저 표시해 보세요. 계산 문제라면 단위와 공식의 대응을, 개념 문제라면 목적·방법·결과가 서로 맞는지를 비교하면 정답 후보를 좁힐 수 있습니다. 해설은 정답 번호 대신 판단 기준만 제공하므로, 이 기준으로 보기를 다시 골라보세요.";
}

function studentLabel(studentId) {
  return String(studentId);
}

function isStudentId(id) {
  return USERS[String(id)]?.role === "student";
}

function isTeacherPersonalMode() {
  return state.user?.role === "teacher" && state.dashboardMode === "personal";
}

function dashboardScopeLabel() {
  if (isTeacherPersonalMode()) return `${state.user.id} 개인 분석`;
  if (state.user?.classPrefix === "11") return "1학년 1반";
  if (state.user?.classPrefix === "12") return "1학년 2반";
  if (state.user?.role === "teacher") return "전체";
  return "나의 기록";
}

function filterAttemptsForDashboard(attempts) {
  if (isTeacherPersonalMode()) {
    return attempts.filter((attempt) => String(attempt.studentId) === state.user.id);
  }
  if (state.user?.role === "teacher") {
    const studentAttempts = attempts.filter((attempt) => isStudentId(attempt.studentId));
    if (!state.user.classPrefix) return studentAttempts;
    return studentAttempts.filter((attempt) => String(attempt.studentId).startsWith(state.user.classPrefix));
  }
  return attempts.filter((attempt) => String(attempt.studentId) === state.user?.id);
}

function filterAccessForDashboard(logs) {
  if (isTeacherPersonalMode()) {
    return logs.filter((log) => String(log.userId) === state.user.id);
  }
  const studentLogs = logs.filter((log) => log.role === "student");
  if (state.user?.role === "teacher") {
    if (!state.user.classPrefix) return studentLogs;
    return studentLogs.filter((log) => String(log.userId).startsWith(state.user.classPrefix));
  }
  return studentLogs.filter((log) => String(log.userId) === state.user?.id);
}

function questionImagePath(qno, examId = state.currentExamId) {
  const exam = EXAMS[examId];
  return `assets/exams/${exam.folder}/${qno}.png`;
}

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeAttempt(row) {
  return {
    id: row.id,
    examId: row.exam_id ?? row.examId,
    examTitle: row.exam_title ?? row.examTitle,
    mode: row.mode || "real",
    studentId: row.student_id ?? row.studentId,
    startedAt: row.started_at ?? row.startedAt,
    submittedAt: row.submitted_at ?? row.submittedAt,
    correctCount: row.correct_count ?? row.correctCount,
    score: row.score,
    items: row.items || [],
  };
}

function normalizeAccess(row) {
  return {
    userId: row.user_id ?? row.userId,
    role: row.role,
    at: row.accessed_at ?? row.at,
  };
}

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function supabaseFailureMessage(error, label) {
  const detail = error?.message || "network request failed";
  if (detail.toLowerCase().includes("failed to fetch")) {
    return `${label} 실패: Supabase 주소에 연결하지 못했습니다. 프로젝트 URL 또는 publishable key를 확인하세요.`;
  }
  return `${label} 실패: ${detail}`;
}

async function loadAttempts(options = {}) {
  const { since, limit = 500 } = options;
  if (!supabaseClient) {
    let rows = readStore(ATTEMPTS_KEY).map(normalizeAttempt).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    if (since) rows = rows.filter((row) => new Date(row.submittedAt) >= new Date(since));
    return rows.slice(0, limit);
  }

  let query = supabaseClient
    .from("cbt_attempts")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (since) query = query.gte("submitted_at", since);
  const { data, error } = await query;

  if (error) {
    console.warn("Supabase attempts load failed", error);
    state.dataStatus = supabaseFailureMessage(error, "응시 기록 조회");
    return readStore(ATTEMPTS_KEY);
  }
  state.dataStatus = "";
  return data.map(normalizeAttempt);
}

async function saveAttempt(result) {
  if (!supabaseClient) {
    const attempts = readStore(ATTEMPTS_KEY);
    attempts.push(result);
    writeStore(ATTEMPTS_KEY, attempts);
    return;
  }

  const { error } = await supabaseClient.from("cbt_attempts").insert({
    exam_id: result.examId,
    exam_title: result.examTitle,
    mode: result.mode,
    student_id: result.studentId,
    started_at: result.startedAt,
    submitted_at: result.submittedAt,
    correct_count: result.correctCount,
    score: result.score,
    items: result.items,
  });
  if (error) {
    console.warn("Supabase attempt save failed", error);
    const attempts = readStore(ATTEMPTS_KEY);
    attempts.push(result);
    writeStore(ATTEMPTS_KEY, attempts);
  }
}

async function loadAccessLog(options = {}) {
  const { since, limit = 2000 } = options;
  if (!supabaseClient) {
    let rows = readStore(ACCESS_KEY).sort((a, b) => new Date(b.at) - new Date(a.at));
    if (since) rows = rows.filter((row) => new Date(row.at) >= new Date(since));
    return rows.slice(0, limit);
  }

  let query = supabaseClient
    .from("cbt_access_logs")
    .select("*")
    .order("accessed_at", { ascending: false })
    .limit(limit);
  if (since) query = query.gte("accessed_at", since);
  const { data, error } = await query;

  if (error) {
    console.warn("Supabase access load failed", error);
    state.dataStatus = state.dataStatus || supabaseFailureMessage(error, "접속 기록 조회");
    return readStore(ACCESS_KEY);
  }
  return data.map(normalizeAccess);
}

async function recordAccess(user) {
  if (!supabaseClient) {
    const logs = readStore(ACCESS_KEY);
    logs.push({ userId: user.id, role: user.role, at: new Date().toISOString() });
    writeStore(ACCESS_KEY, logs.slice(-2000));
    return;
  }

  const { error } = await supabaseClient.from("cbt_access_logs").insert({
    user_id: user.id,
    role: user.role,
    accessed_at: new Date().toISOString(),
  });
  if (error) console.warn("Supabase access save failed", error);
}

function activeStudentIdsFromLogs(logs) {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  return new Set(logs
    .filter((log) => log.role === "student" && new Date(log.at).getTime() >= cutoff)
    .map((log) => String(log.userId)));
}

function studentStatusLabel(id, isActive) {
  const label = studentLabel(id);
  if (!isActive) return label;
  return `<span class="student-online" title="현재 접속 중" aria-label="${label} 현재 접속 중"><i></i>${label}</span>`;
}

function stopAccessHeartbeat() {
  if (!state.accessHeartbeatId) return;
  clearInterval(state.accessHeartbeatId);
  state.accessHeartbeatId = null;
}

function startAccessHeartbeat() {
  stopAccessHeartbeat();
  if (!state.user) return;
  state.accessHeartbeatId = setInterval(() => {
    if (!state.user || document.visibilityState === "hidden") return;
    recordAccess(state.user);
  }, ACCESS_HEARTBEAT_MS);
}

async function renderExamSelect() {
  $("#welcomeText").textContent = `${state.user.name}님, 응시할 문제를 선택하세요`;
  const list = $("#examList");
  list.innerHTML = "";
  const allAttempts = await loadAttempts({ limit: 500 });

  Object.entries(EXAMS).forEach(([examId, exam]) => {
    const attempts = allAttempts.filter((attempt) => (
      attempt.studentId === state.user.id
      && attempt.examId === examId
      && attempt.mode === "real"
    ));
    const latest = attempts[0];
    const card = document.createElement("article");
    card.className = "exam-card";
    card.innerHTML = `
      <h3>${exam.title}</h3>
      <p>${exam.answers.length}문항${latest ? ` · 최근 실전 ${latest.score}점` : " · 실전 미응시"}</p>
      <div class="exam-card-actions">
        <button class="secondary-btn" type="button" data-mode="practice">연습용</button>
        <button class="primary-btn" type="button" data-mode="real">실전용</button>
      </div>
    `;
    card.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => startExam(examId, button.dataset.mode));
    });
    list.appendChild(card);
  });
}

function renderQuestionMap() {
  const map = $("#questionMap");
  map.innerHTML = "";
  for (let qno = 1; qno <= questionCount(); qno += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-btn";
    btn.textContent = String(qno);
    btn.setAttribute("aria-label", `${qno}번으로 이동`);
    btn.addEventListener("click", () => {
      state.current = qno;
      renderQuestion();
    });
    map.appendChild(btn);
  }
}

function updateProgress() {
  const answered = state.selections.filter(Boolean).length;
  const total = questionCount();
  $("#answeredCount").textContent = `${answered} / ${total}`;
  $("#progressBar").style.width = `${(answered / total) * 100}%`;
  $$(".map-btn").forEach((btn, index) => {
    const qno = index + 1;
    btn.classList.toggle("answered", Boolean(state.selections[index]));
    btn.classList.toggle("current", qno === state.current);
  });
}

function renderQuestion() {
  const qno = state.current;
  const exam = currentExam();
  $("#studentBadge").textContent = `${studentLabel(state.user.id)} · ${exam.title} · ${modeLabel()}`;
  $("#questionTitle").textContent = `${qno}번`;
  $("#questionImage").src = questionImagePath(qno);
  $("#questionImage").alt = `${exam.title} ${qno}번 문제`;
  $$(".choice-btn").forEach((btn) => {
    btn.hidden = Number(btn.dataset.choice) > (exam.choiceCount || 4);
    btn.classList.toggle("selected", Number(btn.dataset.choice) === state.selections[qno - 1]);
  });
  $("#choicePanel").style.setProperty("--choice-count", exam.choiceCount || 4);
  const feedback = state.practiceFeedback?.qno === qno ? state.practiceFeedback : null;
  const explanationPanel = $("#explanationPanel");
  explanationPanel.hidden = !feedback;
  if (feedback) {
    $("#explanationTitle").textContent = `${qno}번 풀이 힌트`;
    $("#explanationText").textContent = feedback.text;
  }
  $("#prevBtn").disabled = qno === 1;
  $("#nextBtn").disabled = qno === questionCount();
  $("#submitBtn").textContent = isPracticeMode() ? "연습 마치기" : "채점하기";
  updateProgress();
}

function startExam(examId, mode = state.currentMode || "real") {
  state.currentExamId = examId;
  state.currentMode = mode;
  state.current = 1;
  state.selections = Array(questionCount(examId)).fill(null);
  state.practiceFeedback = null;
  state.startedAt = new Date().toISOString();
  renderQuestionMap();
  renderQuestion();
  showScreen("exam");
}

function scoreExam() {
  const items = currentExam().answers.map((answer, index) => {
    const qno = index + 1;
    const selected = state.selections[index];
    return { qno, answer, selected, correct: selected === answer };
  });
  const correctCount = items.filter((item) => item.correct).length;
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    examId: state.currentExamId,
    examTitle: currentExam().title,
    mode: state.currentMode,
    studentId: state.user.id,
    startedAt: state.startedAt,
    submittedAt: new Date().toISOString(),
    correctCount,
    score: Math.round((correctCount / questionCount()) * 100),
    items,
  };
}

async function submitExam() {
  const unanswered = state.selections
    .map((choice, index) => (choice ? null : index + 1))
    .filter(Boolean);
  if (unanswered.length && !confirm(`미응답 ${unanswered.length}문항이 있습니다. 그대로 채점할까요?`)) {
    state.current = unanswered[0];
    renderQuestion();
    return;
  }
  const result = scoreExam();
  await withLoading("점수 저장 중", () => saveAttempt(result));
  state.lastResult = result;
  renderResult(result);
  showScreen("result");
}

function renderResult(result) {
  if (result.mode === "practice") {
    $("#scoreText").textContent = "연습 기록이 저장되었습니다";
  } else {
    $("#scoreText").textContent = `${result.score}점 / ${result.correctCount}개 정답`;
  }
  $("#resultMeta").textContent = `${result.examTitle} · ${modeLabel(result.mode)} · ${studentLabel(result.studentId)} · 제출 ${new Date(result.submittedAt).toLocaleString()}`;
  const wrongItems = result.items.filter((item) => !item.correct);
  const wrongList = $("#wrongList");
  wrongList.innerHTML = "";

  if (!wrongItems.length) {
    wrongList.innerHTML = '<div class="wrong-card"><strong>오답이 없습니다.</strong></div>';
    return;
  }

  wrongItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "wrong-card";
    const selectedText = item.selected ? `${item.selected}번` : "미응답";
    card.innerHTML = `
      <div class="wrong-meta">
        <span>${item.qno}번</span>
        <span>선택 ${selectedText}</span>
      </div>
      <img src="${questionImagePath(item.qno, result.examId)}" alt="${result.examTitle} ${item.qno}번 문제">
      <div class="wrong-explanation">
        <strong>풀이 힌트</strong>
        <p>${explanationFor(result.examId, item.qno)}</p>
      </div>
    `;
    wrongList.appendChild(card);
  });
}

async function renderDashboard() {
  state.dataStatus = "";
  $("#dashboardScreen").classList.toggle("teacher-mode", state.user?.role === "teacher");
  $("#backFromDashboardBtn").textContent = state.user?.role === "teacher" ? "로그아웃" : "돌아가기";
  const todayStart = startOfTodayIso();
  const todayAllAttempts = await loadAttempts({ since: todayStart, limit: 300 });
  const recentAllAttempts = await loadAttempts({ limit: 500 });
  const todayAttempts = filterAttemptsForDashboard(todayAllAttempts);
  const recentAttempts = filterAttemptsForDashboard(recentAllAttempts);
  const todayRealAttempts = todayAttempts.filter((attempt) => attempt.mode === "real");
  const recentRealAttempts = recentAttempts.filter((attempt) => attempt.mode === "real");
  const dashboardAttempts = state.user?.role === "teacher" ? todayRealAttempts : recentRealAttempts;
  const scores = dashboardAttempts.map((attempt) => attempt.score);

  const todayAccessLog = filterAccessForDashboard(await loadAccessLog({ since: todayStart, limit: 1000 }));
  const recentAccessLog = filterAccessForDashboard(await loadAccessLog({ limit: 5000 }));
  const activeStudentIds = activeStudentIdsFromLogs(recentAccessLog);
  const todayVisitorCount = new Set(todayAccessLog.map((log) => log.userId)).size;
  const totalVisitorCount = new Set(recentAccessLog.map((log) => log.userId)).size;

  state.dashboardDetail = {
    todayAttempts,
    recentAttempts,
    recentRealAttempts,
    recentAccessLog,
    activeStudentIds,
  };

  $("#totalAttempts").textContent = String(dashboardAttempts.length);
  $("#averageScore").textContent = scores.length ? String(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)) : "0";
  $("#bestScore").textContent = scores.length ? String(Math.max(...scores)) : "0";
  $("#todayVisitors").textContent = String(todayVisitorCount);
  $("#totalVisitors").textContent = String(totalVisitorCount);
  const statusBox = $("#dashboardStatus");
  if (statusBox) {
    const connectionText = supabaseClient ? "Supabase 연결됨" : "로컬 저장 모드";
    statusBox.textContent = state.dataStatus || `${connectionText} · ${dashboardScopeLabel()} 범위`;
  }

  if (isTeacherPersonalMode()) {
    renderPersonalAnalysisRows(recentAttempts, recentRealAttempts);
  } else {
    renderLearningRows(todayAttempts, recentAttempts, recentRealAttempts, activeStudentIds);
  }
  hideStudentDetail();
  renderScoreDistribution(todayRealAttempts);
  renderStudyInsights(todayRealAttempts, recentRealAttempts, recentAccessLog);
  renderMissDashboard(recentRealAttempts);
}

function renderTodayScoreRows(attempts) {
  const rows = $("#studentRows");
  rows.innerHTML = "";
  attempts
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .forEach((attempt) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${attempt.examTitle}</td>
        <td>${studentLabel(attempt.studentId)}</td>
        <td>${attempt.score}</td>
        <td>${attempt.correctCount}/${attemptQuestionCount(attempt)}</td>
        <td>${new Date(attempt.submittedAt).toLocaleTimeString()}</td>
      `;
      rows.appendChild(tr);
    });
  if (!attempts.length) rows.innerHTML = '<tr><td colspan="5">오늘 응시 기록이 없습니다.</td></tr>';
}

function renderStudentSummaryRows(attempts) {
  const byStudentExam = new Map();
  attempts.forEach((attempt) => {
    const key = `${attempt.examId}__${attempt.studentId}`;
    const list = byStudentExam.get(key) || [];
    list.push(attempt);
    byStudentExam.set(key, list);
  });

  const rows = $("#studentRows");
  rows.innerHTML = "";
  [...byStudentExam.entries()].forEach(([_key, list]) => {
    const latest = list[0];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${latest.examTitle}</td>
      <td>${studentLabel(latest.studentId)}</td>
      <td>${latest.score}</td>
      <td>${latest.correctCount}/${attemptQuestionCount(latest)}</td>
      <td>${new Date(latest.submittedAt).toLocaleString()}</td>
    `;
    rows.appendChild(tr);
  });
  if (!byStudentExam.size) rows.innerHTML = '<tr><td colspan="5">아직 기록이 없습니다.</td></tr>';
}

function buildStudentMetrics(todayAttempts, attempts, scoreAttempts, activeStudentIds = new Set()) {
  const metrics = new Map();
  Object.entries(USERS)
    .filter(([, user]) => user.role === "student")
    .forEach(([id]) => {
      metrics.set(id, {
        id,
        realAttemptCount: 0,
        todayMinutes: 0,
        totalMinutes: 0,
        averageScore: 0,
        bestScore: 0,
        scores: [],
      });
    });

  todayAttempts.forEach((attempt) => {
    const id = String(attempt.studentId);
    if (!metrics.has(id)) return;
    metrics.get(id).todayMinutes += attemptMinutes(attempt);
  });

  attempts.forEach((attempt) => {
    const id = String(attempt.studentId);
    if (!metrics.has(id)) return;
    const row = metrics.get(id);
    row.totalMinutes += attemptMinutes(attempt);
  });

  scoreAttempts.forEach((attempt) => {
    const id = String(attempt.studentId);
    if (!metrics.has(id)) return;
    const row = metrics.get(id);
    row.realAttemptCount += 1;
    row.scores.push(Number(attempt.score) || 0);
  });

  metrics.forEach((row) => {
    row.averageScore = row.scores.length
      ? Math.round(row.scores.reduce((sum, score) => sum + score, 0) / row.scores.length)
      : 0;
    row.bestScore = row.scores.length ? Math.max(...row.scores) : 0;
  });

  return [...metrics.values()]
    .filter((row) => row.todayMinutes || row.realAttemptCount || row.totalMinutes || activeStudentIds.has(String(row.id)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function renderLearningRows(todayAttempts, attempts, scoreAttempts, activeStudentIds = new Set()) {
  const rows = $("#studentRows");
  rows.innerHTML = "";
  const metrics = buildStudentMetrics(todayAttempts, attempts, scoreAttempts, activeStudentIds);
  metrics.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${studentStatusLabel(row.id, activeStudentIds.has(String(row.id)))}</td>
      <td>${row.realAttemptCount}</td>
      <td>${formatMinutes(row.todayMinutes)}</td>
      <td>${formatMinutes(row.totalMinutes)}</td>
      <td>${row.averageScore} / ${row.bestScore}</td>
      <td><button class="small-btn detail-btn" type="button" data-student-id="${row.id}">상세</button></td>
    `;
    rows.appendChild(tr);
  });
  if (!metrics.length) rows.innerHTML = '<tr><td colspan="6">아직 학습 기록이 없습니다.</td></tr>';
  rows.querySelectorAll(".detail-btn").forEach((button) => {
    button.addEventListener("click", () => renderStudentDetail(button.dataset.studentId));
  });
}

function renderPersonalAnalysisRows(attempts, scoreAttempts) {
  const rows = $("#studentRows");
  rows.innerHTML = "";
  attempts
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .forEach((attempt) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${attempt.examTitle} (${modeLabel(attempt.mode)})</td>
        <td>-</td>
        <td>${attempt.mode === "real" ? 1 : 0}</td>
        <td>${formatMinutes(attemptMinutes(attempt))}</td>
        <td>${attempt.mode === "real" ? `${attempt.score} / ${attempt.score}` : "-"}</td>
        <td>${new Date(attempt.submittedAt).toLocaleString()}</td>
      `;
      rows.appendChild(tr);
    });
  if (!attempts.length) rows.innerHTML = '<tr><td colspan="6">아직 개인 풀이 기록이 없습니다.</td></tr>';
}

function hideStudentDetail() {
  const section = $("#studentDetailSection");
  if (section) section.hidden = true;
}

function renderStudentDetail(studentId) {
  const detail = state.dashboardDetail;
  if (!detail) return;
  const attempts = detail.recentAttempts
    .filter((attempt) => String(attempt.studentId) === String(studentId))
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  const realAttempts = attempts.filter((attempt) => attempt.mode === "real");

  $("#studentDetailTitle").textContent = `${studentId} 학습 기록`;
  renderStudentExamSummary(realAttempts);
  renderStudentScoreTrend(realAttempts);
  renderStudentWrongSummary(realAttempts);
  $("#studentDetailSection").hidden = false;
  $("#studentDetailSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStudentExamSummary(attempts) {
  const box = $("#studentExamSummary");
  const byExam = new Map();
  Object.entries(EXAMS).forEach(([examId, exam]) => {
    byExam.set(examId, { exam, attempts: [] });
  });
  attempts.forEach((attempt) => {
    if (byExam.has(attempt.examId)) byExam.get(attempt.examId).attempts.push(attempt);
  });
  box.innerHTML = [...byExam.values()].map(({ exam, attempts: examAttempts }) => {
    const scores = examAttempts.map((attempt) => Number(attempt.score) || 0);
    const latest = examAttempts[examAttempts.length - 1];
    const best = scores.length ? Math.max(...scores) : "-";
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : "-";
    return `
      <div class="detail-row">
        <strong>${exam.title}</strong>
        <span>${examAttempts.length}회 풀이 · 평균 ${average}점 · 최고 ${best}점${latest ? ` · 최근 ${latest.score}점` : ""}</span>
      </div>
    `;
  }).join("");
}

function renderStudentScoreTrend(attempts) {
  const box = $("#studentScoreTrend");
  if (!attempts.length) {
    box.innerHTML = "<p>아직 실전 점수 기록이 없습니다.</p>";
    return;
  }
  const points = attempts.map((attempt, index) => ({
    label: `${attempt.examTitle} ${index + 1}`,
    score: Number(attempt.score) || 0,
    at: new Date(attempt.submittedAt).toLocaleDateString(),
  }));
  box.innerHTML = points.map((point) => `
    <div class="trend-row">
      <span>${point.at}</span>
      <div class="trend-bar"><i style="width: ${point.score}%"></i></div>
      <strong>${point.score}점</strong>
    </div>
  `).join("");
}

function renderStudentWrongSummary(attempts) {
  const box = $("#studentWrongSummary");
  const wrongs = new Map();
  attempts.forEach((attempt) => {
    attempt.items.forEach((item) => {
      if (item.correct) return;
      const key = `${attempt.examId}__${item.qno}`;
      const row = wrongs.get(key) || { examId: attempt.examId, examTitle: attempt.examTitle, qno: item.qno, count: 0 };
      row.count += 1;
      wrongs.set(key, row);
    });
  });
  const rows = [...wrongs.values()]
    .sort((a, b) => b.count - a.count || a.examTitle.localeCompare(b.examTitle) || a.qno - b.qno)
    .slice(0, 12);
  if (!rows.length) {
    box.innerHTML = "<p>누적 오답 기록이 없습니다.</p>";
    return;
  }
  box.innerHTML = rows.map((row) => `
    <div class="detail-row">
      <strong>${row.examTitle} ${row.qno}번</strong>
      <span>${row.count}회 오답</span>
    </div>
  `).join("");
}

function renderScoreDistribution(attempts) {
  const box = $("#scoreDistribution");
  if (!box) return;
  const bins = [
    { label: "0-39점", min: 0, max: 39, students: [] },
    { label: "40-59점", min: 40, max: 59, students: [] },
    { label: "60-79점", min: 60, max: 79, students: [] },
    { label: "80-100점", min: 80, max: 100, students: [] },
  ];
  attempts.forEach((attempt) => {
    const score = Number(attempt.score) || 0;
    const bin = bins.find((item) => score >= item.min && score <= item.max);
    if (bin) bin.students.push({ id: studentLabel(attempt.studentId), score });
  });
  const maxCount = Math.max(...bins.map((bin) => bin.students.length), 1);
  box.innerHTML = bins.map((bin) => `
    <div class="score-bin">
      <span>${bin.label}</span>
      <div class="score-bar"><i style="width: ${(bin.students.length / maxCount) * 100}%"></i></div>
      <strong>${bin.students.length}명</strong>
      <div class="score-students">
        ${bin.students.length
          ? bin.students
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((student) => `<em>${student.id} (${student.score})</em>`)
            .join("")
          : "<small>해당 없음</small>"}
      </div>
    </div>
  `).join("");
}

function renderStudyInsights(todayAttempts, recentAttempts, accessLog) {
  const box = $("#studyInsights");
  if (!box) return;
  const metrics = buildStudentMetrics(todayAttempts, recentAttempts, recentAttempts);
  const studiedNoRealAttempt = metrics.filter((row) => row.totalMinutes && !row.realAttemptCount).length;
  const scores = recentAttempts.map((attempt) => Number(attempt.score) || 0);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const lowScoreCount = scores.filter((score) => score < 60).length;
  const topMiss = getTopMisses(recentAttempts, 1)[0];
  const insights = [];

  if (scores.length) {
    insights.push(`누적 평균은 ${average}점입니다. 60점 미만 기록은 ${lowScoreCount}회라서, 재응시 전에 오답노트를 먼저 확인하는 흐름이 좋습니다.`);
  } else {
    insights.push("아직 누적 점수 데이터가 없습니다. 학생이 한 회차 이상 제출하면 분포와 약점 분석이 채워집니다.");
  }
  if (topMiss) {
    insights.push(`가장 많이 틀린 문항은 ${EXAMS[topMiss.examId].title} ${topMiss.qno}번입니다. 수업 시작 전에 이 문항을 짧게 풀이하면 효율이 좋습니다.`);
  }
  if (studiedNoRealAttempt) {
    insights.push(`학습시간은 있으나 실전 제출 기록이 없는 학생 ID가 ${studiedNoRealAttempt}명 있습니다. 연습만 반복 중인지, 실전 응시 전 도움이 필요한지 확인해보면 좋습니다.`);
  }
  if (todayAttempts.length) {
    insights.push(`오늘 실전 제출 기록은 ${todayAttempts.length}회입니다. 같은 회차 반복 응시자는 점수 변화 폭을 기준으로 개별 피드백을 주기 좋습니다.`);
  }

  box.innerHTML = insights.map((text) => `<p>${text}</p>`).join("");
}

function getTopMisses(attempts, limit = 10) {
  const misses = new Map();
  Object.keys(EXAMS).forEach((examId) => {
    for (let qno = 1; qno <= questionCount(examId); qno += 1) {
      misses.set(`${examId}__${qno}`, { examId, qno, count: 0 });
    }
  });

  attempts.forEach((attempt) => {
    attempt.items.forEach((item) => {
      if (!item.correct) {
        const key = `${attempt.examId}__${item.qno}`;
        if (misses.has(key)) misses.get(key).count += 1;
      }
    });
  });

  return [...misses.values()]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.examId.localeCompare(b.examId) || a.qno - b.qno)
    .slice(0, limit);
}

function renderMissDashboard(attempts) {
  const misses = new Map();
  Object.keys(EXAMS).forEach((examId) => {
    for (let qno = 1; qno <= questionCount(examId); qno += 1) {
      misses.set(`${examId}__${qno}`, { examId, qno, count: 0 });
    }
  });

  attempts.forEach((attempt) => {
    attempt.items.forEach((item) => {
      if (!item.correct) {
        const key = `${attempt.examId}__${item.qno}`;
        if (misses.has(key)) misses.get(key).count += 1;
      }
    });
  });

  const topMisses = [...misses.values()]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.examId.localeCompare(b.examId) || a.qno - b.qno)
    .slice(0, 10);

  const box = $("#missDashboard");
  box.innerHTML = "";
  if (!topMisses.length) {
    box.innerHTML = "<p>아직 오답 데이터가 없습니다.</p>";
    return;
  }

  topMisses.forEach((item, index) => {
    const exam = EXAMS[item.examId];
    const card = document.createElement("article");
    card.className = "miss-card";
    card.innerHTML = `
      <div class="miss-card-head">
        <strong>${index + 1}. ${exam.title} ${item.qno}번</strong>
        <span>${item.count}회 오답</span>
      </div>
      <img src="${questionImagePath(item.qno, item.examId)}" alt="${exam.title} ${item.qno}번 문제">
      <div class="wrong-explanation">
        <strong>지도 힌트</strong>
        <p>${explanationFor(item.examId, item.qno)}</p>
      </div>
    `;
    box.appendChild(card);
  });
}

async function login(id, password) {
  const user = USERS[id];
  if (!user || user.password !== password) {
    $("#loginMessage").textContent = "아이디 또는 비밀번호가 맞지 않습니다.";
    return;
  }
  state.user = { ...user, id };
  document.body.classList.toggle("teacher-session", user.role === "teacher");
  $("#loginMessage").textContent = "";
  await withLoading("데이터 연결 중", async () => {
    await loadQuestionTexts();
    await recordAccess(state.user);
    startAccessHeartbeat();
    if (user.role === "teacher") {
      state.dashboardReturn = "login";
      await renderDashboard();
      showScreen("dashboard");
      return;
    }
    await renderExamSelect();
    showScreen("examSelect");
  });
}

function logout() {
  stopAccessHeartbeat();
  state.user = null;
  state.currentExamId = null;
  state.currentMode = "real";
  state.practiceFeedback = null;
  state.lastResult = null;
  state.dashboardMode = "students";
  document.body.classList.remove("teacher-session");
  $("#loginId").value = "";
  $("#loginPw").value = "";
  showScreen("login");
}

function setupCalculator() {
  const calculator = $("#calculator");
  const display = $("#calcDisplay");
  let expr = "";

  function setDisplay(value) {
    display.value = value || "0";
  }

  $("#calculatorToggle").addEventListener("click", () => calculator.classList.toggle("open"));
  $("#calcClose").addEventListener("click", () => calculator.classList.remove("open"));

  $$(".calc-grid button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.calc;
      if (value === "C") {
        expr = "";
        setDisplay(expr);
        return;
      }
      if (value === "back") {
        expr = expr.slice(0, -1);
        setDisplay(expr);
        return;
      }
      if (value === "=") {
        try {
          if (!/^[0-9+\-*/%. ()]+$/.test(expr)) throw new Error("bad expression");
          expr = String(Function(`"use strict"; return (${expr})`)());
          setDisplay(expr);
        } catch {
          expr = "";
          setDisplay("오류");
        }
        return;
      }
      expr += value;
      setDisplay(expr);
    });
  });
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await login($("#loginId").value.trim(), $("#loginPw").value.trim());
});

$("#logoutBtn").addEventListener("click", logout);

$$(".choice-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const choice = Number(btn.dataset.choice);
    if (isPracticeMode() && choice !== currentExam().answers[state.current - 1]) {
      state.practiceFeedback = {
        qno: state.current,
        text: explanationFor(state.currentExamId, state.current),
      };
      renderQuestion();
      return;
    }
    state.practiceFeedback = null;
    state.selections[state.current - 1] = choice;
    if (state.current < questionCount()) state.current += 1;
    renderQuestion();
  });
});

$("#prevBtn").addEventListener("click", () => {
  state.current = Math.max(1, state.current - 1);
  renderQuestion();
});

$("#nextBtn").addEventListener("click", () => {
  state.current = Math.min(questionCount(), state.current + 1);
  renderQuestion();
});

$("#submitBtn").addEventListener("click", submitExam);
$("#tryAgainBtn").addEventListener("click", () => {
  state.practiceFeedback = null;
  renderQuestion();
});
$("#retryBtn").addEventListener("click", () => startExam(state.currentExamId, state.currentMode));
$("#chooseExamBtn").addEventListener("click", async () => {
  await withLoading("응시 기록 불러오는 중", async () => {
    await renderExamSelect();
    showScreen("examSelect");
  });
});
$("#dashboardBtn").addEventListener("click", async () => {
  state.dashboardReturn = state.user?.role === "teacher" ? "teacherResult" : "result";
  if (state.user?.role === "teacher") state.dashboardMode = "personal";
  await withLoading("대시보드 불러오는 중", async () => {
    await renderDashboard();
    showScreen("dashboard");
  });
});
$("#teacherPracticeBtn").addEventListener("click", async () => {
  state.dashboardReturn = "teacherPractice";
  await withLoading("응시 기록 불러오는 중", async () => {
    await renderExamSelect();
    showScreen("examSelect");
  });
});
$("#examSelectDashboardBtn").addEventListener("click", async () => {
  state.dashboardMode = "students";
  await withLoading("대시보드 불러오는 중", async () => {
    await renderDashboard();
    showScreen("dashboard");
  });
});
$("#teacherExamDashboardBtn").addEventListener("click", async () => {
  const hasSelection = state.selections.some(Boolean);
  if (hasSelection && !confirm("현재 풀이를 저장하지 않고 대시보드로 돌아갈까요?")) return;
  state.dashboardMode = "students";
  await withLoading("대시보드 불러오는 중", async () => {
    await renderDashboard();
    showScreen("dashboard");
  });
});
$("#closeStudentDetailBtn").addEventListener("click", hideStudentDetail);
$("#backFromDashboardBtn").addEventListener("click", async () => {
  if (state.user?.role === "teacher" || state.dashboardReturn === "login") {
    logout();
  } else if (state.dashboardReturn === "result" && state.lastResult) {
    showScreen("result");
  } else {
    await withLoading("응시 기록 불러오는 중", async () => {
      await renderExamSelect();
      showScreen("examSelect");
    });
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.user) recordAccess(state.user);
});

setupCalculator();
