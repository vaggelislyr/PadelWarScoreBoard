console.log("Obs loaded");

const overlayWrapper = document.getElementById("overlayWrapper");

const serveBallEl = document.getElementById("serveBall");

const nameAEl = document.getElementById("nameA");
const nameBEl = document.getElementById("nameB");

const set1AEl = document.getElementById("set1A");
const set1BEl = document.getElementById("set1B");

const set2AEl = document.getElementById("set2A");
const set2BEl = document.getElementById("set2B");

const gamesAEl = document.getElementById("gamesA");
const gamesBEl = document.getElementById("gamesB");

const pointsAEl = document.getElementById("pointsA");
const pointsBEl = document.getElementById("pointsB");

const goldenBannerEl = document.getElementById("goldenBanner");
const tiebreakBannerEl = document.getElementById("tiebreakBanner");
const winnerBannerEl = document.getElementById("winnerBanner");

const organizerEl = document.getElementById("organizer");
const timerEl = document.getElementById("timer");

let previousPointsA = null;
let previousPointsB = null;
let previousGamesA = null;
let previousGamesB = null;

function tennisPoints(p) {
  const map = ["0", "15", "30", "40", "AD"];
  return map[p] ?? "0";
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function clearWinnerStyles() {
  nameAEl.classList.remove("winnerName", "loserName");
  nameBEl.classList.remove("winnerName", "loserName");
  winnerBannerEl.classList.remove("active");
}

function popScore(el) {
  el.classList.remove("scorePop");
  void el.offsetWidth;
  el.classList.add("scorePop");

  setTimeout(() => {
    el.classList.remove("scorePop");
  }, 180);
}

onStateChange(function (state) {
  if (!state) return;

  if (state.visible === false) {
    overlayWrapper.style.display = "none";
    return;
  } else {
    overlayWrapper.style.display = "flex";
  }

  // Serve ball smooth vertical move
  if (state.serve === "B") {
    serveBallEl.classList.add("toBottom");
  } else {
    serveBallEl.classList.remove("toBottom");
  }

  nameAEl.textContent = safeText(state.nameA, "Player A1 / Player A2");
  nameBEl.textContent = safeText(state.nameB, "Player B1 / Player B2");

  const historyA = Array.isArray(state.setHistoryA) ? state.setHistoryA : [];
  const historyB = Array.isArray(state.setHistoryB) ? state.setHistoryB : [];

  if (historyA.length >= 1 && historyB.length >= 1) {
    set1AEl.classList.remove("hiddenSet");
    set1BEl.classList.remove("hiddenSet");
    set1AEl.textContent = safeText(historyA[0], "0");
    set1BEl.textContent = safeText(historyB[0], "0");
  } else {
    set1AEl.classList.add("hiddenSet");
    set1BEl.classList.add("hiddenSet");
    set1AEl.textContent = "0";
    set1BEl.textContent = "0";
  }

  if (historyA.length >= 2 && historyB.length >= 2) {
    set2AEl.classList.remove("hiddenSet");
    set2BEl.classList.remove("hiddenSet");
    set2AEl.textContent = safeText(historyA[1], "0");
    set2BEl.textContent = safeText(historyB[1], "0");
  } else {
    set2AEl.classList.add("hiddenSet");
    set2BEl.classList.add("hiddenSet");
    set2AEl.textContent = "0";
    set2BEl.textContent = "0";
  }

  if (previousGamesA !== null && previousGamesA !== state.gamesA) {
    popScore(gamesAEl);
  }
  if (previousGamesB !== null && previousGamesB !== state.gamesB) {
    popScore(gamesBEl);
  }

  gamesAEl.textContent = safeText(state.gamesA, "0");
  gamesBEl.textContent = safeText(state.gamesB, "0");

  if (state.mode === "tiebreak") {
    if (previousPointsA !== null && previousPointsA !== state.pointsA) {
      popScore(pointsAEl);
    }
    if (previousPointsB !== null && previousPointsB !== state.pointsB) {
      popScore(pointsBEl);
    }

    pointsAEl.textContent = safeText(state.pointsA, "0");
    pointsBEl.textContent = safeText(state.pointsB, "0");
  } else if (state.mode === "finished") {
    pointsAEl.textContent = "-";
    pointsBEl.textContent = "-";
  } else {
    if (previousPointsA !== null && previousPointsA !== state.pointsA) {
      popScore(pointsAEl);
    }
    if (previousPointsB !== null && previousPointsB !== state.pointsB) {
      popScore(pointsBEl);
    }

    pointsAEl.textContent = tennisPoints(state.pointsA ?? 0);
    pointsBEl.textContent = tennisPoints(state.pointsB ?? 0);
  }

  if (state.goldenActive && state.mode === "normal") {
    goldenBannerEl.classList.add("active");

    if ((state.pointsA ?? 0) === 3 && (state.pointsB ?? 0) === 3) {
      pointsAEl.classList.add("goldenText");
      pointsBEl.classList.add("goldenText");
    } else {
      pointsAEl.classList.remove("goldenText");
      pointsBEl.classList.remove("goldenText");
    }
  } else {
    goldenBannerEl.classList.remove("active");
    pointsAEl.classList.remove("goldenText");
    pointsBEl.classList.remove("goldenText");
  }

  if (state.mode === "tiebreak") {
    tiebreakBannerEl.classList.add("active");
  } else {
    tiebreakBannerEl.classList.remove("active");
  }

  clearWinnerStyles();

  if (state.matchOver === true) {
    winnerBannerEl.classList.add("active");

    if ((state.setsA ?? 0) > (state.setsB ?? 0)) {
      nameAEl.classList.add("winnerName");
      nameBEl.classList.add("loserName");
    } else if ((state.setsB ?? 0) > (state.setsA ?? 0)) {
      nameBEl.classList.add("winnerName");
      nameAEl.classList.add("loserName");
    }
  }

  organizerEl.textContent = safeText(state.organizer, "@sponsor");
  timerEl.textContent = safeText(state.timerText, "00:00");

  previousPointsA = state.pointsA;
  previousPointsB = state.pointsB;
  previousGamesA = state.gamesA;
  previousGamesB = state.gamesB;
});
