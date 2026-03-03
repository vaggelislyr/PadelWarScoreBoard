console.log("obs loaded");

function tennisDisplay(points) {
  const map = ["0", "15", "30", "40", "AD"];
  return map[points] ?? "0";
}

onStateChange(state => {

  if (!state) return;

  const scoreAEl = document.getElementById("scoreA");
  const scoreBEl = document.getElementById("scoreB");
  const serveAEl = document.getElementById("serveA");
  const serveBEl = document.getElementById("serveB");
  const board = document.getElementById("board");

  // Visibility
  board.style.display = state.visible ? "flex" : "none";

  // Serve ball
  serveAEl.style.opacity = state.serve === "A" ? "1" : "0.2";
  serveBEl.style.opacity = state.serve === "B" ? "1" : "0.2";

  // =========================
  // DISPLAY LOGIC
  // =========================

  if (state.mode === "normal") {

    scoreAEl.textContent = tennisDisplay(state.pointsA);
    scoreBEl.textContent = tennisDisplay(state.pointsB);

  } else {
    // tiebreak or super
    scoreAEl.textContent = state.pointsA;
    scoreBEl.textContent = state.pointsB;
  }

});
