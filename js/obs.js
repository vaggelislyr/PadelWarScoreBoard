console.log("Obs loaded");

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

  // Εμφάνιση πόντων
  scoreAEl.textContent = tennisPoints(state.pointsA);
  scoreBEl.textContent = tennisPoints(state.pointsB);

  // Εμφάνιση σερβίς
  serveAEl.style.visibility = state.serve === "A" ? "visible" : "hidden";
  serveBEl.style.visibility = state.serve === "B" ? "visible" : "hidden";
});
