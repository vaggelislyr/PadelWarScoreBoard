console.log("Obs loaded");

const boardEl = document.getElementById("board");

const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const serveAEl = document.getElementById("serveA");
const serveBEl = document.getElementById("serveB");

function tennisPoints(p) {
  const map = ["0", "15", "30", "40", "AD"];
  return map[p] ?? "0";
}

onStateChange(state => {
  if (!state) return;

  /* -------- ON / OFF -------- */
  if (state.visible === false) {
    boardEl.style.display = "none";
    return;
  } else {
    boardEl.style.display = "flex";
  }

  /* -------- POINTS -------- */
  scoreAEl.textContent = tennisPoints(state.pointsA);
  scoreBEl.textContent = tennisPoints(state.pointsB);

  /* -------- SERVE -------- */
  serveAEl.style.visibility = state.serve === "A" ? "visible" : "hidden";
  serveBEl.style.visibility = state.serve === "B" ? "visible" : "hidden";
});
