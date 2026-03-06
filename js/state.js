console.log("state loaded");

const stateRef = db.ref("matchState");

const DEFAULT_STATE = {
  nameA: "Player A / Player A",
  nameB: "Player B / Player B",

  organizer: "@sponsor",
  sponsorLocked: true,

  pointsA: 0,
  pointsB: 0,

  gamesA: 0,
  gamesB: 0,

  setsA: 0,
  setsB: 0,

  setHistoryA: [],
  setHistoryB: [],

  mode: "normal", // normal | tiebreak | super | finished
  serve: "A",
  visible: true,

  goldenActive: false,
  deuceCount: 0,

  timerText: "00:00",
  matchOver: false
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeState(raw) {
  const base = clone(DEFAULT_STATE);
  const incoming = raw || {};

  return {
    ...base,
    ...incoming,
    setHistoryA: Array.isArray(incoming.setHistoryA) ? incoming.setHistoryA : [],
    setHistoryB: Array.isArray(incoming.setHistoryB) ? incoming.setHistoryB : []
  };
}

function initState() {
  stateRef.once("value", snap => {
    if (!snap.exists()) {
      stateRef.set(clone(DEFAULT_STATE));
    } else {
      stateRef.set(normalizeState(snap.val()));
    }
  });
}

function readState(callback) {
  stateRef.once("value").then(snap => {
    callback(normalizeState(snap.val()));
  });
}

function writeState(state) {
  stateRef.set(normalizeState(state));
}

function updateState(updater) {
  readState(state => {
    updater(state);
    writeState(state);
  });
}

function onStateChange(callback) {
  stateRef.on("value", snap => {
    callback(normalizeState(snap.val()));
  });
}

initState();
