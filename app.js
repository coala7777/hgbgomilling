const QUESTION_COUNT = 60;
const STORAGE_KEY = "hankibu_cbt_attempts_v2";

const EXAMS = {
  "2014_1": {
    title: "2014년 1회차",
    folder: "2014_1",
    answers: [
      1, 4, 1, 4, 2,
      3, 3, 2, 4, 2,
      2, 1, 1, 1, 2,
      4, 2, 1, 3, 4,
      2, 2, 3, 1, 2,
      1, 4, 3, 1, 3,
      1, 3, 4, 3, 4,
      2, 2, 4, 1, 2,
      3, 2, 1, 1, 4,
      2, 1, 1, 3, 3,
      2, 2, 1, 1, 3,
      4, 4, 3, 1, 4,
    ],
  },
  "2014_2": {
    title: "2014년 2회차",
    folder: "2014_2",
    answers: [
      4, 4, 2, 2, 1,
      4, 4, 4, 3, 1,
      4, 4, 2, 3, 4,
      4, 4, 1, 4, 3,
      2, 1, 2, 1, 1,
      2, 1, 1, 4, 4,
      1, 1, 3, 3, 2,
      3, 3, 1, 4, 4,
      1, 2, 1, 3, 2,
      4, 1, 3, 2, 1,
      2, 3, 3, 2, 2,
      4, 4, 4, 1, 1,
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

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentExam() {
  return EXAMS[state.currentExamId];
}

function questionImagePath(qno, examId = state.currentExamId) {
  const exam = EXAMS[examId];
  return `assets/exams/${exam.folder}/${qno}.png`;
}

function loadAttempts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAttempts(attempts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

function renderExamSelect() {
  $("#welcomeText").textContent = `${state.user.name}님, 응시할 문제를 선택하세요`;
  const list = $("#examList");
  list.innerHTML = "";

  Object.entries(EXAMS).forEach(([examId, exam]) => {
    const attempts = loadAttempts().filter((attempt) => attempt.studentId === state.user.id && attempt.examId === examId);
    const latest = attempts[attempts.length - 1];
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
  const answers = currentExam().answers;
  const items = answers.map((answer, index) => {
    const qno = index + 1;
    const selected = state.selections[index];
    return {
      qno,
      answer,
      selected,
      correct: selected === answer,
    };
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

function submitExam() {
  const unanswered = state.selections
    .map((choice, index) => (choice ? null : index + 1))
    .filter(Boolean);
  if (unanswered.length && !confirm(`미응답 ${unanswered.length}문항이 있습니다. 그대로 채점할까요?`)) {
    state.current = unanswered[0];
    renderQuestion();
    return;
  }
  const result = scoreExam();
  const attempts = loadAttempts();
  attempts.push(result);
  saveAttempts(attempts);
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

function renderDashboard() {
  const allAttempts = loadAttempts();
  const attempts = state.user?.role === "teacher"
    ? allAttempts
    : allAttempts.filter((attempt) => attempt.studentId === state.user.id);
  const total = attempts.length;
  const scores = attempts.map((attempt) => attempt.score);
  $("#totalAttempts").textContent = String(total);
  $("#averageScore").textContent = total ? String(Math.round(scores.reduce((a, b) => a + b, 0) / total)) : "0";
  $("#bestScore").textContent = total ? String(Math.max(...scores)) : "0";

  const byStudentExam = new Map();
  attempts.forEach((attempt) => {
    const key = `${attempt.examId}__${attempt.studentId}`;
    const list = byStudentExam.get(key) || [];
    list.push(attempt);
    byStudentExam.set(key, list);
  });

  const rows = $("#studentRows");
  rows.innerHTML = "";
  [...byStudentExam.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ko"))
    .forEach(([_key, list]) => {
      const latest = list[list.length - 1];
      const best = Math.max(...list.map((item) => item.score));
      const avg = Math.round(list.reduce((sum, item) => sum + item.score, 0) / list.length);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${latest.examTitle}</td>
        <td>${latest.studentId}</td>
        <td>${list.length}</td>
        <td>${latest.score}</td>
        <td>${best}</td>
        <td>${avg}</td>
      `;
      rows.appendChild(tr);
    });

  if (!byStudentExam.size) {
    rows.innerHTML = '<tr><td colspan="6">아직 기록이 없습니다.</td></tr>';
  }

  renderMissDashboard(attempts);
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
    .slice(0, 12);

  const maxMiss = Math.max(1, ...topMisses.map((item) => item.count));
  const box = $("#missDashboard");
  box.innerHTML = "";
  if (!topMisses.length) {
    box.innerHTML = "<p>아직 오답 데이터가 없습니다.</p>";
    return;
  }

  topMisses.forEach((item) => {
    const row = document.createElement("div");
    row.className = "miss-row";
    row.innerHTML = `
      <strong>${EXAMS[item.examId].title} ${item.qno}번</strong>
      <div class="miss-bar"><div class="miss-fill" style="width:${(item.count / maxMiss) * 100}%"></div></div>
      <span>${item.count}회</span>
    `;
    box.appendChild(row);
  });
}

function login(id, password) {
  const user = USERS[id];
  if (!user || user.password !== password) {
    $("#loginMessage").textContent = "아이디 또는 비밀번호가 맞지 않습니다.";
    return;
  }
  state.user = { ...user, id };
  $("#loginMessage").textContent = "";
  if (user.role === "teacher") {
    state.dashboardReturn = "login";
    renderDashboard();
    showScreen("dashboard");
    return;
  }
  renderExamSelect();
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

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  login($("#loginId").value.trim(), $("#loginPw").value.trim());
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
$("#chooseExamBtn").addEventListener("click", () => {
  renderExamSelect();
  showScreen("examSelect");
});
$("#dashboardBtn").addEventListener("click", () => {
  state.dashboardReturn = "result";
  renderDashboard();
  showScreen("dashboard");
});
$("#backFromDashboardBtn").addEventListener("click", () => {
  if (state.user?.role === "teacher" || state.dashboardReturn === "login") {
    logout();
  } else if (state.dashboardReturn === "result" && state.lastResult) {
    showScreen("result");
  } else {
    renderExamSelect();
    showScreen("examSelect");
  }
});

setupCalculator();
