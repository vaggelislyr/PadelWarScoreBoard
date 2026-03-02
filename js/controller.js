console.log("controller loaded");

function pointA() {
  updateState(s => s.scoreA++);
}

function pointB() {
  updateState(s => s.scoreB++);
}

function switchServe() {
  updateState(s => {
    s.serve = s.serve === "A" ? "B" : "A";
  });
}

function toggleScoreboard() {
  updateState(s => {
    s.visible = !s.visible;
  });
}

function resetScore() {
  updateState(s => {
    s.scoreA = 0;
    s.scoreB = 0;
    s.serve = "A";
    s.visible = true;
  });
}
