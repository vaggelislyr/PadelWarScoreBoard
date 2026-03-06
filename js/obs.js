console.log("Obs loaded");

/* ---------- ELEMENTS ---------- */

const overlayWrapper = document.getElementById("overlayWrapper");

const serveAEl = document.getElementById("serveA");
const serveBEl = document.getElementById("serveB");

const nameAEl = document.getElementById("nameA");
const nameBEl = document.getElementById("nameB");

const set1AEl = document.getElementById("set1A");
const set1BEl = document.getElementById("set1B");

const gamesAEl = document.getElementById("gamesA");
const gamesBEl = document.getElementById("gamesB");

const pointsAEl = document.getElementById("pointsA");
const pointsBEl = document.getElementById("pointsB");

const goldenBannerEl = document.getElementById("goldenBanner");
const tiebreakBannerEl = document.getElementById("tiebreakBanner");

const organizerEl = document.getElementById("organizer");
const timerEl = document.getElementById("timer");

/* ---------- HELPERS ---------- */

function tennisPoints(p) {
  const map = ["0", "15", "30", "40", "AD"];
  return map[p] ?? "0";
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

/* ---------- RENDER ---------- */

onStateChange((state) => {
  if (!state) return;

  /* ===== GLOBAL SHOW / HIDE ===== */
  if (state.visible === false) {
    overlayWrapper.style.display = "none";
    return;
  } else {
    overlayWrapper.style.display = "flex";
  }

  /* ===== SERVE ===== */
  serveAEl.style.visibility = state.serve === "A" ? "visible" : "hidden";
  serveBEl.style.visibility = state.serve === "B" ? "visible" : "hidden";

  /* ===== NAMES ===== */
  nameAEl.textContent = safeText(state.nameA, "Player A / Player A");
  nameBEl.textContent = safeText(state.nameB, "Player B / Player B");

  /* ===== FIRST SET COLUMN =====
     Αυτή η πρώτη set στήλη ανοίγει μόνο όταν υπάρχει ολοκληρωμένο set.
     Προς το παρόν δείχνει το συνολικό setsA / setsB όταν γίνει τουλάχιστον 1 set.
  */
  if ((state.setsA ?? 0) > 0 || (state.setsB ?? 0) > 0) {
    set1AEl.classList.remove("hiddenSet");
    set1BEl.classList.remove("hiddenSet");
    set1AEl.textContent = safeText(state.setsA, "0");
    set1BEl.textContent = safeText(state.setsB, "0");
  } else {
    set1AEl.classList.add("hiddenSet");
    set1BEl.classList.add("hiddenSet");
    set1AEl.textContent = "0";
    set1BEl.textContent = "0";
  }

  /* ===== GAMES ===== */
  gamesAEl.textContent = safeText(state.gamesA, "0");
  gamesBEl.textContent = safeText(state.gamesB, "0");

  /* ===== POINTS / TIEBREAK ===== */
  if (state.mode === "tiebreak" || state.mode === "super") {
    pointsAEl.textContent = safeText(state.pointsA, "0");
    pointsBEl.textContent = safeText(state.pointsB, "0");
  } else {
    pointsAEl.textContent = tennisPoints(state.pointsA ?? 0);
    pointsBEl.textContent = tennisPoints(state.pointsB ?? 0);
  }

  /* ===== GOLDEN VISUAL ===== */
  if (state.goldenActive) {
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

  /* ===== TIEBREAK BANNER ===== */
  if (state.mode === "tiebreak" || state.mode === "super") {
    tiebreakBannerEl.classList.add("active");
  } else {
    tiebreakBannerEl.classList.remove("active");
  }

  /* ===== ORGANIZER ===== */
  organizerEl.textContent = safeText(state.organizer, "@sponsor");

  /* ===== TIMER ===== */
  timerEl.textContent = safeText(state.timerText, "00:00");
});
