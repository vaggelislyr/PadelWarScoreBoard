console.log("State loaded");

const state = {
  scoreA: 0,
  scoreB: 0,
  serve: "A"
};

function saveState() {
  localStorage.setItem("padelState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("padelState");
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }
}

loadState();
