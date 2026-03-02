console.log("obs loaded");

const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const serveAEl = document.getElementById("serveA");
const serveBEl = document.getElementById("serveB");
const boardEl = document.getElementById("board");

function render() {
  const state = getState();

  scoreAEl.textContent = state.scoreA;
  scoreBEl.textContent = state.scoreB;

  serveAEl.style.visibility = state.serve === "A" ? "visible" : "hidden";
  serveBEl.style.visibility = state.serve === "B" ? "visible" : "hidden";

  boardEl.style.display = state.visible ? "flex" : "none";
}

window.addEventListener("storage", render);
setInterval(render, 300);
render();
