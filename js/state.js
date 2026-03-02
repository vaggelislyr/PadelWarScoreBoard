// ===============================
// GLOBAL STATE (shared)
// ===============================

const DEFAULT_STATE = {
  teams: {
    A: {
      players: "",
      score: 0,        // 0,15,30,40,AD
      games: 0,
      sets: 0,
      tiebreak: 0
    },
    B: {
      players: "",
      score: 0,
      games: 0,
      sets: 0,
      tiebreak: 0
    }
  },

  serve: "A",           // A or B
  goldenPoint: false,

  timer: {
    enabled: false,
    running: false,
    totalSeconds: 0,
    remainingSeconds: 0
  }
};

// ===============================
// LOAD / SAVE
// ===============================

function loadState() {
  const saved = localStorage.getItem("padelScoreboardState");
  return saved ? JSON.parse(saved) : structuredClone(DEFAULT_STATE);
}

function saveState(state) {
  localStorage.setItem(
    "padelScoreboardState",
    JSON.stringify(state)
  );
}

// ===============================
// SCORE LOGIC (PADEL)
// ===============================

const SCORE_STEPS = [0, 15, 30, 40];

function nextScore(current) {
  const idx = SCORE_STEPS.indexOf(current);
  return idx < SCORE_STEPS.length - 1
    ? SCORE_STEPS[idx + 1]
    : current;
}

function addPoint(teamKey) {
  const state = loadState();
  const team = state.teams[teamKey];
  const oppKey = teamKey === "A" ? "B" : "A";
  const opp = state.teams[oppKey];

  // 40-40 logic
  if (team.score === 40 && opp.score === 40) {
    if (!state.goldenPoint) {
      team.score = "AD";
    } else {
      winGame(teamKey, state);
    }
  }
  // AD logic
  else if (team.score === "AD") {
    winGame(teamKey, state);
  }
  else if (opp.score === "AD") {
    opp.score = 40;
  }
  else {
    team.score = nextScore(team.score);
  }

  saveState(state);
}

function winGame(teamKey, state) {
  const team = state.teams[teamKey];
  const oppKey = teamKey === "A" ? "B" : "A";
  const opp = state.teams[oppKey];

  team.games += 1;

  team.score = 0;
  opp.score = 0;
  state.goldenPoint = false;

  // change serve after game
  state.serve = oppKey;
}

// ===============================
// SERVE
// ===============================

function toggleServe() {
  const state = loadState();
  state.serve = state.serve === "A" ? "B" : "A";
  saveState(state);
}

// ===============================
// TIMER
// ===============================

function setTimer(minutes) {
  const state = loadState();
  const seconds = minutes * 60;

  state.timer.enabled = true;
  state.timer.running = false;
  state.timer.totalSeconds = seconds;
  state.timer.remainingSeconds = seconds;

  saveState(state);
}

function startTimer() {
  const state = loadState();
  state.timer.running = true;
  saveState(state);
}

function stopTimer() {
  const state = loadState();
  state.timer.running = false;
  saveState(state);
}

function resetTimer() {
  const state = loadState();
  state.timer.running = false;
  state.timer.remainingSeconds = state.timer.totalSeconds;
  saveState(state);
}

// ===============================
// RESET
// ===============================

function resetAll() {
  saveState(structuredClone(DEFAULT_STATE));
}
