console.log("state loaded");

const DEFAULT_STATE = {
  scoreA: 0,
  scoreB: 0,
  serve: "A",
  visible: true
};

function getState() {
  const s = localStorage.getItem("padelState");
  return s ? JSON.parse(s) : DEFAULT_STATE;
}

function setState(newState) {
  localStorage.setItem("padelState", JSON.stringify(newState));
}

function updateState(callback) {
  const state = getState();
  callback(state);
  setState(state);
}
