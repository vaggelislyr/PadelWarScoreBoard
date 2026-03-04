console.log("Controller loaded");

/* ================= HISTORY ================= */

let historyStack = [];

function saveToHistory(currentState) {
  const snapshot = JSON.parse(JSON.stringify(currentState));
  historyStack.push(snapshot);

  if (historyStack.length > 100) {
    historyStack.shift(); // limit history size
  }
}

function undoLast() {
  if (historyStack.length === 0) return;

  const previous = historyStack.pop();

  database.ref("matchState").set(previous);
}

/* ================= HELPERS ================= */

function nextServe(current) {
  return current === "A" ? "B" : "A";
}

function resetPoints(state) {
  state.pointsA = 0;
  state.pointsB = 0;
  state.deuceCount = 0;
  state.goldenActive = false;
}

/* ================= GAME WIN ================= */

function winGame(state, player) {

  if (player === "A") state.gamesA++;
  else state.gamesB++;

  resetPoints(state);
  state.serve = nextServe(state.serve);

  checkSetOrTiebreak(state);
}

/* ================= SET / TIEBREAK ================= */

function checkSetOrTiebreak(state) {

  const { gamesA, gamesB } = state;

  if (gamesA === 6 && gamesB === 6) {
    state.mode = "tiebreak";
    resetPoints(state);
    return;
  }

  if (gamesA >= 6 && gamesA - gamesB >= 2) {
    state.setsA++;
    state.gamesA = 0;
    state.gamesB = 0;
  }

  if (gamesB >= 6 && gamesB - gamesA >= 2) {
    state.setsB++;
    state.gamesA = 0;
    state.gamesB = 0;
  }
}

/* ================= NORMAL POINT ================= */

function handleNormalPoint(state, player) {

  const opponent = player === "A" ? "B" : "A";

  if (state.goldenActive && state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  if (state.pointsA >= 3 && state.pointsB >= 3) {

    if (state["points" + opponent] === 4) {
      state.pointsA = 3;
      state.pointsB = 3;
      state.deuceCount++;

      if (state.deuceCount >= 2) {
        state.goldenActive = true;
      }

      return;
    }

    if (state["points" + player] === 4) {
      winGame(state, player);
      return;
    }

    if (state.pointsA === 3 && state.pointsB === 3) {
      state["points" + player] = 4;
      return;
    }
  }

  state["points" + player]++;

  if (
    state["points" + player] >= 4 &&
    state["points" + player] - state["points" + opponent] >= 2
  ) {
    winGame(state, player);
  }
}

/* ================= TIEBREAK ================= */

function handleTieBreak(state, player) {

  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (
    (state.pointsA >= 7 || state.pointsB >= 7) &&
    Math.abs(state.pointsA - state.pointsB) >= 2
  ) {

    if (state.pointsA > state.pointsB) state.setsA++;
    else state.setsB++;

    state.gamesA = 0;
    state.gamesB = 0;
    state.mode = "normal";
    resetPoints(state);
  }
}

/* ================= MAIN ADD POINT ================= */

function addPoint(player) {

  database.ref("matchState").once("value").then(snapshot => {

    let state = snapshot.val();

    if (!state) return;

    saveToHistory(state);

    if (!state.deuceCount) state.deuceCount = 0;
    if (!state.goldenActive) state.goldenActive = false;
    if (!state.mode) state.mode = "normal";

    if (state.mode === "normal") {
      handleNormalPoint(state, player);
    }
    else if (state.mode === "tiebreak") {
      handleTieBreak(state, player);
    }

    database.ref("matchState").set(state);
  });
}

/* ================= RESET ================= */

function resetMatch() {

  database.ref("matchState").once("value").then(snapshot => {

    let state = snapshot.val();
    if (!state) return;

    saveToHistory(state);

    state.pointsA = 0;
    state.pointsB = 0;
    state.gamesA = 0;
    state.gamesB = 0;
    state.setsA = 0;
    state.setsB = 0;

    state.mode = "normal";
    state.serve = "A";
    state.visible = true;

    state.deuceCount = 0;
    state.goldenActive = false;

    database.ref("matchState").set(state);
  });
}

/* ================= BUTTONS ================= */

document.getElementById("pointA").onclick = () => addPoint("A");
document.getElementById("pointB").onclick = () => addPoint("B");

document.getElementById("switchServe").onclick = () => {
  database.ref("matchState").once("value").then(snapshot => {
    let state = snapshot.val();
    saveToHistory(state);
    state.serve = nextServe(state.serve);
    database.ref("matchState").set(state);
  });
};

document.getElementById("toggleVisible").onclick = () => {
  database.ref("matchState").once("value").then(snapshot => {
    let state = snapshot.val();
    saveToHistory(state);
    state.visible = !state.visible;
    database.ref("matchState").set(state);
  });
};

document.getElementById("reset").onclick = resetMatch;

document.getElementById("undo").onclick = undoLast;
