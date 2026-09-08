/* Current match only. Baseline + one small event per point, never full snapshots. */
function createMatchHistoryBaseline(state, reason = 'recordingStarted') {
  const score = {};
  for (const key of SCORE_KEYS) score[key] = clone(state[key]);
  const fresh = !(state.setHistoryA?.length || state.gamesA || state.gamesB || state.pointsA || state.pointsB || state.matchOver);
  return {version: 1, reason, complete: fresh, baseline: score, events: []};
}
function recordMatchPoint(before, after, team) {
  const history = before.matchHistory?.version === 1 ? clone(before.matchHistory) : createMatchHistoryBaseline(before);
  if (!Array.isArray(history.events)) history.events = [];
  const completed = after.setHistoryA.length > before.setHistoryA.length;
  const gameWon = completed || after.gamesA !== before.gamesA || after.gamesB !== before.gamesB;
  const event = {
    n: history.events.length + 1, at: matchClockNow(), set: before.setHistoryA.length + 1,
    team, p: [after.pointsA, after.pointsB], serve: before.serve,
    deuce: after.mode === 'normal' && after.pointsA === 3 && after.pointsB === 3 && !(before.pointsA === 3 && before.pointsB === 3),
    star: before.mode === 'normal' && before.goldenActive && before.pointsA === 3 && before.pointsB === 3
  };
  if (gameWon) {
    event.gameWinner = team;
    event.games = completed ? [after.setHistoryA.at(-1), after.setHistoryB.at(-1)] : [after.gamesA, after.gamesB];
    event.setComplete = completed;
  }
  history.events.push(event);
  after.matchHistory = history;
}
function currentMatchStats(state) {
  const history = state.matchHistory;
  const events = Array.isArray(history?.events) ? history.events : [];
  const finished = state.matchOver || state.mode === 'finished';
  const total = team => (state['setHistory'+team] || []).reduce((sum,n)=>sum+Number(n),0) + (finished ? 0 : Number(state['games'+team] || 0));
  return {totalA:total('A'), totalB:total('B'), deuces:events.filter(e=>e.deuce).length,
    stars:events.filter(e=>e.star).length, starA:events.filter(e=>e.star && e.team==='A').length,
    starB:events.filter(e=>e.star && e.team==='B').length, partial:!history?.complete, events};
}
