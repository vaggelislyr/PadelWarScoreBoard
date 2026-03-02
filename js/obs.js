console.log("OBS loaded");

function renderOBS() {
  document.getElementById("scoreA").textContent = state.scoreA;
  document.getElementById("scoreB").textContent = state.scoreB;

  document.getElementById("serveA").textContent =
    state.serve === "A" ? "🎾" : "";

  document.getElementById("serveB").textContent =
    state.serve === "B" ? "🎾" : "";
}

renderOBS();

window.addEventListener("storage", renderOBS);
