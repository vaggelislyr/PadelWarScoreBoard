import { state, getState, setState, loadState } from "./state.js";
// controller.js
// ==========================
// Padel War – Controller
// ==========================

import {
  getState,
  updateState,
  toggleServe
} from "./state.js";

// Βοηθητική συνάρτηση
function $(id) {
  return document.getElementById(id);
}

// Αρχικοποίηση
document.addEventListener("DOMContentLoaded", () => {
  render();
  bindButtons();
});

// Render UI (απλό – σταθερό)
function render() {
  const state = getState();

  if ($("scoreA")) $("scoreA").textContent = state.score.A;
  if ($("scoreB")) $("scoreB").textContent = state.score.B;

  if ($("gamesA")) $("gamesA").textContent = state.games.A;
  if ($("gamesB")) $("gamesB").textContent = state.games.B;

  if ($("setsA")) $("setsA").textContent = state.sets.A;
  if ($("setsB")) $("setsB").textContent = state.sets.B;

  if ($("timerInput")) {
    $("timerInput").value = state.timer.duration || 0;
  }

  if ($("scoreboardToggle")) {
    $("scoreboardToggle").textContent =
      state.visible ? "ON" : "OFF";
  }
}

// Κουμπιά
function bindButtons() {

  // + SCORE
  if ($("plusA")) {
    $("plusA").addEventListener("click", () => {
      updateState(s => {
        s.score.A++;
      });
      render();
    });
  }

  if ($("plusB")) {
    $("plusB").addEventListener("click", () => {
      updateState(s => {
        s.score.B++;
      });
      render();
    });
  }

  // - SCORE
  if ($("minusA")) {
    $("minusA").addEventListener("click", () => {
      updateState(s => {
        s.score.A = Math.max(0, s.score.A - 1);
      });
      render();
    });
  }

  if ($("minusB")) {
    $("minusB").addEventListener("click", () => {
      updateState(s => {
        s.score.B = Math.max(0, s.score.B - 1);
      });
      render();
    });
  }

  // TOGGLE SERVE
  if ($("serveToggle")) {
    $("serveToggle").addEventListener("click", () => {
      toggleServe();
      render();
    });
  }

  // TIMER SET
  if ($("setTimer")) {
    $("setTimer").addEventListener("click", () => {
      const value = parseInt($("timerInput").value, 10) || 0;
      updateState(s => {
        s.timer.duration = value;
        s.timer.remaining = value;
      });
      render();
    });
  }

  // SCOREBOARD ON / OFF
  if ($("scoreboardToggle")) {
    $("scoreboardToggle").addEventListener("click", () => {
      updateState(s => {
        s.visible = !s.visible;
      });
      render();
    });
  }
}
