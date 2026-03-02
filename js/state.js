console.log("state loaded");

const stateRef = db.ref("matchState");

const DEFAULT_STATE = {
  scoreA: 0,
  scoreB: 0,
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
