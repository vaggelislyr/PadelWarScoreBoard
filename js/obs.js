console.log("Obs loaded");

/* ---------- ELEMENTS ---------- */

const overlayWrapper = document.getElementById("overlayWrapper");

const serveAEl = document.getElementById("serveA");
const serveBEl = document.getElementById("serveB");

const nameAEl = document.getElementById("nameA");
const nameBEl = document.getElementById("nameB");

const tbAEl = document.getElementById("tbA");
const tbBEl = document.getElementById("tbB");

const setsAEl = document.getElementById("setsA");
const setsBEl = document.getElementById("setsB");

const gamesAEl = document.getElementById("gamesA");
const gamesBEl = document.getElementById("gamesB");

const pointsAEl = document.getElementById("pointsA");
const pointsBEl = document.getElementById("pointsB");

const goldenBanner = document.getElementById("goldenBanner");

const organizerEl = document.getElementById("organizer");
const timerEl = document.getElementById("timer");


/* ---------- TENNIS POINT FORMAT ---------- */

function tennisPoints(p) {
  const map = ["0", "15", "30", "40", "AD"];
  return map[p] ?? "0";
}


/* ---------- STATE SYNC ---------- */

onStateChange(state => {

  if (!state) return;

  /* ===== GLOBAL ON/OFF ===== */
  if (state.visible === false) {
    overlayWrapper.style.display = "none";
    return;
  } else {
    overlayWrapper.style.display = "flex";
  }

  /* ===== SERVE ===== */
  serveAEl.style.visibility = state.serve === "A" ? "visible" : "hidden";
  serveBEl.style.visibility = state.serve === "B" ? "visible" : "hidden";

  /* ===== PLAYER NAMES ===== */
  if (state.nameA) nameAEl.textContent = state.nameA;
  if (state.nameB) nameBEl.textContent = state.nameB;

  /* ===== SETS ===== */
  setsAEl.textContent = state.setsA ?? 0;
  setsBEl.textContent = state.setsB ?? 0;

  /* ===== GAMES ===== */
  gamesAEl.textContent = state.gamesA ?? 0;
  gamesBEl.textContent = state.gamesB ?? 0;

  /* ===== POINT / TIEBREAK DISPLAY ===== */

  if (state.mode === "tiebreak") {

    // Hide normal tennis points
    pointsAEl.textContent = "-";
    pointsBEl.textContent = "-";

    // Show numeric TB points
    tbAEl.textContent = state.pointsA ?? 0;
    tbBEl.textContent = state.pointsB ?? 0;

  } else {

    // Normal tennis mode
    pointsAEl.textContent = tennisPoints(state.pointsA ?? 0);
    pointsBEl.textContent = tennisPoints(state.pointsB ?? 0);

    tbAEl.textContent = "0";
    tbBEl.textContent = "0";
  }

  /* ===== GOLDEN VISUAL ===== */

  if (state.goldenActive && state.mode !== "tiebreak") {

    goldenBanner.classList.add("active");

    if (state.pointsA === 3 && state.pointsB === 3) {
      pointsAEl.classList.add("golden");
      pointsBEl.classList.add("golden");
    }

  } else {

    goldenBanner.classList.remove("active");
    pointsAEl.classList.remove("golden");
    pointsBEl.classList.remove("golden");
  }

  /* ===== ORGANIZER TEXT ===== */

  if (state.organizer) {
    organizerEl.textContent = state.organizer;
  }

  /* ===== TIMER TEXT (placeholder) ===== */

  if (state.timerText) {
    timerEl.textContent = state.timerText;
  }

});
