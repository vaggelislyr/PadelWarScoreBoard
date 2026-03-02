console.log("controller loaded");

function pointA() {
  updateState(state => {
    state.scoreA++;
  });
}

function pointB() {
  updateState(state => {
    state.scoreB++;
  });
}

function switchServe() {
  updateState(state => {
    state.serve = state.serve === "A" ? "B" : "A";
  });
}

function resetScore() {
  setState({
    scoreA: 0,
    scoreB: 0,
    serve: "A",
    visible: true
  });
}

function toggleScoreboard() {
  updateState(state => {
    state.visible = !state.visible;
  });
}
