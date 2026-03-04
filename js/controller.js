console.log("Controller loaded");

/* ------------------ INTERNAL GAME HELPERS ------------------ */

function nextServe(current) {
  return current === "A" ? "B" : "A";
}

function resetPoints(state) {
  state.pointsA = 0;
  state.pointsB = 0;
  state.deuceCount = 0;
  state.goldenActive = false;
}

function winGame(state, player) {
  if (player === "A") state.gamesA++;
  else state.gamesB++;

  resetPoints(state);
  state.serve = nextServe(state.serve);

  checkSetWinner(state);
}

function checkSetWinner(state) {
  const { gamesA, gamesB } = state;

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

  if (gamesA === 6 && gamesB === 6) {
    state.mode = "tiebreak";
    resetPoints(state);
  }
}

/* ------------------ NORMAL MODE ------------------ */

function handleNormalPoint(state, player) {

  const opponent = player === "A" ? "B" : "A";

  // If golden point activated
  if (state.goldenActive && state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  // Deuce situation
  if (state.pointsA >= 3 && state.pointsB >= 3) {

    // If opponent had AD → back to deuce
    if (state["points" + opponent] === 4) {
      state.pointsA = 3;
      state.pointsB = 3;
      state.deuceCount++;

      // Activate golden after 2nd return to deuce
      if (state.deuceCount >= 2) {
        state.goldenActive = true;
      }

      return;
    }

    // If player had AD and wins → game
    if (state["points" + player] === 4) {
      winGame(state, player);
      return;
    }

    // If deuce → give advantage
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

/* ------------------ GOLDEN MODE (manual mode) ------------------ */

function handleGoldenPoint(state, player) {

  if (state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (
    state["points" + player] >= 4 &&
    state["points" + player] - state["points" + opponent] >= 2
  ) {
    winGame(state, player);
  }
}

/* ------------------ TIE BREAK ------------------ */

function handleTieBreak(state, player) {

  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (
    state["points" + player] >= 7 &&
    state["points" + player] - state["points" + opponent] >= 2
  ) {
    if (player === "A") state.setsA++;
    else state.setsB++;

    state.gamesA = 0;
    state.gamesB = 0;
    state.mode = "normal";
    resetPoints(state);
  }
}

/* ------------------ SUPER TIE BREAK ------------------ */

function handleSuperTieBreak(state, player) {

  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (
    state["points" + player] >= 10 &&
    state["points" + player] - state["points" + opponent] >= 2
  ) {
    if (player === "A") state.setsA++;
    else state.setsB++;

    state.gamesA = 0;
    state.gamesB = 0;
    state.mode = "normal";
    resetPoints(state);
  }
}

/* ------------------ MAIN ADD POINT ------------------ */

function addPoint(player) {

  updateState(state => {

    if (!state.deuceCount) state.deuceCount = 0;
    if (!state.goldenActive) state.goldenActive = false;

    if (state.mode === "normal")
      handleNormalPoint(state, player);

    else if (state.mode === "golden")
      handleGoldenPoint(state, player);

    else if (state.mode === "tiebreak")
      handleTieBreak(state, player);

    else if (state.mode === "super")
      handleSuperTieBreak(state, player);
  });
}

/* ------------------ RESET MATCH ------------------ */

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

/* ------------------ BUTTONS ------------------ */

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
