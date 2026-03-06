console.log("Controller loaded");

/* ================= HISTORY ================= */

let historyStack = [];

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pushHistory(currentState) {
  historyStack.push(clone(currentState));

  if (historyStack.length > 100) {
    historyStack.shift();
  }
}

function undoLastAction() {
  if (historyStack.length === 0) return;

  const previous = historyStack.pop();
  writeState(previous);
}

/* ================= TIMER ================= */

let timerInterval = null;
let timerSeconds = 0;

function parseTimerText(text) {
  if (!text || typeof text !== "string") return 0;
  const parts = text.split(":");
  if (parts.length !== 2) return 0;
  const mm = parseInt(parts[0], 10) || 0;
  const ss = parseInt(parts[1], 10) || 0;
  return (mm * 60) + ss;
}

function formatTimerText(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function syncLocalTimerFromState() {
  readState(state => {
    timerSeconds = parseTimerText(state.timerText);
  });
}

function updateTimerDisplay() {
  updateState(state => {
    state.timerText = formatTimerText(timerSeconds);
  });
}

function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  timerSeconds = 0;
  updateTimerDisplay();
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

function recordFinishedSet(state, scoreA, scoreB) {
  state.setHistoryA.push(scoreA);
  state.setHistoryB.push(scoreB);
}

function finishMatch(state) {
  state.matchOver = true;
  state.mode = "finished";
  resetPoints(state);
}

function afterSetWin(state) {
  if (state.setsA === 2 || state.setsB === 2) {
    finishMatch(state);
    return;
  }

  // 1-1 sets => super tiebreak to 10
  if (state.setsA === 1 && state.setsB === 1) {
    state.gamesA = 0;
    state.gamesB = 0;
    state.mode = "super";
    resetPoints(state);
    return;
  }

  // next normal set
  state.gamesA = 0;
  state.gamesB = 0;
  state.mode = "normal";
  resetPoints(state);
}

function winSetNormal(state, player) {
  recordFinishedSet(state, state.gamesA, state.gamesB);

  if (player === "A") state.setsA++;
  else state.setsB++;

  afterSetWin(state);
}

function winSetByTiebreak(state, player) {
  const finalGamesA = player === "A" ? 7 : 6;
  const finalGamesB = player === "B" ? 7 : 6;

  recordFinishedSet(state, finalGamesA, finalGamesB);

  if (player === "A") state.setsA++;
  else state.setsB++;

  afterSetWin(state);
}

function checkSetOrTiebreak(state, playerWhoWonGame) {
  const { gamesA, gamesB } = state;

  if (gamesA === 6 && gamesB === 6) {
    state.mode = "tiebreak";
    resetPoints(state);
    return;
  }

  if (gamesA >= 6 && gamesA - gamesB >= 2) {
    winSetNormal(state, "A");
    return;
  }

  if (gamesB >= 6 && gamesB - gamesA >= 2) {
    winSetNormal(state, "B");
    return;
  }
}

function winGame(state, player) {
  if (player === "A") state.gamesA++;
  else state.gamesB++;

  resetPoints(state);
  state.serve = nextServe(state.serve);

  checkSetOrTiebreak(state, player);
}

/* ================= PADel LOGIC ================= */

function handleNormalPoint(state, player) {
  const opponent = player === "A" ? "B" : "A";

  // If match is already over, do nothing
  if (state.matchOver) return;

  // If golden is active at 40-40, next point wins game
  if (state.goldenActive && state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  // Deuce / AD area
  if (state.pointsA >= 3 && state.pointsB >= 3) {

    // Opponent had AD and current player scores => back to 40-40
    if (state["points" + opponent] === 4) {
      state.pointsA = 3;
      state.pointsB = 3;
      state.deuceCount++;

      // After second cancelled advantage, activate golden
      if (state.deuceCount >= 2) {
        state.goldenActive = true;
      }
      return;
    }

    // Player had AD and scores again => wins game
    if (state["points" + player] === 4) {
      winGame(state, player);
      return;
    }

    // Exactly 40-40 => give AD
    if (state.pointsA === 3 && state.pointsB === 3) {
      state["points" + player] = 4;
      return;
    }
  }

  // Normal scoring below deuce
  state["points" + player]++;

  if (
    state["points" + player] >= 4 &&
    state["points" + player] - state["points" + opponent] >= 2
  ) {
    winGame(state, player);
  }
}

function handleTieBreak(state, player) {
  state["points" + player]++;

  const diff = Math.abs(state.pointsA - state.pointsB);

  if ((state.pointsA >= 7 || state.pointsB >= 7) && diff >= 2) {
    if (state.pointsA > state.pointsB) {
      winSetByTiebreak(state, "A");
    } else {
      winSetByTiebreak(state, "B");
    }
  }
}

function handleSuperTieBreak(state, player) {
  state["points" + player]++;

  const diff = Math.abs(state.pointsA - state.pointsB);

  if ((state.pointsA >= 10 || state.pointsB >= 10) && diff >= 2) {
    if (state.pointsA > state.pointsB) {
      state.setsA++;
    } else {
      state.setsB++;
    }

    state.matchOver = true;
    state.mode = "finished";
  }
}

function addPoint(player) {
  readState(state => {
    pushHistory(state);

    if (!state.mode) state.mode = "normal";
    if (state.deuceCount === undefined) state.deuceCount = 0;
    if (state.goldenActive === undefined) state.goldenActive = false;
    if (state.matchOver === undefined) state.matchOver = false;

    if (state.matchOver) {
      writeState(state);
      return;
    }

    if (state.mode === "normal") {
      handleNormalPoint(state, player);
    } else if (state.mode === "tiebreak") {
      handleTieBreak(state, player);
    } else if (state.mode === "super") {
      handleSuperTieBreak(state, player);
    }

    writeState(state);
  });
}

/* ================= UI ACTIONS ================= */

document.getElementById("updateNames").onclick = () => {
  readState(state => {
    pushHistory(state);

    state.nameA = document.getElementById("nameA").value || "";
    state.nameB = document.getElementById("nameB").value || "";

    writeState(state);
  });
};

document.getElementById("updateOrganizer").onclick = () => {
  readState(state => {
    pushHistory(state);

    state.organizer = document.getElementById("organizerInput").value || "";

    writeState(state);
  });
};

document.getElementById("toggleSponsorLock").onclick = () => {
  readState(state => {
    pushHistory(state);

    state.sponsorLocked = !state.sponsorLocked;

    writeState(state);
  });
};

document.getElementById("pointA").onclick = () => addPoint("A");
document.getElementById("pointB").onclick = () => addPoint("B");

document.getElementById("switchServe").onclick = () => {
  readState(state => {
    pushHistory(state);

    state.serve = nextServe(state.serve);

    writeState(state);
  });
};

document.getElementById("toggleVisible").onclick = () => {
  readState(state => {
    pushHistory(state);

    state.visible = !state.visible;

    writeState(state);
  });
};

document.getElementById("undo").onclick = () => {
  undoLastAction();
};

document.getElementById("reset").onclick = () => {
  readState(state => {
    pushHistory(state);

    const keepOrganizer = state.sponsorLocked ? state.organizer : "";
    const keepLock = state.sponsorLocked;

    state.nameA = "";
    state.nameB = "";

    state.pointsA = 0;
    state.pointsB = 0;

    state.gamesA = 0;
    state.gamesB = 0;

    state.setsA = 0;
    state.setsB = 0;

    state.setHistoryA = [];
    state.setHistoryB = [];

    state.mode = "normal";
    state.serve = "A";
    state.visible = true;

    state.goldenActive = false;
    state.deuceCount = 0;
    state.matchOver = false;

    state.organizer = keepOrganizer;
    state.sponsorLocked = keepLock;

    state.timerText = "00:00";
    timerSeconds = 0;
    stopTimer();

    writeState(state);
  });
};

document.getElementById("timerStart").onclick = () => {
  startTimer();
};

document.getElementById("timerStop").onclick = () => {
  stopTimer();
};

document.getElementById("timerReset").onclick = () => {
  resetTimer();
};

/* ================= INIT UI FROM STATE ================= */

onStateChange(state => {
  document.getElementById("nameA").value = state.nameA || "";
  document.getElementById("nameB").value = state.nameB || "";
  document.getElementById("organizerInput").value = state.organizer || "";

  timerSeconds = parseTimerText(state.timerText || "00:00");

  const sponsorBtn = document.getElementById("toggleSponsorLock");
  sponsorBtn.textContent = state.sponsorLocked ? "Unlock Sponsor" : "Lock Sponsor";
});
