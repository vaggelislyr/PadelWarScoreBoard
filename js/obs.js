console.log("Obs loaded");

const overlayWrapper = document.getElementById("overlayWrapper");

/* =========================
   LAYOUT ROOTS
========================= */

const layoutFuturisticEl = document.getElementById("layout-futuristic");
const layoutModernEl = document.getElementById("layout-modern");

/* =========================
   FUTURISTIC ELEMENTS
========================= */

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

const organizerEl = document.getElementById("organizer");
const timerEl = document.getElementById("timer");

/* =========================
   MODERN ELEMENTS
========================= */

const modernServeBallTopEl = document.getElementById("modernServeBallTop");
const modernServeBallBottomEl = document.getElementById("modernServeBallBottom");

const modernNameAEl = document.getElementById("modernNameA");
const modernNameBEl = document.getElementById("modernNameB");

const modernSet1AEl = document.getElementById("modernSet1A");
const modernSet1BEl = document.getElementById("modernSet1B");

const modernSet2AEl = document.getElementById("modernSet2A");
const modernSet2BEl = document.getElementById("modernSet2B");

const modernGamesAEl = document.getElementById("modernGamesA");
const modernGamesBEl = document.getElementById("modernGamesB");

const modernPointsAEl = document.getElementById("modernPointsA");
const modernPointsBEl = document.getElementById("modernPointsB");

const modernSponsorEl = document.getElementById("modernSponsor");
const modernTimerEl = document.getElementById("modernTimer");

/* =========================
   SHARED BANNERS
========================= */

const goldenBannerEl = document.getElementById("goldenBanner");
const tiebreakBannerEl = document.getElementById("tiebreakBanner");
const winnerBannerEl = document.getElementById("winnerBanner");

let previousPointsA = null;
let previousPointsB = null;
let previousGamesA = null;
let previousGamesB = null;

/* =========================================
   AD DISPLAY TRACKER
   AD -> D1 / D2 only visually
========================================= */

let adDisplayStage = 1;
let lastAdvantageOwner = null;

function updateAdDisplayTracker(state) {
  const pA = state.pointsA ?? 0;
  const pB = state.pointsB ?? 0;

  const isFinished = state.matchOver === true || state.mode === "finished";
  const isTiebreak = state.mode === "tiebreak";
  const isGolden = state.goldenActive === true;

  if (isFinished || isTiebreak || isGolden) {
    adDisplayStage = 1;
    lastAdvantageOwner = null;
    return;
  }

  const isDeuce = pA === 3 && pB === 3;
  const advantageOwner = pA === 4 ? "A" : pB === 4 ? "B" : null;

  if (isDeuce && lastAdvantageOwner) {
    adDisplayStage = 2;
    lastAdvantageOwner = null;
    return;
  }

  if (advantageOwner) {
    lastAdvantageOwner = advantageOwner;
    return;
  }

  if (pA < 3 || pB < 3) {
    adDisplayStage = 1;
    lastAdvantageOwner = null;
  }
}

/* =========================================
   SAFE SHOW / HIDE ANIMATION
========================================= */

const OVERLAY_ANIM_MS = 760;

let overlayIsVisible = true;
let overlayHideTimer = null;

function setupOverlayAnimationBase() {
  overlayWrapper.style.display = "flex";
  overlayWrapper.style.opacity = "1";
  overlayWrapper.style.transform = "translateY(0px) scale(1)";
  overlayWrapper.style.filter = "blur(0px)";
  overlayWrapper.style.pointerEvents = "none";
  overlayWrapper.style.willChange = "opacity, transform, filter";
  overlayWrapper.style.transition = [
    `opacity ${OVERLAY_ANIM_MS}ms cubic-bezier(.18,.84,.24,1)`,
    `transform ${OVERLAY_ANIM_MS}ms cubic-bezier(.18,.84,.24,1)`,
    `filter ${OVERLAY_ANIM_MS}ms cubic-bezier(.18,.84,.24,1)`
  ].join(", ");
}

function restartIntroSequence() {
  overlayWrapper.classList.remove("broadcastIntro");
  void overlayWrapper.offsetWidth;
  overlayWrapper.classList.add("broadcastIntro");

  setTimeout(() => {
    overlayWrapper.classList.remove("broadcastIntro");
  }, 1100);
}

function showOverlaySmooth() {
  clearTimeout(overlayHideTimer);

  if (overlayIsVisible && overlayWrapper.style.display !== "none") {
    overlayWrapper.style.display = "flex";
    overlayWrapper.style.opacity = "1";
    overlayWrapper.style.transform = "translateY(0px) scale(1)";
    overlayWrapper.style.filter = "blur(0px)";
    return;
  }

  overlayWrapper.style.display = "flex";
  overlayWrapper.style.opacity = "0";
  overlayWrapper.style.transform = "translateY(-28px) scale(0.985)";
  overlayWrapper.style.filter = "blur(3px)";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      restartIntroSequence();
      overlayWrapper.style.opacity = "1";
      overlayWrapper.style.transform = "translateY(0px) scale(1)";
      overlayWrapper.style.filter = "blur(0px)";
    });
  });

  overlayIsVisible = true;
}

function hideOverlaySmooth() {
  clearTimeout(overlayHideTimer);

  if (!overlayIsVisible && overlayWrapper.style.display === "none") {
    return;
  }

  overlayWrapper.classList.remove("broadcastIntro");
  overlayWrapper.style.display = "flex";
  overlayWrapper.style.opacity = "0";
  overlayWrapper.style.transform = "translateY(-24px) scale(0.99)";
  overlayWrapper.style.filter = "blur(2px)";

  overlayHideTimer = setTimeout(() => {
    overlayWrapper.style.display = "none";
  }, OVERLAY_ANIM_MS);

  overlayIsVisible = false;
}

setupOverlayAnimationBase();

/* =========================================
   HELPERS
========================================= */

function tennisPoints(p) {
  if (p === 4) {
    return adDisplayStage === 2 ? "D2" : "D1";
  }

  const map = ["0", "15", "30", "40"];
  return map[p] ?? "0";
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function getSetHistory(state) {
  const historyA = Array.isArray(state.setHistoryA) ? state.setHistoryA : [];
  const historyB = Array.isArray(state.setHistoryB) ? state.setHistoryB : [];
  const totalFinishedSets = Math.min(historyA.length, historyB.length);

  return {
    historyA,
    historyB,
    totalFinishedSets
  };
}

function isMatchFinished(state) {
  return state.matchOver === true || state.mode === "finished";
}

function getDisplayedGames(state, team) {
  const { historyA, historyB, totalFinishedSets } = getSetHistory(state);

  if (isMatchFinished(state)) {
    if (totalFinishedSets >= 3) {
      return team === "A" ? historyA[2] : historyB[2];
    }

    return "";
  }

  return team === "A" ? state.gamesA : state.gamesB;
}

function popScore(el) {
  if (!el) return;

  el.classList.remove("scorePop", "visualPulse");
  void el.offsetWidth;
  el.classList.add("scorePop", "visualPulse");

  setTimeout(() => {
    el.classList.remove("scorePop", "visualPulse");
  }, 180);
}

function clearWinnerStyles() {
  if (nameAEl) nameAEl.classList.remove("winnerName", "loserName");
  if (nameBEl) nameBEl.classList.remove("winnerName", "loserName");
  if (modernNameAEl) modernNameAEl.classList.remove("winnerName", "loserName");
  if (modernNameBEl) modernNameBEl.classList.remove("winnerName", "loserName");

  winnerBannerEl.classList.remove("active");
}

function clearGoldenStyles() {
  if (pointsAEl) pointsAEl.classList.remove("goldenText");
  if (pointsBEl) pointsBEl.classList.remove("goldenText");
  if (modernPointsAEl) modernPointsAEl.classList.remove("goldenText");
  if (modernPointsBEl) modernPointsBEl.classList.remove("goldenText");
}

function setLayout(design) {
  const safeDesign = design === "modern" ? "modern" : "futuristic";

  if (layoutFuturisticEl) {
    layoutFuturisticEl.classList.toggle("activeLayout", safeDesign === "futuristic");
  }

  if (layoutModernEl) {
    layoutModernEl.classList.toggle("activeLayout", safeDesign === "modern");
  }
}

/* =========================================
   RENDER FUTURISTIC LAYOUT
========================================= */

function renderFuturisticLayout(state) {
  if (state.serve === "B") {
    serveBallEl.classList.add("toBottom");
  } else {
    serveBallEl.classList.remove("toBottom");
  }

  nameAEl.textContent = safeText(state.nameA, "Player A1 / Player A2");
  nameBEl.textContent = safeText(state.nameB, "Player B1 / Player B2");

  const { historyA, historyB } = getSetHistory(state);

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

  const displayGamesA = getDisplayedGames(state, "A");
  const displayGamesB = getDisplayedGames(state, "B");

  if (previousGamesA !== null && previousGamesA !== displayGamesA) popScore(gamesAEl);
  if (previousGamesB !== null && previousGamesB !== displayGamesB) popScore(gamesBEl);

  gamesAEl.textContent = safeText(displayGamesA, "");
  gamesBEl.textContent = safeText(displayGamesB, "");

  if (state.mode === "tiebreak") {
    if (previousPointsA !== null && previousPointsA !== state.pointsA) popScore(pointsAEl);
    if (previousPointsB !== null && previousPointsB !== state.pointsB) popScore(pointsBEl);

    pointsAEl.textContent = safeText(state.pointsA, "0");
    pointsBEl.textContent = safeText(state.pointsB, "0");
  } else if (isMatchFinished(state)) {
    pointsAEl.textContent = "-";
    pointsBEl.textContent = "-";
  } else {
    if (previousPointsA !== null && previousPointsA !== state.pointsA) popScore(pointsAEl);
    if (previousPointsB !== null && previousPointsB !== state.pointsB) popScore(pointsBEl);

    pointsAEl.textContent = tennisPoints(state.pointsA ?? 0);
    pointsBEl.textContent = tennisPoints(state.pointsB ?? 0);
  }

  organizerEl.textContent = safeText(state.organizer, "@sponsor");
  timerEl.textContent = safeText(state.timerText, "00:00");
}

/* =========================================
   RENDER MODERN LAYOUT
========================================= */

function renderModernLayout(state) {
  if (modernServeBallTopEl && modernServeBallBottomEl) {
    if (state.serve === "B") {
      modernServeBallTopEl.style.opacity = "0";
      modernServeBallTopEl.style.visibility = "hidden";
      modernServeBallBottomEl.style.opacity = "1";
      modernServeBallBottomEl.style.visibility = "visible";
    } else {
      modernServeBallTopEl.style.opacity = "1";
      modernServeBallTopEl.style.visibility = "visible";
      modernServeBallBottomEl.style.opacity = "0";
      modernServeBallBottomEl.style.visibility = "hidden";
    }
  }

  modernNameAEl.textContent = safeText(state.nameA, "Player A1 / Player A2");
  modernNameBEl.textContent = safeText(state.nameB, "Player B1 / Player B2");

  const { historyA, historyB } = getSetHistory(state);

  if (historyA.length >= 1 && historyB.length >= 1) {
    modernSet1AEl.classList.remove("hiddenSet");
    modernSet1BEl.classList.remove("hiddenSet");
    modernSet1AEl.textContent = safeText(historyA[0], "0");
    modernSet1BEl.textContent = safeText(historyB[0], "0");
  } else {
    modernSet1AEl.classList.add("hiddenSet");
    modernSet1BEl.classList.add("hiddenSet");
    modernSet1AEl.textContent = "0";
    modernSet1BEl.textContent = "0";
  }

  if (historyA.length >= 2 && historyB.length >= 2) {
    modernSet2AEl.classList.remove("hiddenSet");
    modernSet2BEl.classList.remove("hiddenSet");
    modernSet2AEl.textContent = safeText(historyA[1], "0");
    modernSet2BEl.textContent = safeText(historyB[1], "0");
  } else {
    modernSet2AEl.classList.add("hiddenSet");
    modernSet2BEl.classList.add("hiddenSet");
    modernSet2AEl.textContent = "0";
    modernSet2BEl.textContent = "0";
  }

  const displayGamesA = getDisplayedGames(state, "A");
  const displayGamesB = getDisplayedGames(state, "B");

  if (previousGamesA !== null && previousGamesA !== displayGamesA) popScore(modernGamesAEl);
  if (previousGamesB !== null && previousGamesB !== displayGamesB) popScore(modernGamesBEl);

  modernGamesAEl.textContent = safeText(displayGamesA, "");
  modernGamesBEl.textContent = safeText(displayGamesB, "");

  if (state.mode === "tiebreak") {
    if (previousPointsA !== null && previousPointsA !== state.pointsA) popScore(modernPointsAEl);
    if (previousPointsB !== null && previousPointsB !== state.pointsB) popScore(modernPointsBEl);

    modernPointsAEl.textContent = safeText(state.pointsA, "0");
    modernPointsBEl.textContent = safeText(state.pointsB, "0");
  } else if (isMatchFinished(state)) {
    modernPointsAEl.textContent = "-";
    modernPointsBEl.textContent = "-";
  } else {
    if (previousPointsA !== null && previousPointsA !== state.pointsA) popScore(modernPointsAEl);
    if (previousPointsB !== null && previousPointsB !== state.pointsB) popScore(modernPointsBEl);

    modernPointsAEl.textContent = tennisPoints(state.pointsA ?? 0);
    modernPointsBEl.textContent = tennisPoints(state.pointsB ?? 0);
  }

  modernSponsorEl.textContent = safeText(state.organizer, "@sponsor");
  modernTimerEl.textContent = safeText(state.timerText, "00:00");
}

/* =========================================
   SHARED STATE VISUALS
========================================= */

function applySharedSpecialStates(state) {
  if (state.goldenActive && state.mode === "normal") {
    goldenBannerEl.classList.add("active");

    if ((state.pointsA ?? 0) === 3 && (state.pointsB ?? 0) === 3) {
      if (pointsAEl) pointsAEl.classList.add("goldenText");
      if (pointsBEl) pointsBEl.classList.add("goldenText");
      if (modernPointsAEl) modernPointsAEl.classList.add("goldenText");
      if (modernPointsBEl) modernPointsBEl.classList.add("goldenText");
    } else {
      clearGoldenStyles();
    }
  } else {
    goldenBannerEl.classList.remove("active");
    clearGoldenStyles();
  }

  if (state.mode === "tiebreak") {
    tiebreakBannerEl.classList.add("active");
  } else {
    tiebreakBannerEl.classList.remove("active");
  }

  clearWinnerStyles();

  if (isMatchFinished(state)) {
    winnerBannerEl.classList.add("active");

    if ((state.setsA ?? 0) > (state.setsB ?? 0)) {
      if (nameAEl) nameAEl.classList.add("winnerName");
      if (nameBEl) nameBEl.classList.add("loserName");
      if (modernNameAEl) modernNameAEl.classList.add("winnerName");
      if (modernNameBEl) modernNameBEl.classList.add("loserName");
    } else if ((state.setsB ?? 0) > (state.setsA ?? 0)) {
      if (nameBEl) nameBEl.classList.add("winnerName");
      if (nameAEl) nameAEl.classList.add("loserName");
      if (modernNameBEl) modernNameBEl.classList.add("winnerName");
      if (modernNameAEl) modernNameAEl.classList.add("loserName");
    }
  }
}

/* =========================================
   STATE SYNC
========================================= */

onStateChange(function (state) {
  if (!state) return;

  const design = state.design === "modern" ? "modern" : "futuristic";
  setLayout(design);

  if (state.visible === false) {
    hideOverlaySmooth();
    return;
  } else {
    showOverlaySmooth();
  }

  updateAdDisplayTracker(state);

  renderFuturisticLayout(state);
  renderModernLayout(state);
  applySharedSpecialStates(state);

  previousPointsA = state.pointsA;
  previousPointsB = state.pointsB;
  previousGamesA = getDisplayedGames(state, "A");
  previousGamesB = getDisplayedGames(state, "B");
});
