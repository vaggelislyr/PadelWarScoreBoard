console.log("state loaded");

const stateRef = db.ref("matchState");

const DEFAULT_STATE = {
  nameA: "Player A1 / Player A2",
  nameB: "Player B1 / Player B2",

  organizer: "@sponsor",
  sponsorLocked: true,

  pointsA: 0,
  pointsB: 0,

  gamesA: 0,
  gamesB: 0,

  setsA: 0,
  setsB: 0,

  // store finished set scores
  // example:
  // setHistoryA = [6, 4]
  // setHistoryB = [4, 6]
  setHistoryA: [],
  setHistoryB: [],

  mode: "normal", // normal | tiebreak | finished
  serve: "A",
  visible: true,
  overlayMode: "live",
  matchHistory: null,

  goldenActive: false,
  deuceCount: 0,

  timerText: "00:00",
  matchOver: false
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeState(raw) {
  const incoming = raw || {};
  return {
    ...clone(DEFAULT_STATE),
    ...incoming,
    overlayMode: ["live", "matchDetails", "matchEnd"].includes(incoming.overlayMode) ? incoming.overlayMode : "live",
    setHistoryA: Array.isArray(incoming.setHistoryA) ? incoming.setHistoryA : [],
    setHistoryB: Array.isArray(incoming.setHistoryB) ? incoming.setHistoryB : []
  };
}

// Existing pages must never rewrite a live snapshot just by opening it.
const stateBases = new WeakMap();
const SCORE_KEYS = ["pointsA", "pointsB", "gamesA", "gamesB", "setsA", "setsB", "setHistoryA", "setHistoryB", "mode", "serve", "deuceCount", "goldenActive", "matchOver"];
function scoreIdentity(state) {
  return JSON.stringify([...SCORE_KEYS.map(k => state[k]), state.correctionRevision || 0]);
}
function reportStateError(error) {
  console.error(error);
  const el = document.getElementById("controlError");
  if (el) el.textContent = error.message || String(error);
}
function initState() {
  stateRef.once("value").then(snap => {
    if (!snap.exists()) return stateRef.transaction(raw => raw || clone(DEFAULT_STATE));
  }).catch(reportStateError);
}
function readState(callback) {
  return stateRef.once("value").then(snap => {
    const state = normalizeState(snap.val());
    stateBases.set(state, clone(state));
    return callback(state);
  }).catch(reportStateError);
}
// Merge only edited fields, preserving concurrent timer/metadata changes.
function writeState(state) {
  const base = stateBases.get(state);
  if (!base) return Promise.reject(new Error("Missing state baseline."));
  const changes = Object.keys(state).filter(k => JSON.stringify(state[k]) !== JSON.stringify(base[k]));
  return atomicStateChange(current => {
    if (changes.some(k => SCORE_KEYS.includes(k)) && scoreIdentity(current) !== scoreIdentity(base)) return;
    for (const key of changes) {
      if (JSON.stringify(current[key]) !== JSON.stringify(base[key])) return;
    }
    for (const key of changes) current[key] = clone(state[key]);
    return current;
  }).catch(reportStateError);
}
async function atomicStateChange(updater) {
  await stateRef.once("value");
  const result = await stateRef.transaction(raw => updater(normalizeState(raw)), undefined, false);
  if (!result.committed) throw new Error("Live state changed. Review the latest score and try again.");
  return normalizeState(result.snapshot.val());
}
function updateState(updater) {
  return readState(state => { updater(state); return writeState(state); });
}
function onStateChange(callback) {
  stateRef.on("value", snap => callback(normalizeState(snap.val())), reportStateError);
}
initState();
