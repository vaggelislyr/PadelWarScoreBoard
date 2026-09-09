console.log("Controller loaded");

/* ================= HISTORY ================= */

let historyStack = [];

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pushHistory(currentState, reset = false, elapsedMs = 0) {
  const snapshot = clone(currentState);
  Object.defineProperty(snapshot, "_restoreReset", {value: reset});
  Object.defineProperty(snapshot, "_resetElapsedMs", {value: elapsedMs});
  historyStack.push(snapshot);
  if (historyStack.length > 30) historyStack.shift();
}
function commitControllerAction(state, before, reset = false) {
  const elapsedMs = reset ? matchElapsedMs(before) : 0;
  return writeState(state).then(result => { if (result) pushHistory(before, reset, elapsedMs); return result; });
}
let undoBusy = false;
function undo() {
  flashButton("normal");
  if (!historyStack.length || undoBusy) return;
  undoBusy = true;
  const previous = historyStack[historyStack.length - 1];
  readState(current => {
    if ((current.correctionRevision || 0) !== (previous.correctionRevision || 0)) {
      historyStack = [];
      throw new Error("Undo history was cleared by a manual correction.");
    }
    if (previous._restoreReset) {
      // Restore every saved field, removing fields introduced after the reset.
      for (const key of Object.keys(current)) if (!(key in previous)) current[key] = null;
      Object.assign(current, clone(previous));
      current.timer = {elapsedMs: previous._resetElapsedMs, running: !!previous.timer?.running,
        startedAt: previous.timer?.running ? timerServerTimestamp() : null};
    } else {
      for (const key of [...SCORE_KEYS, "nameA", "nameB", "organizer", "visible", "design", "overlayMode", "matchHistory"]) {
        if (previous[key] !== undefined) current[key] = clone(previous[key]);
        else if (key === "matchHistory") current[key] = null;
      }
    }
    return writeState(current).then(result => { if (result) historyStack.pop(); });
  }).finally(() => { undoBusy = false; });
}

/* ================= FLASH FEEDBACK ================= */

let lastPressedButton = null;

function rememberPressedButton(event) {
  const btn = event.target.closest(".btn");
  if (btn) lastPressedButton = btn;
}

function flashButton(type = "normal") {
  const btn = lastPressedButton;
  if (!btn) return;

  btn.classList.remove("flashTap", "flashDanger");
  void btn.offsetWidth;
  btn.classList.add(type === "danger" ? "flashDanger" : "flashTap");

  setTimeout(() => {
    btn.classList.remove("flashTap", "flashDanger");
  }, type === "danger" ? 460 : 400);
}

document.addEventListener("pointerdown", rememberPressedButton);
document.addEventListener("touchstart", rememberPressedButton, { passive: true });
document.addEventListener("mousedown", rememberPressedButton);

/* ================= TIMER COMMANDS ================= */
function startTimer() { flashButton(); changeMatchTimer("start").catch(reportStateError); }
function stopTimer() { flashButton(); changeMatchTimer("pause").catch(reportStateError); }
function resetTimer() { flashButton(); changeMatchTimer("reset").catch(reportStateError); }

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

function finishMatch(state) {
  state.matchOver = true;
  state.mode = "finished";
  resetPoints(state);
}

function recordCompletedSet(state, scoreA, scoreB) {
  if (!Array.isArray(state.setHistoryA)) state.setHistoryA = [];
  if (!Array.isArray(state.setHistoryB)) state.setHistoryB = [];
  state.setHistoryA.push(scoreA);
  state.setHistoryB.push(scoreB);
}

function afterSetWin(state) {
  if (state.setsA === 2 || state.setsB === 2) {
    finishMatch(state);
    return;
  }

  state.gamesA = 0;
  state.gamesB = 0;
  state.mode = "normal";
  resetPoints(state);
}

function winSetNormal(state, player) {
  recordCompletedSet(state, state.gamesA, state.gamesB);

  if (player === "A") state.setsA++;
  else state.setsB++;

  afterSetWin(state);
}

function winSetByTiebreak(state, player) {
  const finalGamesA = player === "A" ? 7 : 6;
  const finalGamesB = player === "B" ? 7 : 6;

  recordCompletedSet(state, finalGamesA, finalGamesB);

  if (player === "A") state.setsA++;
  else state.setsB++;

  afterSetWin(state);
}

function checkSetOrTiebreak(state) {
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

  checkSetOrTiebreak(state);
}

/* ================= SCORING ================= */

function handleNormalPoint(state, player) {
  const opponent = player === "A" ? "B" : "A";

  if (state.matchOver) return;

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

function handleTieBreak(state, player) {
  if (state.matchOver) return;

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

function addPoint(player) {
  flashButton("normal");

  readState(state => {
    if (state.matchOver || state.mode === "finished") return;
    const before = clone(state);

    if (!state.mode) state.mode = "normal";
    if (state.deuceCount === undefined) state.deuceCount = 0;
    if (state.goldenActive === undefined) state.goldenActive = false;
    if (state.matchOver === undefined) state.matchOver = false;

    if (state.mode === "normal") {
      handleNormalPoint(state, player);
    } else if (state.mode === "tiebreak") {
      handleTieBreak(state, player);
    }

    recordMatchPoint(before, state, player);
    return commitControllerAction(state, before);
  });
}

/* ================= CONTROLLER ACTIONS ================= */

function updateNameA() {
  flashButton("normal");

  const value = document.getElementById("nameAInput").value || "";

  readState(state => {
    const before = clone(state);
    state.nameA = value;
    document.getElementById("nameAInput").dataset.dirty = "false";
    return commitControllerAction(state, before);
  });
}

function updateNameB() {
  flashButton("normal");

  const value = document.getElementById("nameBInput").value || "";

  readState(state => {
    const before = clone(state);
    state.nameB = value;
    document.getElementById("nameBInput").dataset.dirty = "false";
    return commitControllerAction(state, before);
  });
}

function switchServe() {
  flashButton("normal");

  readState(state => {
    const before = clone(state);
    state.serve = nextServe(state.serve);
    return commitControllerAction(state, before);
  });
}

function toggleScoreboard() {
  flashButton("normal");

  readState(state => {
    const before = clone(state);
    state.visible = !state.visible;
    return commitControllerAction(state, before);
  });
}

function resetMatch() {
  flashButton("danger");

  readState(state => {
    const before = clone(state);

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

    state.organizer = state.organizer || "@sponsor";

    state.timerText = "00:00";
    state.design = state.design || "futuristic";

    state.matchHistory = null;
    state.overlayMode = "live";
    state.timer = { elapsedMs: 0, startedAt: null, running: false };

    return commitControllerAction(state, before, true);
  });
}

/* ================= DESIGN SWITCH ================= */

function getSafeDesignName(design) {
  return ["modern", "design3"].includes(design) ? design : "futuristic";
}

function getDesignLabel(design) {
  return { futuristic: "Design: Futuristic", modern: "Design: Modern", design3: "Design: Design 3" }[getSafeDesignName(design)];
}

function setOverlayDesign(design) {
  flashButton("normal");

  readState(state => {
    const before = clone(state);
    state.design = getSafeDesignName(design);
    return commitControllerAction(state, before);
  });
}

/* ================= UI HELPERS ================= */

function setBadgeText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ================= PREVIEW SCALE ================= */

// The Controller snapshot owns serve presentation in its embedded preview only.
let controllerPreviewServeState = null;
function renderControllerPreviewServe() {
  const state = controllerPreviewServeState;
  if (!state) return;
  const serving = !state.matchOver && state.mode !== "finished" && ["A", "B"].includes(state.serve) ? state.serve : null;
  const cards = ["A", "B"].map(team => document.getElementById(`scoreTeam${team}`));
  cards.forEach(card => card?.classList.remove("isServing"));
  if (serving) cards[serving === "A" ? 0 : 1]?.classList.add("isServing");
  const doc = document.getElementById("obsPreview")?.contentDocument;
  if (!doc) return;
  const rows = [...doc.querySelectorAll("#d3-board .d3-team")];
  // Clear both before setting one, including the accessibility state.
  rows.forEach(row => {
    row.classList.remove("d3-serving");
    row.querySelector(".d3-serve")?.setAttribute("aria-hidden", "true");
  });
  const selected = rows.find(row => row.dataset.team === serving);
  selected?.classList.add("d3-serving");
  selected?.querySelector(".d3-serve")?.setAttribute("aria-hidden", "false");
  // Finish only outgoing preview serve fades; a rapid A/B reversal must not
  // leave the previous dot visible alongside the canonical serving team's dot.
  rows.filter(row => row !== selected).forEach(row => {
    const dot = row.querySelector(".d3-serve");
    if (!dot) return;
    doc.defaultView.getComputedStyle(dot).opacity;
    dot.getAnimations?.().forEach(animation => {
      if (animation.transitionProperty === "opacity") animation.finish();
    });
  });
}
document.getElementById("obsPreview")?.addEventListener("load", renderControllerPreviewServe);

let obsPreviewCrop = { x: 40, y: 24, width: 880, height: 260 };
function resizeObsPreview() {
  const viewport = document.getElementById("previewViewport");
  const iframe = document.getElementById("obsPreview");

  if (!viewport || !iframe) return;

  const viewportWidth = viewport.clientWidth;
  const baseWidth = 1920;
  const baseHeight = 1080;

  if (!viewportWidth) return;

  // Crop only this iframe presentation. OBS retains its full design canvas.
  const doc = iframe.contentDocument;
  const design3 = doc?.getElementById("layout-design3")?.classList.contains("activeLayout");
  const region = doc?.getElementById(design3 ? "d3-scoreboard-region" : "legacyScoreboardRegion");
  if (region?.offsetWidth > 0) {
    const paddingTop = design3 ? 10 : 36;
    obsPreviewCrop = {
      x: Math.max(0, region.offsetLeft - 10),
      y: Math.max(0, region.offsetTop - paddingTop),
      width: Math.max(region.offsetWidth, region.scrollWidth) + 20,
      height: region.offsetHeight + paddingTop + (design3 ? 42 : 12)
    };
  }
  let crop = obsPreviewCrop;
  const details = doc?.getElementById("matchDetailsLayer")?.classList.contains("isModeActive");
  const end = doc?.getElementById("matchEndLayer")?.classList.contains("isModeActive");
  const graphics = details ? [...doc.querySelectorAll(".detailsCard")] : end ? [doc.querySelector(".endBanner")] : [];
  if(graphics.length && graphics.every(el=>el?.offsetWidth)) {
    // Use untransformed design coordinates, so entrance animation never moves the crop.
    const left=Math.min(...graphics.map(el=>el.offsetLeft));
    const top=Math.min(...graphics.map(el=>el.offsetTop));
    const right=Math.max(...graphics.map(el=>el.offsetLeft+el.offsetWidth));
    const bottom=Math.max(...graphics.map(el=>el.offsetTop+el.offsetHeight));
    crop={x:left-18,y:top-18,width:right-left+36,height:bottom-top+36};
  }
  const scale = Math.min(viewportWidth / crop.width, viewport.clientHeight / crop.height);
  iframe.style.width = `${baseWidth}px`;
  iframe.style.height = `${baseHeight}px`;
  iframe.style.transformOrigin = "top left";
  iframe.style.left = `${(viewportWidth - crop.width * scale) / 2 - crop.x * scale}px`;
  iframe.style.top = `${(viewport.clientHeight - crop.height * scale) / 2 - crop.y * scale}px`;
  iframe.style.transform = `scale(${scale}) translateZ(0)`;
}

/* ================= IOS SAFARI HARD LOCK ================= */

function lockPreviewDockToViewport() {
  const dock = document.getElementById("stickyPreviewDock");
  if (!dock) return;

  const vv = window.visualViewport;
  const isMobile = window.innerWidth <= 640;
  const sideGap = isMobile ? 8 : 20;
  const bottomGap = isMobile ? 6 : 12;

  if (!vv) {
    dock.style.left = "50%";
    dock.style.top = "";
    dock.style.bottom = `${bottomGap}px`;
    dock.style.transform = "translateX(-50%)";
    return;
  }

  const width = Math.min(980, vv.width - (sideGap * 2));
  const dockHeight = dock.offsetHeight || (isMobile ? 174 : 214);

  const centerX = vv.offsetLeft + (vv.width / 2);
  const topY = vv.offsetTop + vv.height - dockHeight - bottomGap;

  dock.style.width = `${width}px`;
  dock.style.left = `${centerX}px`;
  dock.style.top = `${Math.max(topY, 0)}px`;
  dock.style.bottom = "auto";
  dock.style.transform = "translateX(-50%)";
}

function updateFloatingPreviewLayout() {
  resizeObsPreview();
  requestAnimationFrame(lockPreviewDockToViewport);
}

window.addEventListener("message", event => {
  const iframe = document.getElementById("obsPreview");
  if (event.origin === location.origin && event.source === iframe?.contentWindow && event.data?.type === "padelwars:layout") {
    renderControllerPreviewServe();
    updateFloatingPreviewLayout();
  }
});
window.addEventListener("resize", updateFloatingPreviewLayout);
window.addEventListener("orientationchange", () => {
  setTimeout(updateFloatingPreviewLayout, 120);
});

window.addEventListener("scroll", () => {
  requestAnimationFrame(lockPreviewDockToViewport);
}, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateFloatingPreviewLayout);
  window.visualViewport.addEventListener("scroll", () => {
    requestAnimationFrame(lockPreviewDockToViewport);
  });
}

window.addEventListener("load", () => {
  setTimeout(updateFloatingPreviewLayout, 80);
});

/* ================= INIT INPUTS FROM STATE ================= */

onStateChange(state => {
  controllerPreviewServeState = {serve:state.serve, matchOver:state.matchOver, mode:state.mode};
  renderControllerPreviewServe();
  for (const team of ["A", "B"]) {
    const input = document.getElementById(`name${team}Input`);
    if (document.activeElement !== input && input.dataset.dirty !== "true") input.value = state[`name${team}`] || "";
  }

  setText("teamANamePreview", state.nameA || "Player1 / Player2");
  setText("teamBNamePreview", state.nameB || "Player1 / Player2");

  // Read-only Controller score presentation; canonical scoring is unchanged.
  for (const team of ["A", "B"]) {
    const points = state[`points${team}`];
    const text = state.matchOver || state.mode === "finished" ? "–" : state.mode === "tiebreak" ? String(points) : points === 4 ? (state.deuceCount >= 1 ? "AD2" : "AD1") : ["0", "15", "30", "40"][points] || "0";
    const output = document.getElementById(`currentPoints${team}`);
    if (output.textContent !== text) {
      output.textContent = text;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) output.animate([{opacity:.5,transform:"translateY(3px)"},{opacity:1,transform:"none"}],{duration:180});
    }
    setText(`currentGames${team}`, state[`games${team}`] || 0);
    setText(`currentSets${team}`, state[`sets${team}`] || 0);
  }
  setBadgeText("serveBadge", `Serve: ${state.serve || "A"}`);

  let modeText = "Normal Mode";
  if (state.mode === "tiebreak") modeText = "Tiebreak";
  if (state.matchOver === true || state.mode === "finished") modeText = "Match Finished";
  setBadgeText("modeBadge", modeText);

  setBadgeText("visibleBadge", state.visible === false ? "Overlay Hidden" : "Overlay Visible");
  setBadgeText("designBadge", getDesignLabel(state.design));

  updateFloatingPreviewLayout();
});

/* ================= GLOBAL EXPORTS FOR HTML onclick ================= */

window.updateNameA = updateNameA;
window.updateNameB = updateNameB;
window.addPoint = addPoint;
window.switchServe = switchServe;
window.undo = undo;
window.toggleScoreboard = toggleScoreboard;
window.resetMatch = resetMatch;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resetTimer = resetTimer;
window.setOverlayDesign = setOverlayDesign;

function setBroadcastMode(mode) {
  if (!["live", "matchDetails", "matchEnd"].includes(mode)) return;
  readState(state => {
    const before = clone(state);
    state.overlayMode = mode;
    return commitControllerAction(state, before);
  });
}
onStateChange(state => {
  document.querySelectorAll("[data-overlay-mode]").forEach(button => {
    const active = button.dataset.overlayMode === state.overlayMode;
    button.classList.toggle("modeSelected", active);
    button.setAttribute("aria-pressed", String(active));
  });
});
