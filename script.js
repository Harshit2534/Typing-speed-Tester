// Typing Speed Tester - Frontend Only
// Author: AI
// Features: Random sentences, WPM, accuracy, errors, timer, animated cursor, word feedback, dark mode, Chart.js, retry/new, sound, AI feedback, leaderboard

// --- CONFIGURATION ---
const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "Sphinx of black quartz, judge my vow.",
  "How vexingly quick daft zebras jump!",
  "Bright vixens jump; dozy fowl quack.",
  "Jackdaws love my big sphinx of quartz.",
  "Waltz, nymph, for quick jigs vex Bud.",
  "Glib jocks quiz nymph to vex dwarf.",
  "Quick zephyrs blow, vexing daft Jim.",
  "Two driven jocks help fax my big quiz.",
  "A wizard's job is to vex chumps quickly in fog.",
  "Jinxed wizards pluck ivy from the big quilt.",
  "The five boxing wizards jump quickly.",
  "Heavy boxes perform quick waltzes and jigs.",
  "Back in June we delivered oxygen equipment of the same size.",
  "Just keep examining every low bid quoted for zinc etchings.",
  "The job requires extra pluck and zeal from every young wage earner.",
  "A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.",
  "The public was amazed to view the quickness and dexterity of the juggler.",
  "We promptly judged antique ivory buckles for the next prize.",
  "Crazy Frederick bought many very exquisite opal jewels.",
  "Sixty zippers were quickly picked from the woven jute bag.",
  "The explorer was frozen in his big kayak just after making queer discoveries.",
  "Grumpy wizards make toxic brew for the evil Queen and Jack.",
  "A very big box sailed up then whizzed quickly from Japan.",
  "Quirky spud boys can jam after zapping five worthy Polysixes.",
  "Few black taxis drive up major roads on quiet hazy nights.",
  "The quick onyx goblin jumps over the lazy dwarf.",
  "My faxed joke won a pager in the cable TV quiz show.",
  "Brawny gods just flocked up to quiz and vex him.",
  "Big Fuji waves pitch enzymed kex liquor.",
  "A quick movement of the enemy will jeopardize six gunboats.",
  "All questions asked by five watched experts amaze the judge.",
  "The quick brown fox jumps over the lazy dog's back.",
  "Jovial zanies quickly drove a big, fun-packed taxi home.",
  "The wizard quickly jinxed the gnomes before they vaporized.",
  "Amazingly few discotheques provide jukeboxes.",
  "The quick brown fox jumps over a lazy dog in the park.",
  "Zany Jacques proved a very big help to my wife.",
  "The vixen jumped quickly on her foe barking with zeal.",
  "Jump by vow of quick, lazy strength in Oxford.",
  "A quivering Texas zombie fought republic linked jewelry.",
  "Just poets wax boldly as kings and queens march for the prize.",
  "The big dwarf only jumps quickly for amazing prizes.",
  "Woven silk pyjamas exchanged for blue quartz.",
  "Amazed by the quick, jovial fox, the wizard jumps.",
  "The quick brown fox jumps over the lazy dog, again and again.",
  "Jumpy halfling dwarves pick quartz box for size.",
  "The five boxing wizards jump quickly and vex the judge.",
  "Zigzagging quickly, the jinxed dwarf boxed five wizards.",
  "A quick brown dog jumps over the lazy fox.",
];
const TEST_DURATIONS = [30, 60, 120, 300];
const MAX_LEADERBOARD = 10;
const CHART_HISTORY = 5;

// --- DOM ELEMENTS ---
const textDisplay = document.getElementById("textDisplay");
const textInput = document.getElementById("textInput");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const errorsEl = document.getElementById("errors");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const timeSelect = document.getElementById("timeSelect");
const resultsDiv = document.getElementById("results");
const finalWpm = document.getElementById("finalWpm");
const finalAccuracy = document.getElementById("finalAccuracy");
const finalErrors = document.getElementById("finalErrors");
const charactersTyped = document.getElementById("charactersTyped");
const aiSentenceBtn = document.getElementById("aiSentenceBtn");
const difficultySelect = document.getElementById("difficultySelect");
const toggleStatsBtn = document.getElementById("toggleStatsBtn");
const clearProgressBtn = document.getElementById("clearProgressBtn");
const showFeaturesBtn = document.getElementById("showFeaturesBtn");
const darkModeToggle = document.getElementById("darkModeToggle");

// For extra features
let chart;
let chartData = [];
let leaderboard = [];

// --- STATE ---
let currentSentence = "";
let currentIndex = 0;
let timer = 0;
let interval = null;
let testDuration = 60;
let isTestRunning = false;
let errorCount = 0;
let correctCount = 0;
let totalTyped = 0;
let startTime = null;
let lastInputLength = 0;
let testHistory = [];
let retrySentence = "";
let selectedDifficulty = "any";
let featuresVisible = true;
let statsOnly = false;

// --- SOUND EFFECTS ---
const correctSound = new Audio(
  "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7b2.mp3"
);
const errorSound = new Audio(
  "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7b2.mp3"
); // Use different if desired

// --- ERROR HEATMAP ---
let errorHeatmap = {};
function updateErrorHeatmap(sentence, userInput) {
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] !== sentence[i]) {
      const char = sentence[i] || " "; // space for missing
      errorHeatmap[char] = (errorHeatmap[char] || 0) + 1;
    }
  }
  localStorage.setItem("errorHeatmap", JSON.stringify(errorHeatmap));
}
function loadErrorHeatmap() {
  const data = localStorage.getItem("errorHeatmap");
  errorHeatmap = data ? JSON.parse(data) : {};
}
function renderErrorHeatmap() {
  const heatmapDiv = document.getElementById("errorHeatmap");
  if (!heatmapDiv) return;
  const sorted = Object.entries(errorHeatmap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    heatmapDiv.innerHTML = "<p>No error data yet.</p>";
    return;
  }
  heatmapDiv.innerHTML =
    "<h4>Most Mistyped Characters</h4>" +
    '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
    sorted
      .slice(0, 10)
      .map(
        ([char, count]) =>
          `<span style="background:#fee2e2;color:#b91c1c;padding:4px 8px;border-radius:4px;">${
            char === " " ? "[space]" : char
          }: ${count}</span>`
      )
      .join("") +
    "</div>";
}

// --- SENTENCE DIFFICULTY ---
function getSentenceDifficulty(sentence) {
  const avgWordLen =
    sentence.split(" ").reduce((a, w) => a + w.length, 0) /
    sentence.split(" ").length;
  const rareLetters = (sentence.match(/[qzxjkvb]/gi) || []).length;
  const punctuation = (sentence.match(/[.,;:!?]/g) || []).length;
  let score = avgWordLen + rareLetters * 1.5 + punctuation * 1.2;
  if (score < 7) return "Easy";
  if (score < 10) return "Medium";
  return "Hard";
}

// --- AI FEEDBACK ENHANCED ---
function showAIFeedback(wpm, accuracy, errors) {
  let msg = "";
  // Nuanced feedback
  if (wpm >= 80 && accuracy >= 95) {
    msg =
      "Your typing speed is impressive and your accuracy is excellent! Keep it up!";
  } else if (wpm >= 60 && accuracy >= 90) {
    msg = "Great speed! Try to reduce minor typos for even better results.";
  } else if (wpm >= 40 && accuracy >= 80) {
    msg = "Good job! Focus on accuracy to boost your WPM.";
  } else if (wpm < 40 && accuracy >= 80) {
    msg = "Your accuracy is good, but try to type a bit faster.";
  } else if (accuracy < 80) {
    msg = "Try to slow down and focus on accuracy. Practice makes perfect!";
  } else {
    msg = "Keep practicing to improve both speed and accuracy!";
  }
  // Extra: errors on long words
  const lastSentence = currentSentence;
  const userInput = textInput.value;
  const words = lastSentence.split(" ");
  let longWordErrors = 0;
  words.forEach((word) => {
    if (word.length > 6 && userInput.indexOf(word) === -1) longWordErrors++;
  });
  if (longWordErrors > 0) {
    msg += ` You missed ${longWordErrors} long word${
      longWordErrors > 1 ? "s" : ""
    }. Try to focus on longer words!`;
  }
  // Rhythm feedback
  if (wpm > 0 && wpm / accuracy < 0.5) {
    msg += " Try to maintain a steady rhythm for better results.";
  }
  // Punctuation feedback
  const punctErrors =
    (lastSentence.match(/[.,;:!?]/g) || []).length -
    (userInput.match(/[.,;:!?]/g) || []).length;
  if (punctErrors > 0) {
    msg += ` Pay attention to punctuation; you missed ${punctErrors} mark${
      punctErrors > 1 ? "s" : ""
    }.`;
  }
  const feedbackCard = document.createElement("div");
  feedbackCard.className = "ai-feedback";
  feedbackCard.innerHTML = `<strong>AI Feedback:</strong> <span>${msg}</span>`;
  resultsDiv.appendChild(feedbackCard);
}

// --- AI TYPING COACH & PROGRESS TRACKER ---
function showTypingCoach() {
  const coachDiv = document.getElementById("typingCoach");
  if (!coachDiv) return;
  if (testHistory.length < 3) {
    coachDiv.innerHTML = "";
    return;
  }
  // Analyze last 3 tests
  const last3 = testHistory.slice(-3);
  const avgWpm = last3.reduce((a, t) => a + t.wpm, 0) / 3;
  const avgAcc = last3.reduce((a, t) => a + t.accuracy, 0) / 3;
  let msg = "";
  if (last3[2].wpm > last3[0].wpm) {
    msg += "Your speed is improving! ";
  }
  if (last3[2].accuracy > last3[0].accuracy) {
    msg += "Your accuracy is getting better! ";
  }
  if (avgAcc < 80) {
    msg += "Focus on accuracy for a while, then increase speed.";
  } else if (avgWpm < 40) {
    msg += "Try to type a bit faster, you have the accuracy!";
  } else {
    msg += "Keep up the good work!";
  }
  coachDiv.innerHTML = `<div class='alert alert-info mt-3'>${msg}</div>`;
}

// --- UTILS ---
function getRandomSentence() {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
}
function formatTime(sec) {
  return sec + "s";
}
function calculateWPM(chars, seconds) {
  return Math.round(chars / 5 / (seconds / 60));
}
function calculateAccuracy(correct, total) {
  return total === 0 ? 100 : Math.round((correct / total) * 100);
}
function saveLeaderboard(entry) {
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.wpm - a.wpm);
  if (leaderboard.length > MAX_LEADERBOARD)
    leaderboard.length = MAX_LEADERBOARD;
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}
function loadLeaderboard() {
  const data = localStorage.getItem("leaderboard");
  leaderboard = data ? JSON.parse(data) : [];
}
function saveHistory(entry) {
  testHistory.push(entry);
  if (testHistory.length > CHART_HISTORY) testHistory.shift();
  localStorage.setItem("testHistory", JSON.stringify(testHistory));
}
function loadHistory() {
  const data = localStorage.getItem("testHistory");
  testHistory = data ? JSON.parse(data) : [];
}

// --- DARK MODE ---
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark-mode")
  );
}
function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
}

// --- TYPING LOGIC ---
function renderSentence(sentence, userInput) {
  let html = "";
  for (let i = 0; i < sentence.length; i++) {
    let char = sentence[i];
    let cls = "";
    if (i < userInput.length) {
      if (userInput[i] === char) {
        cls = "correct";
      } else {
        cls = "incorrect";
      }
    } else if (i === userInput.length) {
      cls = "current";
    }
    html += `<span class="${cls}">${char}</span>`;
  }
  textDisplay.innerHTML = html;
}

function startTest(sentence) {
  if (!sentence) sentence = getRandomSentenceByDifficulty();
  currentSentence = sentence;
  retrySentence = currentSentence;
  currentIndex = 0;
  errorCount = 0;
  correctCount = 0;
  totalTyped = 0;
  timer = testDuration;
  isTestRunning = true;
  startTime = Date.now();
  textInput.value = "";
  textInput.disabled = false;
  textInput.focus();
  renderSentence(currentSentence, "");
  updateStats();
  resultsDiv.style.display = "none";
  resetBtn.disabled = false;
  startBtn.disabled = true;
  // Show sentence difficulty
  const diffDiv = document.getElementById("sentenceDifficulty");
  if (diffDiv) {
    diffDiv.innerHTML = `<span class='badge bg-warning text-dark'>Difficulty: ${getSentenceDifficulty(
      currentSentence
    )}</span>`;
  }
  interval = setInterval(() => {
    timer--;
    updateStats();
    if (timer <= 0) {
      endTest();
    }
  }, 1000);
}

function endTest() {
  isTestRunning = false;
  clearInterval(interval);
  textInput.disabled = true;
  startBtn.disabled = false;
  resetBtn.disabled = true;
  const seconds = (Date.now() - startTime) / 1000;
  const wpm = calculateWPM(textInput.value.length, seconds);
  const accuracy = calculateAccuracy(correctCount, totalTyped);
  finalWpm.textContent = wpm;
  finalAccuracy.textContent = accuracy + "%";
  finalErrors.textContent = errorCount;
  charactersTyped.textContent = totalTyped;
  resultsDiv.style.display = "block";
  // Save to history and leaderboard
  const result = {
    wpm,
    accuracy,
    errors: errorCount,
    chars: totalTyped,
    date: new Date().toISOString(),
  };
  saveHistory(result);
  saveLeaderboard(result);
  updateChart();
  updateLeaderboard();
  // Update error heatmap
  updateErrorHeatmap(currentSentence, textInput.value);
  renderErrorHeatmap();
  // Show AI feedback
  showAIFeedback(wpm, accuracy, errorCount);
  // Show typing coach
  showTypingCoach();
}

function updateStats() {
  wpmEl.textContent = calculateWPM(
    textInput.value.length,
    testDuration - timer
  );
  // Show accuracy only after at least one character is typed
  if (totalTyped > 0) {
    accuracyEl.textContent = calculateAccuracy(correctCount, totalTyped) + "%";
  } else {
    accuracyEl.textContent = "—";
  }
  errorsEl.textContent = errorCount;
  timeEl.textContent = formatTime(timer);
}

function handleInput(e) {
  if (!isTestRunning) return;
  const value = textInput.value;
  totalTyped++;
  // Check last char
  const i = value.length - 1;
  if (i >= 0) {
    if (value[i] === currentSentence[i]) {
      correctCount++;
      correctSound.currentTime = 0;
      correctSound.play();
    } else {
      errorCount++;
      errorSound.currentTime = 0;
      errorSound.play();
    }
  }
  renderSentence(currentSentence, value);
  updateStats();
  // End if finished
  if (value === currentSentence) {
    endTest();
  }
}

// --- CHART.JS ---
function updateChart() {
  if (!window.Chart) return;
  const ctx = document.getElementById("performanceChart").getContext("2d");
  const labels = testHistory.map((_, i) => `Test ${i + 1}`);
  const wpmData = testHistory.map((r) => r.wpm);
  const accData = testHistory.map((r) => r.accuracy);
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "WPM",
          data: wpmData,
          borderColor: "#667eea",
          backgroundColor: "rgba(102,126,234,0.1)",
          yAxisID: "y",
        },
        {
          label: "Accuracy %",
          data: accData,
          borderColor: "#2e7d32",
          backgroundColor: "rgba(46,125,50,0.1)",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Last 5 Test Performances" },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "WPM" } },
        y1: {
          beginAtZero: true,
          position: "right",
          title: { display: true, text: "Accuracy %" },
        },
      },
    },
  });
}

// --- LEADERBOARD ---
function updateLeaderboard() {
  const lbDiv = document.getElementById("leaderboard");
  if (!lbDiv) return;
  lbDiv.innerHTML = "<h3>Leaderboard</h3>";
  if (leaderboard.length === 0) {
    lbDiv.innerHTML += "<p>No results yet.</p>";
    return;
  }
  lbDiv.innerHTML +=
    "<ol>" +
    leaderboard
      .map(
        (e) =>
          `<li>WPM: <b>${e.wpm}</b>, Accuracy: <b>${e.accuracy}%</b>, Errors: ${e.errors}</li>`
      )
      .join("") +
    "</ol>";
}

// --- EVENT LISTENERS ---
startBtn.addEventListener("click", () => startTest());
resetBtn.addEventListener("click", () => {
  clearInterval(interval);
  startTest(retrySentence);
});
timeSelect.addEventListener("change", (e) => {
  testDuration = parseInt(e.target.value, 10);
  timeEl.textContent = formatTime(testDuration);
});
textInput.addEventListener("input", handleInput);
aiSentenceBtn.addEventListener("click", async () => {
  aiSentenceBtn.disabled = true;
  aiSentenceBtn.textContent = "Loading...";
  try {
    const response = await fetch("https://api.quotable.io/random");
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    if (data.content && data.content.length > 0) {
      startTest(data.content);
    } else {
      throw new Error("No content");
    }
  } catch (e) {
    alert("Failed to fetch AI sentence. Using a local sentence instead.");
    startTest();
  } finally {
    aiSentenceBtn.disabled = false;
    aiSentenceBtn.textContent = "Get AI Sentence";
  }
});

// Dark mode toggle
const darkToggle = document.createElement("button");
darkToggle.textContent = "🌙";
darkToggle.className = "btn btn-secondary";
darkToggle.style.position = "fixed";
darkToggle.style.top = "1rem";
darkToggle.style.right = "1rem";
darkToggle.onclick = toggleDarkMode;
document.body.appendChild(darkToggle);

// --- DIFFICULTY FILTER ---
function getRandomSentenceByDifficulty() {
  if (selectedDifficulty === "any") return getRandomSentence();
  const filtered = SENTENCES.filter(
    (s) => getSentenceDifficulty(s) === selectedDifficulty
  );
  if (filtered.length === 0) return getRandomSentence();
  return filtered[Math.floor(Math.random() * filtered.length)];
}

difficultySelect.addEventListener("change", (e) => {
  selectedDifficulty = e.target.value;
});

// --- FEATURE BUTTONS ---
toggleStatsBtn.addEventListener("click", () => {
  statsOnly = !statsOnly;
  document.getElementById("results").style.display = statsOnly ? "block" : "";
  document.getElementById("performanceChart").parentElement.style.display =
    statsOnly ? "none" : "";
  document.getElementById("leaderboard").style.display = statsOnly
    ? "none"
    : "";
  toggleStatsBtn.textContent = statsOnly
    ? "Show All Stats"
    : "Show Only My Stats";
});

clearProgressBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all your progress and stats?")) {
    localStorage.clear();
    location.reload();
  }
});

showFeaturesBtn.addEventListener("click", () => {
  featuresVisible = !featuresVisible;
  document.getElementById("errorHeatmap").style.display = featuresVisible
    ? ""
    : "none";
  document.getElementById("typingCoach").style.display = featuresVisible
    ? ""
    : "none";
  showFeaturesBtn.textContent = featuresVisible
    ? "Hide Features"
    : "Show All Features";
});

darkModeToggle.addEventListener("click", toggleDarkMode);

// --- INIT ---
function init() {
  loadLeaderboard();
  loadHistory();
  loadErrorHeatmap();
  loadDarkMode();
  updateLeaderboard();
  updateChart();
  renderErrorHeatmap();
  showTypingCoach();
  timeEl.textContent = formatTime(testDuration);
  // Chart.js canvas
  const chartDiv = document.createElement("div");
  chartDiv.innerHTML = '<canvas id="performanceChart" height="120"></canvas>';
  resultsDiv.appendChild(chartDiv);
  // Leaderboard
  const lbDiv = document.createElement("div");
  lbDiv.id = "leaderboard";
  resultsDiv.appendChild(lbDiv);
  // Error heatmap
  const heatmapDiv = document.createElement("div");
  heatmapDiv.id = "errorHeatmap";
  resultsDiv.appendChild(heatmapDiv);
  // Typing coach
  const coachDiv = document.createElement("div");
  coachDiv.id = "typingCoach";
  resultsDiv.appendChild(coachDiv);
}

init();
