console.log("controller loaded");

function pointA() {
  window.state.scoreA++;
  saveState();
}

function pointB() {
  window.state.scoreB++;
  saveState();
}

function switchServe() {
  window.state.serve = window.state.serve === "A" ? "B" : "A";
  saveState();
}

function resetScore() {
  window.state.scoreA = 0;
  window.state.scoreB = 0;
  saveState();
}
