const QUESTION_COUNT = 60;
const STORAGE_KEY = "hankibu_cbt_attempts_v1";

const ANSWERS = [
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
];

const state = {
  studentId: "",
  current: 1,
  selections: Array(QUESTION_COUNT).fill(null),
  startedAt: null,
  lastResult: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const screens = {
  login: $("#loginScreen"),
  exam: $("#examScreen"),
  result: $("#resultScreen"),
  dashboard: $("#dashboardScreen"),
};

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function questionImagePath(qno) {
  return `assets/questions/${qno}.png`;
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
  $("#studentBadge").textContent = `학번 ${state.studentId}`;
  $("#questionTitle").textContent = `${qno}번`;
  $("#questionImage").src = questionImagePath(qno);
  $("#questionImage").alt = `${qno}번 문제`;
  $$(".choice-btn").forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.choice) === state.selections[qno - 1]);
  });
  $("#prevBtn").disabled = qno === 1;
  $("#nextBtn").disabled = qno === QUESTION_COUNT;
  updateProgress();
}

function startExam(studentId) {
  state.studentId = studentId;
  state.current = 1;
  state.selections = Array(QUESTION_COUNT).fill(null);
  state.startedAt = new Date().toISOString();
  renderQuestionMap();
  renderQuestion();
  showScreen("exam");
}

function scoreExam() {
  const items = ANSWERS.map((answer, index) => {
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
    studentId: state.studentId,
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
  $("#resultMeta").textContent = `학번 ${result.studentId} · 제출 ${new Date(result.submittedAt).toLocaleString()}`;
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
      <img src="${questionImagePath(item.qno)}" alt="${item.qno}번 문제">
    `;
    wrongList.appendChild(card);
  });
}

function renderDashboard() {
  const attempts = loadAttempts();
  const total = attempts.length;
  const scores = attempts.map((attempt) => attempt.score);
  $("#totalAttempts").textContent = String(total);
  $("#averageScore").textContent = total ? String(Math.round(scores.reduce((a, b) => a + b, 0) / total)) : "0";
  $("#bestScore").textContent = total ? String(Math.max(...scores)) : "0";

  const byStudent = new Map();
  attempts.forEach((attempt) => {
    const list = byStudent.get(attempt.studentId) || [];
    list.push(attempt);
    byStudent.set(attempt.studentId, list);
  });

  const rows = $("#studentRows");
  rows.innerHTML = "";
  [...byStudent.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ko"))
    .forEach(([studentId, list]) => {
      const latest = list[list.length - 1];
      const best = Math.max(...list.map((item) => item.score));
      const avg = Math.round(list.reduce((sum, item) => sum + item.score, 0) / list.length);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${studentId}</td>
        <td>${list.length}</td>
        <td>${latest.score}</td>
        <td>${best}</td>
        <td>${avg}</td>
      `;
      rows.appendChild(tr);
    });

  if (!byStudent.size) {
    rows.innerHTML = '<tr><td colspan="5">아직 기록이 없습니다.</td></tr>';
  }

  renderMissDashboard(attempts);
}

function renderMissDashboard(attempts) {
  const misses = Array.from({ length: QUESTION_COUNT }, (_, index) => ({
    qno: index + 1,
    count: 0,
  }));

  attempts.forEach((attempt) => {
    attempt.items.forEach((item) => {
      if (!item.correct) misses[item.qno - 1].count += 1;
    });
  });

  const maxMiss = Math.max(1, ...misses.map((item) => item.count));
  const topMisses = misses
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.qno - b.qno)
    .slice(0, 12);

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
      <strong>${item.qno}번</strong>
      <div class="miss-bar"><div class="miss-fill" style="width:${(item.count / maxMiss) * 100}%"></div></div>
      <span>${item.count}회</span>
    `;
    box.appendChild(row);
  });
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
  const studentId = $("#studentId").value.trim();
  if (!studentId) return;
  startExam(studentId);
});

$$(".choice-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.selections[state.current - 1] = Number(btn.dataset.choice);
    if (state.current < QUESTION_COUNT) {
      state.current += 1;
    }
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
$("#restartBtn").addEventListener("click", () => startExam(state.studentId));
$("#dashboardBtn").addEventListener("click", () => {
  renderDashboard();
  showScreen("dashboard");
});
$("#backToLoginBtn").addEventListener("click", () => showScreen("login"));

setupCalculator();
