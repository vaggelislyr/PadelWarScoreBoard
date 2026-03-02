console.log("Controller loaded");

function pointA() {
  state.scoreA++;
  saveState();
}

function pointB() {
  state.scoreB++;
  saveState();
}

function switchServe() {
  state.serve = state.serve === "A" ? "B" : "A";
  saveState();
}

function resetScore() {
  state.scoreA = 0;
  state.scoreB = 0;
  state.serve = "A";
  saveState();
}
