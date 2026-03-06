console.log("Controller loaded");

// Firebase ref
const scoreRef = db.ref("score");

// Current state
let state = {
  teamA: 0,
  teamB: 0
};

// Undo history
let historyStack = [];

// Deep copy helper
function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Load / sync current state from Firebase
scoreRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (data) {
    state = data;
  } else {
    scoreRef.set(state);
  }
});

// Save current state before any change
function pushHistory() {
  historyStack.push(cloneState(state));

  // Κρατάμε μέχρι 100 βήματα για ασφάλεια
  if (historyStack.length > 100) {
    historyStack.shift();
  }
}

// Add point
function addPoint(team) {
  pushHistory();

  if (team === "A") {
    state.teamA++;
  } else if (team === "B") {
    state.teamB++;
  }

  scoreRef.set(state);
}

// True undo: restore previous snapshot
function undo() {
  if (historyStack.length === 0) return;

  state = historyStack.pop();
  scoreRef.set(state);
}

// Button bindings
document.getElementById("btnA").onclick = () => addPoint("A");
document.getElementById("btnB").onclick = () => addPoint("B");
document.getElementById("btnUndo").onclick = undo;
