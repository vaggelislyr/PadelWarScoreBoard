console.log("controller loaded");

function pointA() {
  updateState(s => addPoint(s, "A"));
}

function pointB() {
  updateState(s => addPoint(s, "B"));
}

function switchServe() {
  updateState(s => {
    s.serve = s.serve === "A" ? "B" : "A";
  });
}

function toggleScoreboard() {
  updateState(s => {
    s.visible = !s.visible;
  });
}

function resetScore() {
  updateState(s => {
    s.pointsA = 0;
    s.pointsB = 0;
    s.gamesA = 0;
    s.gamesB = 0;
    s.setsA = 0;
    s.setsB = 0;
    s.mode = "normal";
    s.serve = "A";
    s.visible = true;
  });
}

function addPoint(s, player) {

  // =========================
  // SUPER TIE BREAK (10)
  // =========================
  if (s.mode === "super") {

    if (player === "A") s.pointsA++;
    else s.pointsB++;

    if (
      (s.pointsA >= 10 || s.pointsB >= 10) &&
      Math.abs(s.pointsA - s.pointsB) >= 2
    ) {
      alert("Match Winner: " + player);
    }

    return;
  }

  // =========================
  // TIE BREAK (7)
  // =========================
  if (s.mode === "tiebreak") {

    if (player === "A") s.pointsA++;
    else s.pointsB++;

    if (
      (s.pointsA >= 7 || s.pointsB >= 7) &&
      Math.abs(s.pointsA - s.pointsB) >= 2
    ) {

      if (player === "A") s.gamesA++;
      else s.gamesB++;

      awardSet(s, player);
    }

    return;
  }

  // =========================
  // NORMAL GAME
  // =========================

  if (player === "A") s.pointsA++;
  else s.pointsB++;

  if (s.pointsA >= 4 || s.pointsB >= 4) {
    if (Math.abs(s.pointsA - s.pointsB) >= 2) {

      if (player === "A") s.gamesA++;
      else s.gamesB++;

      s.pointsA = 0;
      s.pointsB = 0;

      // 6-6 → Tie Break
      if (s.gamesA === 6 && s.gamesB === 6) {
        s.mode = "tiebreak";
      }

      // Κανονικό κλείσιμο σετ
      if (
        (s.gamesA >= 6 || s.gamesB >= 6) &&
        Math.abs(s.gamesA - s.gamesB) >= 2
      ) {
        awardSet(s, player);
      }
    }
  }
}

function awardSet(s, player) {

  if (player === "A") s.setsA++;
  else s.setsB++;

  s.gamesA = 0;
  s.gamesB = 0;
  s.pointsA = 0;
  s.pointsB = 0;
  s.mode = "normal";

  // Αν γίνει 1-1 → Super Tie Break
  if (s.setsA === 1 && s.setsB === 1) {
    s.mode = "super";
  }
}
