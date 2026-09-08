/* Local presentation scheduling only. No Firebase writes or scoring decisions. */
let broadcastMode = null;
let broadcastRotation = null;
let broadcastCard = 0;
let broadcastRenderKey = '';
function broadcastElement(tag, className, text) {
  const el=document.createElement(tag);if(className)el.className=className;
  if(text!==undefined)el.textContent=String(text);return el;
}
function broadcastNames(el, name, size = 36) {
  el.replaceChildren(...String(name || 'Players not named').split(/\s*\/\s*/).map(p=>broadcastElement('span','broadcastPlayer',p)));
  const chars=Math.max(...String(name||'').split('/').map(p=>p.length));
  el.style.fontSize=`${Math.max(16,Math.min(size,Math.floor((size * 20)/Math.max(20,chars))))}px`;
}
function broadcastPoints(state, team) {
  if(state.matchOver || state.mode==='finished')return '–';
  const p=state['points'+team];
  return state.mode==='tiebreak'?p:p===4?(state.deuceCount>=1?'AD2':'AD1'):['0','15','30','40'][p]||'0';
}
function selectDetailsCard(index) {
  broadcastCard=index;
  ['overviewCard','journeyCard'].forEach((id,i)=>{
    const el=document.getElementById(id);el.classList.toggle('cardActive',index===i);el.setAttribute('aria-hidden',String(index!==i));
  });
  notifyBroadcastPreview();
}
function notifyBroadcastPreview() {
  if(window.parent!==window)requestAnimationFrame(()=>window.parent.postMessage({type:'padelwars:layout'},location.origin));
}
function scheduleDetailsRotation() {
  clearTimeout(broadcastRotation);
  broadcastRotation=setTimeout(()=>{
    if(broadcastMode!=='matchDetails')return;
    selectDetailsCard(1-broadcastCard);scheduleDetailsRotation();
  },8000);
}
function renderOverview(state, stats) {
  const root=document.getElementById('overviewTeams');root.replaceChildren();
  for(const team of ['A','B']) {
    const row=broadcastElement('div',`overviewTeam teamColor${team}`);
    const names=broadcastElement('div','overviewNames');broadcastNames(names,state['name'+team]);
    row.append(names);
    const play=broadcastElement('div','overviewPlay');
    for(const [label,value] of [['GAME',state.matchOver?'–':state['games'+team]||0],['POINTS',broadcastPoints(state,team)]]) {
      const cell=broadcastElement('div','overviewValue');cell.append(broadcastElement('small','',label),broadcastElement('strong','',value));play.append(cell);
    }
    row.append(play,broadcastElement('div','overviewServe',!state.matchOver && state.serve===team?'● SERVING':''));root.append(row);
  }
  const core=broadcastElement('div','overviewScoreCore');
  core.append(broadcastElement('small','','SETS'),broadcastElement('strong','',`${state.setsA||0} — ${state.setsB||0}`));
  root.insertBefore(core,root.lastElementChild);
  const statsRoot=document.getElementById('overviewStats');statsRoot.replaceChildren();
  const completed=broadcastElement('div','overviewSetSummary');
  (state.setHistoryA||[]).forEach((a,i)=>{
    const block=broadcastElement('div','completedSet');block.style.setProperty('--reveal-delay',`${1050+i*150}ms`);
    block.append(broadcastElement('small','',`SET ${i+1}`),broadcastElement('strong','',`${a}–${state.setHistoryB[i]}`));completed.append(block);
  });
  if(!state.matchOver) {
    const current=broadcastElement('div','completedSet currentSetResult');current.style.setProperty('--reveal-delay','1500ms');
    current.append(broadcastElement('small','',`SET ${state.setHistoryA.length+1} · LIVE`),broadcastElement('strong','',`${state.gamesA}–${state.gamesB}`));completed.append(current);
  }
  const phase=state.matchOver?'MATCH COMPLETE':`CURRENT SET ${(state.setHistoryA||[]).length+1}${state.mode==='tiebreak'?' · TIEBREAK':''}`;
  statsRoot.append(completed,broadcastElement('div','overviewPhase',phase));
  const grid=broadcastElement('div','overviewStatGrid');
  for(const [label,value] of [['TOTAL GAMES',`${stats.totalA} – ${stats.totalB}`],['DEUCE SITUATIONS',stats.deuces],['STAR POINTS PLAYED',stats.stars],['STAR WINS · A / B',`${stats.starA} / ${stats.starB}`]]){
    const box=broadcastElement('div','');box.append(broadcastElement('small','',label),broadcastElement('strong','',value));grid.append(box);
  }
  statsRoot.append(grid);
  document.getElementById('historyCoverage').textContent=stats.partial?'Deuce / Star Point statistics cover recorded play only. Earlier point-by-point history is unavailable.':'Current match · complete recorded progression';
  document.getElementById('overviewTimer').textContent=matchTimerText(state);
}
function renderJourney(state, stats) {
  const legend=document.getElementById('journeyTeams');legend.replaceChildren();
  for(const team of ['A','B']){const names=broadcastElement('div',`journeyLegend teamColor${team}`);broadcastNames(names,state['name'+team]);legend.append(names);}
  const root=document.getElementById('journeySets');root.replaceChildren();
  const history=state.matchHistory;
  const completed=state.setHistoryA.length;
  const count=Math.min(3,completed+(state.matchOver?0:1));
  for(let set=1;set<=Math.max(1,count);set++) {
    const section=broadcastElement('section','journeySet');
    const isDone=set<=completed;
    const final=isDone?`${state.setHistoryA[set-1]}–${state.setHistoryB[set-1]}`:`${state.gamesA}–${state.gamesB}`;
    section.classList.toggle('journeyLive',!isDone);
    const laneDelay=400+(set-1)*950;section.style.setProperty('--lane-delay',`${laneDelay}ms`);
    const heading=broadcastElement('h3','');heading.append(broadcastElement('span','',`SET ${set}`),broadcastElement('span','setStatus',isDone?`FINAL · ${final}`:`LIVE · ${final}`));section.append(heading);
    const rail=broadcastElement('div','journeyRail');
    const baselineSet=(history?.baseline?.setHistoryA?.length||0)+1;
    const fullyRecorded=!!history && (set>baselineSet || (set===baselineSet && !history.baseline.gamesA && !history.baseline.gamesB));
    const opening=fullyRecorded?'0–0':set===baselineSet?`${history?.baseline.gamesA||0}–${history?.baseline.gamesB||0}`:final;
    rail.append(broadcastElement('span','journeyOrigin',opening));
    if(!fullyRecorded)section.append(broadcastElement('small','journeyUnavailable','Earlier play unavailable'));
    const games=stats.events.filter(e=>e.set===set && e.gameWinner);
    rail.style.setProperty('--node-count',games.length+1);
    games.forEach((event,index)=> {
      const node=broadcastElement('div',`journeyGame teamColor${event.gameWinner}`);
      node.style.setProperty('--reveal-delay',`${laneDelay+150+(index+1)*Math.min(85,650/Math.max(1,games.length))}ms`);
      node.append(broadcastElement('strong','',`${event.games[0]}–${event.games[1]}`));
      node.classList.toggle('starGame',!!event.star);
      if(event.star)node.append(broadcastElement('span','journeyStar','★'));
      node.title=`${state['name'+event.gameWinner] || event.gameWinner} won this game${event.star?' on Star Point':''}`;
      rail.append(node);
    });
    section.append(rail);root.append(section);
  }
}
function renderMatchEnd(state) {
  // Resolve only canonical match completion, never the live banner's animation state.
  const a=Number(state.setsA)||0, b=Number(state.setsB)||0;
  const finished=state.matchOver===true || state.mode==='finished' || Math.max(a,b)>=2;
  const winner=finished && a!==b?(a>b?'A':'B'):null;
  const banner=document.querySelector('#matchEndLayer .endBanner');
  banner.classList.add('winnerAvailable');
  banner.classList.toggle('winnerPending',!winner);
  const names=winner?String(state['name'+winner]||'').trim():'';
  broadcastNames(document.getElementById('endWinnerNames'),names || (winner?'Winning team names unavailable':'Awaiting match result'),48);
}
function updateBroadcastMode(state) {
  const mode=['matchDetails','matchEnd'].includes(state.overlayMode)?state.overlayMode:'live';
  if(mode!==broadcastMode) {
    broadcastMode=mode;clearTimeout(broadcastRotation);broadcastRotation=null;
    if(mode==='matchDetails') { selectDetailsCard(0); scheduleDetailsRotation(); }
  }
  for(const [id,active] of [['liveModeLayer',mode==='live' && state.visible!==false],['matchDetailsLayer',mode==='matchDetails'],['matchEndLayer',mode==='matchEnd']]) {
    const el=document.getElementById(id);
    el.classList.toggle('isModeActive',active);
    // Keep mode/card classes intact while hidden: rotation and preview framing continue.
    el.classList.toggle('programHidden',state.visible===false);
    el.setAttribute('aria-hidden',String(!active || state.visible===false));
  }
  // Clock text paints separately; avoid rebuilding cards on clock-only updates.
  const key=JSON.stringify([mode,state.nameA,state.nameB,...SCORE_KEYS.map(k=>state[k]),state.matchHistory]);
  if(key!==broadcastRenderKey) {
    broadcastRenderKey=key;
    if(mode==='matchDetails') {const stats=currentMatchStats(state);renderOverview(state,stats);renderJourney(state,stats);}
    if(mode==='matchEnd')renderMatchEnd(state);
    notifyBroadcastPreview();
  }
}
