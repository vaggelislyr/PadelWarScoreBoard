console.log("Controller loaded");

// Reference στο Realtime Database
const scoreRef = db.ref("score");

// Default state
let state = {
  teamA: 0,
  teamB: 0
};

// Φόρτωση υπάρχοντος state από Firebase
scoreRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (data) {
    state = data;
  } else {
    scoreRef.set(state);
  }
});


// =========================
// BUTTON ACTIONS
// =========================

function addPoint(team) {
  if (team === "A") {
    state.teamA++;
  } else if (team === "B") {
    state.teamB++;
  }

  scoreRef.set(state);
}

function undo() {
  if (state.teamA > 0) state.teamA--;
  if (state.teamB > 0) state.teamB--;

  scoreRef.set(state);
}


// =========================
// CONNECT BUTTONS
// =========================

document.getElementById("btnA").onclick = () => addPoint("A");
document.getElementById("btnB").onclick = () => addPoint("B");
document.getElementById("btnUndo").onclick = undo;
