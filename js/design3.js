/* Design 3 is a read-only projection of the existing canonical match state.
   No writes, scoring rules, timer ownership, or new Firebase fields live here. */
function design3Model(state) {
  const finished = state.matchOver === true || state.mode === "finished";
  const historyA = Array.isArray(state.setHistoryA) ? state.setHistoryA : [];
  const historyB = Array.isArray(state.setHistoryB) ? state.setHistoryB : [];
  const count = Math.min(3, historyA.length, historyB.length);
  const deuce = Math.min(3, Math.max(1, (Number(state.deuceCount) || 0) + 1));
  const points = team => {
    if (finished) return "–";
    const value = state["points" + team] ?? 0;
    if (state.mode === "tiebreak") return String(value);
    if (value === 4) return deuce >= 2 ? "AD2" : "AD1";
    return ["0", "15", "30", "40"][value] ?? "0";
  };
  const columns = Array.from({length: count}, (_, i) => ({
    key: `set${i + 1}`, label: `SET ${i + 1}`, kind: "set", values: [historyA[i], historyB[i]]
  }));
  // A finished set belongs only in SET columns, never duplicated as a current game.
  columns.push({key: "game", label: "GAME", kind: "game", values: finished ? ["–", "–"] : [state.gamesA ?? 0, state.gamesB ?? 0]});
  columns.push({key: "points", label: "POINTS", kind: "points", values: [points("A"), points("B")]});
  let status = "";
  if (finished) status = "winner";
  else if (state.mode === "tiebreak") status = "tiebreak";
  else if (state.mode === "normal" && state.goldenActive) status = "star";
  else if (state.mode === "normal" && state.pointsA === 3 && state.pointsB === 3) status = `deuce${deuce}`;
  return {columns, status, finished, winner: finished ? (state.setsA > state.setsB ? "A" : state.setsB > state.setsA ? "B" : "") : ""};
}

const design3Root = document.getElementById("layout-design3");
const design3Scoreboard = document.getElementById("d3-scoreboard-region");
const design3Board = document.getElementById("d3-board");
let design3Structure = "";
let design3LastWidth = 0;
let design3ResizeAnimation = null;

function d3Cell(className, text = "") {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  return el;
}

function d3SetText(el, value) {
  const text = String(value ?? "");
  if (el.textContent === text) return;
  const hadValue = el.textContent !== "";
  el.textContent = text;
  if (hadValue && el.classList.contains("d3-score") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.animate([{opacity: .45, transform: "translateY(5px)"}, {opacity: 1, transform: "translateY(0)"}], {duration: 220, easing: "ease-out"});
  }
}

const previewServeNodes = new WeakMap();
function renderDesign3PreviewServe(state, finished) {
  // Standalone OBS retains its existing renderer and transitions.
  if (window.parent === window || window.frameElement?.id !== "obsPreview") return false;
  const serving = !finished && ["A", "B"].includes(state.serve) ? state.serve : null;
  const rows = [...design3Board.querySelectorAll(".d3-team")];
  if (rows.every(row => previewServeNodes.get(row)?.serve === serving &&
      previewServeNodes.get(row)?.dot === row.querySelector(".d3-serve"))) return true;
  // Discard both old painted nodes before creating either replacement.
  // This resets only the preview dots, without hiding/restarting the live package.
  for (const row of rows) {
    row.classList.remove("d3-serving");
    row.querySelectorAll(".d3-serve").forEach(dot => {
      dot.getAnimations?.().forEach(animation => animation.cancel());
      dot.remove();
    });
  }
  for (const row of rows) {
    const active = row.dataset.team === serving;
    const dot = d3Cell("d3-serve");
    dot.setAttribute("aria-label", "Serving");
    dot.setAttribute("aria-hidden", String(!active));
    if (active) row.classList.add("d3-serving");
    row.prepend(dot);
    previewServeNodes.set(row, {serve: serving, dot});
  }
  return true;
}

function renderDesign3(state) {
  // Measure complete teams at the unchanged name size; slash is ordinary text.
  const textMeasure = document.createElement("canvas").getContext("2d");
  textMeasure.font = "900 28px Arial";
  const teams = [state.nameA || "Player A1 - Player A2", state.nameB || "Player B1 - Player B2"].map(String);
  const longest = Math.max(...teams.map(name => textMeasure.measureText(name).width));
  // Compact 8px steps; full single-line names take precedence over a hard width cap.
  const requiredWidth = Math.ceil((longest + 30) / 8) * 8;
  const nameWidth = Math.max(104, requiredWidth);
  design3Root.style.setProperty("--d3-name-width", `${nameWidth}px`);
  const model = design3Model(state);
  const structure = model.columns.map(c => c.key).join("|");
  if (structure !== design3Structure) {
    const names = d3Cell("d3-names");
    names.append(d3Cell("d3-name-heading"));
    for (const team of ["A", "B"]) {
      const row = d3Cell("d3-team");
      row.dataset.team = team;
      const serve = d3Cell("d3-serve");
      serve.setAttribute("aria-label", "Serving");
      const name = d3Cell("d3-name");
      name.id = `d3-name${team}`;
      row.append(serve, name);
      names.append(row);
    }
    const fragment = document.createDocumentFragment();
    fragment.append(names);
    for (const column of model.columns) {
      const el = d3Cell(`d3-column d3-${column.kind}`);
      el.dataset.column = column.key;
      el.append(d3Cell("d3-label", column.label));
      for (const team of ["A", "B"]) {
        const cell = d3Cell("d3-score");
        cell.dataset.team = team;
        cell.id = `d3-${column.key}${team}`;
        el.append(cell);
      }
      fragment.append(el);
    }
    design3Board.replaceChildren(fragment);
    design3Structure = structure;
    // Animate the frame's real width. Removed columns leave no tracks or background.
    design3ResizeAnimation?.cancel();
    const nextWidth = design3Board.scrollWidth;
    if (design3LastWidth && nextWidth !== design3LastWidth && design3Root.classList.contains("activeLayout") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      design3ResizeAnimation = design3Scoreboard.animate([{width: `${design3LastWidth}px`}, {width: `${nextWidth}px`}], {duration: 360, easing: "cubic-bezier(.22,.8,.24,1)"});
      design3ResizeAnimation.onfinish = () => {
        if (window.parent !== window) window.parent.postMessage({type: "padelwars:layout"}, location.origin);
      };
    }
    if (nextWidth) design3LastWidth = nextWidth;
  }
  // Capture the baseline when switching from a previously hidden legacy layout.
  if (design3Root.classList.contains("activeLayout") && design3ResizeAnimation?.playState !== "running") {
    design3LastWidth = design3Board.scrollWidth;
  }
  const previewServeRendered = renderDesign3PreviewServe(state, model.finished);
  for (const team of ["A", "B"]) {
    const row = design3Board.querySelector(`.d3-team[data-team="${team}"]`);
    if (!previewServeRendered) {
      row.classList.toggle("d3-serving", !model.finished && state.serve === team);
      row.querySelector(".d3-serve").setAttribute("aria-hidden", String(model.finished || state.serve !== team));
    }
    row.classList.toggle("d3-winner", model.winner === team);
    row.classList.toggle("d3-loser", Boolean(model.winner) && model.winner !== team);
    const name = document.getElementById(`d3-name${team}`);
    const rawName = String(state[`name${team}`] || `Player ${team}1 - Player ${team}2`);
    if (name.dataset.value !== rawName) {
      name.textContent = rawName;
      name.dataset.value = rawName;
      name.title = rawName;
    }
  }
  for (const column of model.columns) {
    column.values.forEach((value, i) => d3SetText(document.getElementById(`d3-${column.key}${i ? "B" : "A"}`), value));
  }
  d3SetText(document.getElementById("d3-timer"), matchTimerText(state));
}

/* Presentation clock only: canonical deuceCount/goldenActive still own scoring.
   A revision invalidates every pending callback on point, game, hide or design change.
   Timer/name-only database updates do not restart the sequence. */
function createDesign3Presentation(paint, schedule = setTimeout, cancel = clearTimeout) {
  let key = null;
  let revision = 0;
  let displayed = "";
  let pending = [];
  const later = (fn, ms) => {
    const current = revision;
    pending.push(schedule(() => { if (revision === current) fn(); }, ms));
  };
  const show = status => { displayed = status; paint(status); };
  return state => {
    const enabled = state.visible !== false && state.design === "design3";
    const status = enabled ? design3Model(state).status : "";
    const nextKey = JSON.stringify([enabled, status, state.gamesA, state.gamesB, state.setHistoryA, state.setHistoryB]);
    if (key === nextKey) return;
    key = nextKey;
    revision++;
    pending.forEach(cancel);
    pending = [];
    // One rail: let the previous text leave before admitting another banner.
    const exitTime = displayed ? 350 : 0;
    show("");
    if (!status) return;
    const enter = () => {
      show(status === "star" ? "deuce3" : status);
      if (status === "star") {
        later(() => {
          show("");
          later(() => show("star"), 350);
        }, 1500);

      }
    };
    if (exitTime) later(enter, exitTime);
    else enter();
  };
}

const updateDesign3Presentation = createDesign3Presentation(status => {
  // Gold starts with STAR POINT, not when goldenActive first arrives from Firebase.
  design3Root.dataset.state = status;
  for (const banner of document.querySelectorAll("#d3-status [data-status]")) {
    const active = banner.dataset.status === status;
    banner.classList.toggle("d3-status-active", active);
    banner.setAttribute("aria-hidden", String(!active));
  }
});
