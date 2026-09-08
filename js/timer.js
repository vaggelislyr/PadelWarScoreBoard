/* One synchronized timer, rendered locally by every Controller/OBS client. */
let matchClockOffset = 0;
let matchTimerState = {};
function matchClockNow() { return Date.now() + matchClockOffset; }
function parseMatchTimer(text) {
  const parts = String(text || '00:00').split(':').map(Number);
  return parts.length >= 2 && parts.length <= 3 && parts.every(n => Number.isFinite(n) && n >= 0)
    ? parts.reduce((sum, n) => sum * 60 + n, 0) * 1000 : 0;
}
function matchElapsedMs(state, now = matchClockNow()) {
  const timer = state.timer;
  if (!timer || !Number.isFinite(timer.elapsedMs)) return parseMatchTimer(state.timerText);
  return Math.max(0, timer.elapsedMs) + (timer.running && Number.isFinite(timer.startedAt) ? Math.max(0, now - timer.startedAt) : 0);
}
function matchTimerText(state, now = matchClockNow()) {
  const seconds = Math.floor(matchElapsedMs(state, now) / 1000);
  const ss = String(seconds % 60).padStart(2, '0');
  const mm = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  return seconds >= 3600 ? `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}
function timerServerTimestamp() {
  return typeof firebase !== 'undefined' ? firebase.database.ServerValue.TIMESTAMP : Date.now();
}
function changeMatchTimer(action) {
  return atomicStateChange(state => {
    const elapsedMs = matchElapsedMs(state);
    if (action === 'start' && state.timer?.running) return state;
    state.timer = {
      elapsedMs: action === 'reset' ? 0 : elapsedMs,
      startedAt: action === 'start' ? timerServerTimestamp() : null,
      running: action === 'start'
    };
    state.timerText = action === 'reset' ? '00:00' : matchTimerText({timer: {elapsedMs, running: false}});
    return state;
  });
}
function refreshMatchTimer() {
  const text = matchTimerText(matchTimerState);
  for (const id of ['timer', 'modernTimer', 'd3-timer', 'controllerTimer', 'overviewTimer']) {
    const el = document.getElementById(id);
    if (el && el.textContent !== text) el.textContent = text;
  }
}
onStateChange(state => { matchTimerState = state; refreshMatchTimer(); });
db.ref('.info/serverTimeOffset').on('value', snap => {
  matchClockOffset = Number(snap.val()) || 0;
  refreshMatchTimer();
});
setInterval(refreshMatchTimer, 250); // Paint only; never writes to Firebase.
document.addEventListener('visibilitychange', refreshMatchTimer);
window.addEventListener('pageshow', refreshMatchTimer);
window.addEventListener('focus', refreshMatchTimer);
