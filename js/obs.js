console.log("obs loaded");

function render() {
  loadState();

  document.getElementById("scoreA").innerText = state.scoreA;
  document.getElementById("scoreB").innerText = state.scoreB;

  document.getElementById("serveA").style.opacity =
    state.serve === "A" ? "1" : "0.2";

  document.getElementById("serveB").style.opacity =
    state.serve === "B" ? "1" : "0.2";
}

setInterval(render, 300);
