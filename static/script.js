// ── Dark Mode ──
const darkToggle = document.getElementById('darkToggle');
const body = document.body;

function applyDark(on) {
  body.classList.toggle('dark', on);
  darkToggle.title = on ? 'Switch to light mode' : 'Switch to dark mode';
}

applyDark(localStorage.getItem('darkMode') === 'true');

darkToggle.addEventListener('click', () => {
  const isDark = body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
  darkToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
});

// ── Character Counter ──
const questionInput = document.getElementById('question');
const charCount = document.getElementById('charCount');
const MAX_CHARS = 3000;

questionInput.addEventListener('input', () => {
  const len = questionInput.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS}`;
  charCount.className = 'char-count';
  if (len > MAX_CHARS * 0.85) charCount.classList.add('warn');
  if (len > MAX_CHARS) charCount.classList.add('over');
});

// ── State ──
let currentData = null;
let selectedAnswers = {};
let submittedAnswers = {};

// ── Generate ──
const generateBtn = document.getElementById('generateBtn');
const spinnerWrap = document.getElementById('spinnerWrap');
const resultsDiv = document.getElementById('results');

generateBtn.addEventListener('click', generate);

questionInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') generate();
});

async function generate() {
  const question = questionInput.value.trim();
  const skillLevel = document.getElementById('skillLevel').value;
  const mode = document.getElementById('mode').value;

  if (!question) {
    questionInput.focus();
    questionInput.style.borderColor = 'var(--error)';
    setTimeout(() => questionInput.style.borderColor = '', 1200);
    return;
  }

  // Reset
  resultsDiv.classList.remove('visible');
  spinnerWrap.classList.add('visible');
  generateBtn.disabled = true;
  selectedAnswers = {};
  submittedAnswers = {};

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, skill_level: skillLevel, mode })
    });

    const data = await res.json();
    currentData = data;

    spinnerWrap.classList.remove('visible');
    generateBtn.disabled = false;

    if (data.error) {
      showError(data.message || 'Something went wrong. Please try again.');
      return;
    }

    if (data.mode === 'fix') {
      renderFixMode(data);
    } else {
      renderLearnMode(data);
    }

    resultsDiv.classList.add('visible');
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    spinnerWrap.classList.remove('visible');
    generateBtn.disabled = false;
    showError('Network error. Please check your connection and try again.');
  }
}

// ── Learn Mode ──
function renderLearnMode(data) {
  resultsDiv.innerHTML = '';

  // Explanation
  if (data.explanation) {
    resultsDiv.appendChild(makeCard({
      icon: '📘',
      title: 'Concept Explanation',
      subtitle: 'Read through carefully before attempting the quiz',
      content: `<div class="explanation-body">${escHtml(data.explanation)}</div>`
    }, 0));
  }

  // Quiz
  if (data.quiz && data.quiz.length > 0) {
    resultsDiv.appendChild(makeQuizCard(data.quiz));
  }

  // Assignment
  if (data.assignment) {
    resultsDiv.appendChild(makeAssignmentCard(data.assignment));
  }

  // Next topics
  if (data.next_topics && data.next_topics.length > 0) {
    resultsDiv.appendChild(makeNextTopicsCard(data.next_topics));
  }
}

// ── Fix Mode ──
function renderFixMode(data) {
  resultsDiv.innerHTML = '';

  // Corrected code
  if (data.corrected_code) {
    const codeHtml = `
      <div class="code-block-wrap">
        <pre class="code-block" id="correctedCodePre">${escHtml(data.corrected_code)}</pre>
        <button class="copy-btn" onclick="copyCode(this, 'correctedCodePre')">Copy</button>
      </div>`;
    resultsDiv.appendChild(makeCard({
      icon: '✅',
      title: 'Corrected Code',
      subtitle: 'Here is the fixed version of your code',
      content: codeHtml
    }, 0));
  }

  // What was wrong + Why it works
  if (data.what_was_wrong || data.why_it_works) {
    let html = '';
    if (data.what_was_wrong) {
      html += `<div class="info-box"><div class="info-box-label">🐛 What Was Wrong</div>${escHtml(data.what_was_wrong)}</div>`;
    }
    if (data.why_it_works) {
      html += `<div class="info-box"><div class="info-box-label">💡 Why It Works Now</div>${escHtml(data.why_it_works)}</div>`;
    }
    resultsDiv.appendChild(makeCard({
      icon: '🔍',
      title: 'Debug Analysis',
      subtitle: 'Understanding the bugs and the fix',
      content: html
    }, 1));
  }

  // Debug challenge
  if (data.debug_challenge) {
    resultsDiv.appendChild(makeDebugChallengeCard(data.debug_challenge));
  }
}

// ── Card Builder ──
function makeCard({ icon, title, subtitle, content }, delay = 0) {
  const div = document.createElement('div');
  div.className = 'card section-enter';
  div.style.animationDelay = `${delay * 0.1}s`;
  div.innerHTML = `
    <div class="card-header">
      <div class="card-icon">${icon}</div>
      <div>
        <div class="card-title">${title}</div>
        ${subtitle ? `<div class="card-subtitle">${subtitle}</div>` : ''}
      </div>
    </div>
    ${content}
  `;
  return div;
}

// ── Quiz Card ──
function makeQuizCard(quiz) {
  const div = document.createElement('div');
  div.className = 'card section-enter';
  div.style.animationDelay = '0.1s';

  let quizHtml = `
    <div class="card-header">
      <div class="card-icon">🧠</div>
      <div>
        <div class="card-title">Knowledge Quiz</div>
        <div class="card-subtitle">Test your understanding — 5 questions</div>
      </div>
      <span class="quiz-badge">5 Questions</span>
    </div>
  `;

  quiz.forEach((q, i) => {
    const opts = ['A', 'B', 'C', 'D'];
    let optHtml = '';
    opts.forEach(key => {
      const text = (q.options && q.options[key]) ? q.options[key] : '';
      optHtml += `
        <button class="option-btn" data-qi="${i}" data-opt="${key}" onclick="selectOption(this, ${i}, '${key}')">
          <span class="opt-label">${key}</span>
          <span>${escHtml(text)}</span>
        </button>`;
    });

    quizHtml += `
      <div class="quiz-item" id="quiz-item-${i}">
        <div class="quiz-q">
          <span class="q-num">${i + 1}</span>
          ${escHtml(q.question)}
        </div>
        <div class="options-grid" id="opts-${i}">${optHtml}</div>
        <div class="quiz-actions">
          <button class="btn btn-sm btn-primary" style="width:auto" onclick="checkAnswer(${i})" id="submit-${i}">Submit Answer</button>
        </div>
        <div class="quiz-feedback" id="feedback-${i}"></div>
      </div>`;
  });

  quizHtml += `
    <div class="section-divider"></div>
    <div style="text-align:center">
      <button class="btn btn-outline" onclick="showScore()">📊 Calculate Score</button>
    </div>
    <div class="score-box" id="scoreBox"></div>`;

  div.innerHTML = quizHtml;
  return div;
}

function selectOption(btn, qi, opt) {
  if (submittedAnswers[qi] !== undefined) return;
  selectedAnswers[qi] = opt;

  document.querySelectorAll(`[data-qi="${qi}"]`).forEach(b => {
    b.classList.remove('selected');
  });
  btn.classList.add('selected');
}

function checkAnswer(qi) {
  if (submittedAnswers[qi] !== undefined) return;
  const selected = selectedAnswers[qi];
  if (!selected) {
    const submitBtn = document.getElementById(`submit-${qi}`);
    submitBtn.textContent = 'Pick an option first!';
    setTimeout(() => submitBtn.textContent = 'Submit Answer', 1500);
    return;
  }

  const q = currentData.quiz[qi];
  const correct = q.correct;
  submittedAnswers[qi] = selected;

  // Disable all options
  document.querySelectorAll(`[data-qi="${qi}"]`).forEach(b => {
    b.disabled = true;
    const opt = b.dataset.opt;
    if (opt === correct) b.classList.add('correct');
    else if (opt === selected && selected !== correct) b.classList.add('incorrect');
    b.classList.remove('selected');
  });

  const feedback = document.getElementById(`feedback-${qi}`);
  const isCorrect = selected === correct;
  feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;

  if (isCorrect) {
    feedback.innerHTML = `<strong>✅ Correct!</strong>${escHtml(q.explanation || '')}`;
  } else {
    feedback.innerHTML = `<strong>❌ Incorrect. The correct answer is ${correct}.</strong>${escHtml(q.explanation || '')}`;
  }

  const submitBtn = document.getElementById(`submit-${qi}`);
  submitBtn.disabled = true;
  submitBtn.textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect';
  submitBtn.style.background = isCorrect ? 'var(--success)' : 'var(--error)';
}

function showScore() {
  if (!currentData || !currentData.quiz) return;
  let correct = 0;
  const total = currentData.quiz.length;

  currentData.quiz.forEach((q, i) => {
    if (submittedAnswers[i] === q.correct) correct++;
  });

  let msg = '';
  if (correct >= 4) msg = '🎉 Excellent Work! You really understand this topic!';
  else if (correct >= 2) msg = '👍 Good Job! Keep practicing to master it.';
  else msg = '📚 Keep Learning! Review the explanation and try again.';

  const scoreBox = document.getElementById('scoreBox');
  scoreBox.innerHTML = `
    <div class="score-num">${correct} / ${total}</div>
    <div class="score-label">Questions Correct</div>
    <div class="score-msg">${msg}</div>`;
  scoreBox.classList.add('visible');
  scoreBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Assignment Card ──
function makeAssignmentCard(a) {
  const html = `
    <div class="assignment-grid">
      ${a.task ? `<div class="info-box"><div class="info-box-label">📝 Task</div>${escHtml(a.task)}</div>` : ''}
      ${a.expected_output ? `<div class="info-box"><div class="info-box-label">🎯 Expected Output</div><code style="font-family:'JetBrains Mono',monospace;font-size:.85em">${escHtml(a.expected_output)}</code></div>` : ''}
      ${a.learning_outcome ? `<div class="info-box"><div class="info-box-label">🌱 Learning Outcome</div>${escHtml(a.learning_outcome)}</div>` : ''}
    </div>`;

  return makeCard({
    icon: '💼',
    title: a.title || 'Practice Assignment',
    subtitle: 'Apply what you\'ve learned',
    content: html
  }, 3);
}

// ── Next Topics Card ──
function makeNextTopicsCard(topics) {
  const pills = topics.map(t =>
    `<span class="topic-pill" onclick="loadTopic('${escHtml(t)}')">→ ${escHtml(t)}</span>`
  ).join('');

  return makeCard({
    icon: '🚀',
    title: 'What to Learn Next',
    subtitle: 'Click a topic to explore it',
    content: `<div class="topics-wrap">${pills}</div>`
  }, 4);
}

function loadTopic(topic) {
  questionInput.value = `Teach me about ${topic}`;
  charCount.textContent = `${questionInput.value.length} / ${MAX_CHARS}`;
  document.getElementById('mode').value = 'learn';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(generate, 300);
}

// ── Debug Challenge Card ──
function makeDebugChallengeCard(dc) {
  const id = 'debugSolution';
  const html = `
    <div class="info-box" style="margin-bottom:12px">
      <div class="info-box-label">💡 Hint</div>
      ${escHtml(dc.hint || 'Think carefully about the logic.')}
    </div>
    <div class="code-block-wrap" style="margin-bottom:12px">
      <pre class="code-block">${escHtml(dc.broken_code || '')}</pre>
    </div>
    <button class="btn btn-outline btn-sm" onclick="toggleDebug('${id}')">🔍 Show Solution</button>
    <div class="debug-collapsed" id="${id}">
      <div class="section-divider"></div>
      <div class="info-box-label" style="color:var(--success);margin-bottom:8px">✅ Solution</div>
      <div class="code-block-wrap" style="margin-bottom:12px">
        <pre class="code-block">${escHtml(dc.solution || '')}</pre>
        <button class="copy-btn" onclick="copyCode(this, this.previousElementSibling.id)">Copy</button>
      </div>
      <div class="info-box">
        <div class="info-box-label">📖 Explanation</div>
        ${escHtml(dc.fix_explanation || '')}
      </div>
    </div>`;

  return makeCard({
    icon: '🧩',
    title: 'Debug Challenge',
    subtitle: 'Find and fix the bug in this code',
    content: html
  }, 2);
}

function toggleDebug(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle('visible');
    const btn = el.previousElementSibling;
    if (btn) btn.textContent = el.classList.contains('visible') ? '🙈 Hide Solution' : '🔍 Show Solution';
  }
}

// ── Copy Code ──
function copyCode(btn, preId) {
  const pre = document.getElementById(preId);
  const code = pre ? pre.textContent : '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✅ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ── Error Display ──
function showError(msg) {
  resultsDiv.innerHTML = `
    <div class="error-box fade-in">
      <span style="font-size:1.2rem;flex-shrink:0">⚠️</span>
      <div>${escHtml(msg)}</div>
    </div>`;
  resultsDiv.classList.add('visible');
}

// ── Helpers ──
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
