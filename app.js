const QUESTION_COUNT = 60;
const ATTEMPTS_KEY = "hankibu_cbt_attempts_v3";
const ACCESS_KEY = "hankibu_cbt_access_v1";

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
};

const USERS = {
  "0000": { password: "0000", role: "teacher", name: "교사" },
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
  current: 1,
  selections: Array(QUESTION_COUNT).fill(null),
  startedAt: null,
  lastResult: null,
  dashboardReturn: "examSelect",
  dataStatus: "",
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

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
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

function currentExam() {
  return EXAMS[state.currentExamId];
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

async function loadAttempts(options = {}) {
  const { since, limit = 500 } = options;
  if (!supabaseClient) {
    let rows = readStore(ATTEMPTS_KEY).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
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
    state.dataStatus = `응시 기록 조회 실패: ${error.message}`;
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
    state.dataStatus = state.dataStatus || `접속 기록 조회 실패: ${error.message}`;
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

async function renderExamSelect() {
  $("#welcomeText").textContent = `${state.user.name}님, 응시할 문제를 선택하세요`;
  const list = $("#examList");
  list.innerHTML = "";
  const allAttempts = await loadAttempts({ limit: 500 });

  Object.entries(EXAMS).forEach(([examId, exam]) => {
    const attempts = allAttempts.filter((attempt) => attempt.studentId === state.user.id && attempt.examId === examId);
    const latest = attempts[0];
    const card = document.createElement("article");
    card.className = "exam-card";
    card.innerHTML = `
      <h3>${exam.title}</h3>
      <p>${QUESTION_COUNT}문항${latest ? ` · 최근 ${latest.score}점` : " · 미응시"}</p>
      <button class="primary-btn" type="button">시험 시작</button>
    `;
    card.querySelector("button").addEventListener("click", () => startExam(examId));
    list.appendChild(card);
  });
}

function renderQuestionMap() {
  const map = $("#questionMap");
  map.innerHTML = "";
  for (let qno = 1; qno <= QUESTION_COUNT; qno += 1) {
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
  $("#answeredCount").textContent = `${answered} / ${QUESTION_COUNT}`;
  $("#progressBar").style.width = `${(answered / QUESTION_COUNT) * 100}%`;
  $$(".map-btn").forEach((btn, index) => {
    const qno = index + 1;
    btn.classList.toggle("answered", Boolean(state.selections[index]));
    btn.classList.toggle("current", qno === state.current);
  });
}

function renderQuestion() {
  const qno = state.current;
  const exam = currentExam();
  $("#studentBadge").textContent = `${state.user.id} · ${exam.title}`;
  $("#questionTitle").textContent = `${qno}번`;
  $("#questionImage").src = questionImagePath(qno);
  $("#questionImage").alt = `${exam.title} ${qno}번 문제`;
  $$(".choice-btn").forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.choice) === state.selections[qno - 1]);
  });
  $("#prevBtn").disabled = qno === 1;
  $("#nextBtn").disabled = qno === QUESTION_COUNT;
  updateProgress();
}

function startExam(examId) {
  state.currentExamId = examId;
  state.current = 1;
  state.selections = Array(QUESTION_COUNT).fill(null);
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
    studentId: state.user.id,
    startedAt: state.startedAt,
    submittedAt: new Date().toISOString(),
    correctCount,
    score: Math.round((correctCount / QUESTION_COUNT) * 100),
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
  await saveAttempt(result);
  state.lastResult = result;
  renderResult(result);
  showScreen("result");
}

function renderResult(result) {
  $("#scoreText").textContent = `${result.score}점 / ${result.correctCount}개 정답`;
  $("#resultMeta").textContent = `${result.examTitle} · 학번 ${result.studentId} · 제출 ${new Date(result.submittedAt).toLocaleString()}`;
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
        <span>정답 ${item.answer}번</span>
      </div>
      <img src="${questionImagePath(item.qno, result.examId)}" alt="${result.examTitle} ${item.qno}번 문제">
    `;
    wrongList.appendChild(card);
  });
}

async function renderDashboard() {
  state.dataStatus = "";
  const todayStart = startOfTodayIso();
  const todayAllAttempts = await loadAttempts({ since: todayStart, limit: 300 });
  const recentAllAttempts = await loadAttempts({ limit: 500 });
  const todayAttempts = state.user?.role === "teacher"
    ? todayAllAttempts
    : todayAllAttempts.filter((attempt) => attempt.studentId === state.user.id);
  const recentAttempts = state.user?.role === "teacher"
    ? recentAllAttempts
    : recentAllAttempts.filter((attempt) => attempt.studentId === state.user.id);
  const dashboardAttempts = state.user?.role === "teacher" ? todayAttempts : recentAttempts;
  const scores = dashboardAttempts.map((attempt) => attempt.score);

  const todayAccessLog = await loadAccessLog({ since: todayStart, limit: 1000 });
  const recentAccessLog = await loadAccessLog({ limit: 5000 });
  const todayVisitorCount = new Set(todayAccessLog.filter((log) => log.role === "student").map((log) => log.userId)).size;
  const totalVisitorCount = new Set(recentAccessLog.filter((log) => log.role === "student").map((log) => log.userId)).size;

  $("#totalAttempts").textContent = String(dashboardAttempts.length);
  $("#averageScore").textContent = scores.length ? String(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)) : "0";
  $("#bestScore").textContent = scores.length ? String(Math.max(...scores)) : "0";
  $("#todayVisitors").textContent = String(todayVisitorCount);
  $("#totalVisitors").textContent = String(totalVisitorCount);
  const statusBox = $("#dashboardStatus");
  if (statusBox) {
    statusBox.textContent = state.dataStatus || (supabaseClient ? "Supabase 연결됨" : "로컬 저장 모드");
  }

  if (state.user?.role === "teacher") {
    renderTodayScoreRows(todayAttempts);
    renderMissDashboard(recentAttempts);
  } else {
    renderStudentSummaryRows(recentAttempts);
    renderMissDashboard(recentAttempts);
  }
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
        <td>${attempt.studentId}</td>
        <td>${attempt.score}</td>
        <td>${attempt.correctCount}/${QUESTION_COUNT}</td>
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
      <td>${latest.studentId}</td>
      <td>${latest.score}</td>
      <td>${latest.correctCount}/${QUESTION_COUNT}</td>
      <td>${new Date(latest.submittedAt).toLocaleString()}</td>
    `;
    rows.appendChild(tr);
  });
  if (!byStudentExam.size) rows.innerHTML = '<tr><td colspan="5">아직 기록이 없습니다.</td></tr>';
}

function renderMissDashboard(attempts) {
  const misses = new Map();
  Object.keys(EXAMS).forEach((examId) => {
    for (let qno = 1; qno <= QUESTION_COUNT; qno += 1) {
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
    const answer = exam.answers[item.qno - 1];
    const card = document.createElement("article");
    card.className = "miss-card";
    card.innerHTML = `
      <div class="miss-card-head">
        <strong>${index + 1}. ${exam.title} ${item.qno}번</strong>
        <span>${item.count}회 오답 · 정답 ${answer}번</span>
      </div>
      <img src="${questionImagePath(item.qno, item.examId)}" alt="${exam.title} ${item.qno}번 문제">
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
  $("#loginMessage").textContent = "";
  await recordAccess(state.user);
  if (user.role === "teacher") {
    state.dashboardReturn = "login";
    await renderDashboard();
    showScreen("dashboard");
    return;
  }
  await renderExamSelect();
  showScreen("examSelect");
}

function logout() {
  state.user = null;
  state.currentExamId = null;
  state.lastResult = null;
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
    state.selections[state.current - 1] = Number(btn.dataset.choice);
    if (state.current < QUESTION_COUNT) state.current += 1;
    renderQuestion();
  });
});

$("#prevBtn").addEventListener("click", () => {
  state.current = Math.max(1, state.current - 1);
  renderQuestion();
});

$("#nextBtn").addEventListener("click", () => {
  state.current = Math.min(QUESTION_COUNT, state.current + 1);
  renderQuestion();
});

$("#submitBtn").addEventListener("click", submitExam);
$("#retryBtn").addEventListener("click", () => startExam(state.currentExamId));
$("#chooseExamBtn").addEventListener("click", async () => {
  await renderExamSelect();
  showScreen("examSelect");
});
$("#dashboardBtn").addEventListener("click", async () => {
  state.dashboardReturn = "result";
  await renderDashboard();
  showScreen("dashboard");
});
$("#backFromDashboardBtn").addEventListener("click", async () => {
  if (state.user?.role === "teacher" || state.dashboardReturn === "login") {
    logout();
  } else if (state.dashboardReturn === "result" && state.lastResult) {
    showScreen("result");
  } else {
    await renderExamSelect();
    showScreen("examSelect");
  }
});

setupCalculator();
