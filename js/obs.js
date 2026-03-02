console.log("obs loaded");

const board = document.getElementById("board");
const scoreA = document.getElementById("scoreA");
const scoreB = document.getElementById("scoreB");
const serveA = document.getElementById("serveA");
const serveB = document.getElementById("serveB");

onStateChange(state => {
  if (!state) return;

  scoreA.textContent = state.scoreA;
  scoreB.textContent = state.scoreB;

  serveA.style.visibility = state.serve === "A" ? "visible" : "hidden";
  serveB.style.visibility = state.serve === "B" ? "visible" : "hidden";

  board.style.display = state.visible ? "flex" : "none";
});
