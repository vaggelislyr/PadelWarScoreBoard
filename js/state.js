console.log("state loaded");

const stateRef = db.ref("matchState");

const DEFAULT_STATE = {
  pointsA: 0,
  pointsB: 0,
  gamesA: 0,
  gamesB: 0,
  setsA: 0,
  setsB: 0,
  mode: "normal",   // normal | tiebreak | super
  serve: "A",
  visible: true
};

function initState() {
  stateRef.once("value", snap => {
    if (!snap.exists()) {
      stateRef.set(DEFAULT_STATE);
    }
  });
}

function updateState(updater) {
  stateRef.transaction(state => {
    if (!state) state = { ...DEFAULT_STATE };
    updater(state);
    return state;
  });
}

function onStateChange(callback) {
  stateRef.on("value", snap => {
    callback(snap.val());
  });
}

initState();
