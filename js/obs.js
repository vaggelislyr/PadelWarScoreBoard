// obs.js
console.log("OBS loaded");

function updateOBS() {
  const state = loadState();

  document.getElementById("scoreA").innerText = state.score.A;
  document.getElementById("scoreB").innerText = state.score.B;

  document.getElementById("gamesA").innerText = state.games.A;
  document.getElementById("gamesB").innerText = state.games.B;

  document.getElementById("setsA").innerText = state.sets.A;
  document.getElementById("setsB").innerText = state.sets.B;
}

// refresh κάθε 300ms
setInterval(updateOBS, 300);
