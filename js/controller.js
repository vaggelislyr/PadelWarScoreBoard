console.log("Controller loaded");

function nextServe(current) {
  return current === "A" ? "B" : "A";
}

function resetPoints(state) {
  state.pointsA = 0;
  state.pointsB = 0;
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

  // Tie break at 6-6
  if (gamesA === 6 && gamesB === 6) {
    state.mode = "tiebreak";
    resetPoints(state);
  }
}

function handleNormalPoint(state, player) {
  const opponent = player === "A" ? "B" : "A";

  if (state.pointsA >= 3 && state.pointsB >= 3) {
    // Deuce logic

    if (state.pointsA === 4 && player === "B") {
      state.pointsA = 3;
      state.pointsB = 3;
      return;
    }

    if (state.pointsB === 4 && player === "A") {
      state.pointsA = 3;
      state.pointsB = 3;
      return;
    }

    if (state.pointsA === 4 && player === "A") {
      winGame(state, "A");
      return;
    }

    if (state.pointsB === 4 && player === "B") {
      winGame(state, "B");
      return;
    }

    if (state.pointsA === 3 && state.pointsB === 3) {
      state["points" + player]++;
      return;
    }
  }

  state["points" + player]++;

  if (state["points" + player] >= 4 && state["points" + player] - state["points" + opponent] >= 2) {
    winGame(state, player);
  }
}

function handleGoldenPoint(state, player) {
  if (state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (state["points" + player] >= 4 && state["points" + player] - state["points" + opponent] >= 2) {
    winGame(state, player);
  }
}

function handleTieBreak(state, player) {
  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (state["points" + player] >= 7 &&
      state["points" + player] - state["points" + opponent] >= 2) {

    if (player === "A") state.setsA++;
    else state.setsB++;

    state.gamesA = 0;
    state.gamesB = 0;
    resetPoints(state);
    state.mode = "normal";
  }
}

function handleSuperTieBreak(state, player) {
  state["points" + player]++;

  const opponent = player === "A" ? "B" : "A";

  if (state["points" + player] >= 10 &&
      state["points" + player] - state["points" + opponent] >= 2) {

    if (player === "A") state.setsA++;
    else state.setsB++;

    state.gamesA = 0;
    state.gamesB = 0;
    resetPoints(state);
    state.mode = "normal";
  }
}

function addPoint(player) {
  updateState(state => {

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

function resetMatch() {
  updateState(state => {
    state.pointsA = 0;
    state.pointsB = 0;
    state.gamesA = 0;
    state.gamesB = 0;
    state.setsA = 0;
    state.setsB = 0;
    state.mode = "normal";
  });
}

document.getElementById("pointA").onclick = () => addPoint("A");
document.getElementById("pointB").onclick = () => addPoint("B");
document.getElementById("reset").onclick = resetMatch;
