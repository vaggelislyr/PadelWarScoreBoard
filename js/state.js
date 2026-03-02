export const state = {
  scoreA: 0,
  scoreB: 0,
  gamesA: 0,
  gamesB: 0,
  setsA: 0,
  setsB: 0,
  serve: "A",
  scoreboardVisible: true,
  timer: 0
};

export function getState() {
  return state;
}

export function setState(newState) {
  Object.assign(state, newState);
  localStorage.setItem("padelState", JSON.stringify(state));
}

export function loadState() {
  const saved = localStorage.getItem("padelState");
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }
}
