console.log("Controller loaded");

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

/* ================= SET / TIEBREAK LOGIC ================= */

function checkSetOrTiebreak(state) {

  const { gamesA, gamesB } = state;

  // 6-6 → start tiebreak immediately
  if (gamesA === 6 && gamesB === 6) {
    state.mode = "tiebreak";
    resetPoints(state);
    return;
  }

  // Normal set win
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

  // GOLDEN active
  if (state.goldenActive && state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  // Deuce logic
  if (state.pointsA >= 3 && state.pointsB >= 3) {

    // Opponent had AD → back to deuce
    if (state["points" + opponent] === 4) {
      state.pointsA = 3;
      state.pointsB = 3;
      state.deuceCount++;

      if (state.deuceCount >= 2) {
        state.goldenActive = true;
      }

      return;
    }

    // Player had AD and wins
    if (state["points" + player] === 4) {
      winGame(state, player);
      return;
    }

    // Deuce → give AD
    if (state.pointsA === 3 && state.pointsB === 3) {
      state["points" + player] = 4;
      return;
    }
  }

  // Normal scoring
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

  updateState(state => {

    if (!state.deuceCount) state.deuceCount = 0;
    if (!state.goldenActive) state.goldenActive = false;
    if (!state.mode) state.mode = "normal";

    if (state.mode === "normal") {
      handleNormalPoint(state, player);
    }
    else if (state.mode === "tiebreak") {
      handleTieBreak(state, player);
    }

  });
}

/* ================= RESET MATCH ================= */

function resetMatch() {

  updateState(state => {

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

  });
}

/* ================= BUTTONS ================= */

document.getElementById("pointA").onclick = () => addPoint("A");
document.getElementById("pointB").onclick = () => addPoint("B");

document.getElementById("switchServe").onclick = () => {
  updateState(state => {
    state.serve = nextServe(state.serve);
  });
};

document.getElementById("toggleVisible").onclick = () => {
  updateState(state => {
    state.visible = !state.visible;
  });
};

document.getElementById("reset").onclick = resetMatch;
