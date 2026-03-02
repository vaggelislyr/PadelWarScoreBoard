console.log("state loaded");

window.state = {
  scoreA: 0,
  scoreB: 0,
  serve: "A",
  scoreboardVisible: true
};

function saveState() {
  localStorage.setItem("padelState", JSON.stringify(window.state));
}

function loadState() {
  const saved = localStorage.getItem("padelState");
  if (saved) {
    window.state = JSON.parse(saved);
  }
}

loadState();
saveState();
