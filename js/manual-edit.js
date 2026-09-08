/* Local draft only. Applying merges validated score fields in one transaction. */
let manualDraft = null;
let manualBase = null;
const manualDialog = document.getElementById('manualEditDialog');
const manualFields = document.getElementById('manualEditFields');
const manualError = document.getElementById('manualEditError');
function validateManualScore(draft) {
  const s = clone(draft);
  const integer = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
  if (!['A','B'].includes(s.serve)) throw new Error('Choose a server.');
  if (!Array.isArray(s.setHistoryA) || !Array.isArray(s.setHistoryB) || s.setHistoryA.length !== s.setHistoryB.length || s.setHistoryA.length > 3) throw new Error('Completed set histories must match.');
  s.setsA = 0; s.setsB = 0;
  s.setHistoryA.forEach((a, i) => {
    const b = s.setHistoryB[i];
    if (s.setsA === 2 || s.setsB === 2) throw new Error('A best-of-three match cannot have sets after the winner is decided.');
    const high = Math.max(a,b), low = Math.min(a,b);
    if (!integer(a,7) || !integer(b,7) || !((high === 6 && low <= 4) || (high === 7 && (low === 5 || low === 6)))) throw new Error(`Set ${i+1} must be a completed numeric score, such as 6–4, 7–5 or 7–6.`);
    if (a > b) s.setsA++; else s.setsB++;
  });
  s.matchOver = s.setsA === 2 || s.setsB === 2;
  if (s.matchOver) {
    s.mode = 'finished'; s.gamesA = s.gamesB = s.pointsA = s.pointsB = s.deuceCount = 0; s.goldenActive = false;
    return s;
  }
  if (![s.gamesA,s.gamesB].every(n => integer(n,7))) throw new Error('Games must be whole numbers from 0 to 7.');
  if (Math.max(s.gamesA,s.gamesB) >= 7 || (Math.max(s.gamesA,s.gamesB) >= 6 && Math.abs(s.gamesA-s.gamesB) >= 2)) throw new Error('This game score completes a set. Move it into completed sets and enter the next set’s games.');
  s.mode = s.gamesA === 6 && s.gamesB === 6 ? 'tiebreak' : 'normal';
  if (s.mode === 'tiebreak') {
    if (![s.pointsA,s.pointsB].every(n => integer(n,999))) throw new Error('Tiebreak points must be whole numbers.');
    if (Math.max(s.pointsA,s.pointsB) >= 7 && Math.abs(s.pointsA-s.pointsB) >= 2) throw new Error('This tiebreak is finished. Record a 7–6 set and reset the current score.');
    s.deuceCount = 0; s.goldenActive = false;
  } else {
    const advantages = ['AD1','AD2'];
    for (const team of ['A','B']) {
      const p = s['points'+team];
      if (!advantages.includes(p) && !integer(p,3)) throw new Error('Choose normal tennis points.');
    }
    const owner = advantages.includes(s.pointsA) ? 'A' : advantages.includes(s.pointsB) ? 'B' : null;
    if (owner) {
      const other = owner === 'A' ? 'B' : 'A';
      if (s['points'+other] !== 3) throw new Error('Advantage requires the opposing team to have 40.');
      s.deuceCount = s['points'+owner] === 'AD2' ? 1 : 0;
      s['points'+owner] = 4;
    } else if (s.pointsA !== 3 || s.pointsB !== 3) s.deuceCount = 0;
    if (!integer(s.deuceCount,2)) throw new Error('Choose Deuce 1, Deuce 2 or Star Point.');
    s.goldenActive = !owner && s.pointsA === 3 && s.pointsB === 3 && s.deuceCount === 2;
  }
  return s;
}
function manualButton(text, label, action, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = text; button.setAttribute('aria-label', label);
  button.disabled = disabled;
  button.addEventListener('click', () => { action(); drawManualFields(); });
  return button;
}
function manualName(team) { return manualDraft['name'+team] || 'Players not named'; }
function manualPointChoices(team) {
  if (manualDraft.gamesA === 6 && manualDraft.gamesB === 6) return null;
  const other = team === 'A' ? 'B' : 'A';
  // These are correction values, not simulated point wins. Validation remains authoritative.
  return manualDraft['points'+other] === 3 ? [0,1,2,3,'AD1','AD2'] : [0,1,2,3];
}
function manualStepper(team, label, value, change, choices = null, max = 7) {
  const box = document.createElement('div'); box.className = 'manualStepper';
  const index = choices ? choices.indexOf(value) : Number(value);
  const limit = choices ? choices.length - 1 : max;
  const adjust = delta => {
    const next = Math.max(0, Math.min(limit, index + delta));
    change(choices ? choices[next] : next);
  };
  const output = document.createElement('output');
  output.textContent = label === 'Points' && choices ? (typeof value === 'string' ? value : ['0','15','30','40'][value]) : String(value);
  box.append(manualButton('−',`Decrease ${label} for ${manualName(team)}`,()=>adjust(-1),index <= 0), output,
    manualButton('+',`Increase ${label} for ${manualName(team)}`,()=>adjust(1),index >= limit));
  return box;
}
function drawManualFields() {
  manualFields.replaceChildren();
  const grid = document.createElement('div'); grid.className = 'manualScoreGrid'; manualFields.append(grid);
  grid.append(document.createElement('span'));
  for (const team of ['A','B']) {
    const names = document.createElement('div'); names.className = 'manualTeamNames';
    for (const part of manualName(team).split(/\s*\/\s*/)) { const line=document.createElement('div');line.textContent=part;names.append(line); }
    grid.append(names);
  }
  const row = (label, make) => {
    const title=document.createElement('div'); title.className='manualRowLabel';title.textContent=label;grid.append(title);
    for(const team of ['A','B'])grid.append(make(team));
  };
  const finished = (()=>{try{return validateManualScore(manualDraft).matchOver;}catch{return false;}})();
  row('POINTS',team=> {
    const box=manualStepper(team,'Points',manualDraft['points'+team],v=>{
      manualDraft['points'+team]=v;
      if(typeof v==='string')manualDraft.deuceCount=v==='AD2'?1:0;
      // Preserve the existing stage at an ambiguous 40–40; reset outside deuce.
      else if(manualDraft.pointsA!==3 || manualDraft.pointsB!==3) {
        const advantage=[manualDraft.pointsA,manualDraft.pointsB].find(p=>typeof p==='string');
        manualDraft.deuceCount=advantage==='AD2'?1:0;
      }
    },manualPointChoices(team),999);
    if(finished) {box.querySelectorAll('button').forEach(b=>b.disabled=true);box.querySelector('output').textContent='–';}
    return box;
  });
  row('GAMES',team=> {
    const box=manualStepper(team,'Games',manualDraft['games'+team],v=>{
      const wasTie=manualDraft.gamesA===6&&manualDraft.gamesB===6;
      manualDraft['games'+team]=v;
      if(wasTie!==(manualDraft.gamesA===6&&manualDraft.gamesB===6)) {manualDraft.pointsA=manualDraft.pointsB=0;manualDraft.deuceCount=0;}
    });
    if(finished){box.querySelectorAll('button').forEach(b=>b.disabled=true);box.querySelector('output').textContent='–';}
    return box;
  });
  manualDraft.setHistoryA.forEach((_,i)=>row(`SET ${i+1}`,team=>manualStepper(team,`Set ${i+1}`,manualDraft['setHistory'+team][i],v=>{manualDraft['setHistory'+team][i]=v;})));
  row('SERVE',team=>{
    const button=manualButton(manualDraft.serve===team?'●':'○',`Serve: ${manualName(team)}`,()=>{manualDraft.serve=team;});
    button.className='manualServe';button.setAttribute('aria-pressed',String(manualDraft.serve===team));return button;
  });
  const setTools=document.createElement('div');setTools.className='manualSetTools';
  if(manualDraft.setHistoryA.length<3 && !finished)setTools.append(manualButton('+ Add completed set','Add completed set',()=>{
    manualDraft.setHistoryA.push(manualDraft.gamesA);manualDraft.setHistoryB.push(manualDraft.gamesB);
    manualDraft.gamesA=manualDraft.gamesB=manualDraft.pointsA=manualDraft.pointsB=manualDraft.deuceCount=0;
  }));
  if(manualDraft.setHistoryA.length)setTools.append(manualButton('Remove last set','Remove last completed set from draft',()=>{manualDraft.setHistoryA.pop();manualDraft.setHistoryB.pop();}));
  manualFields.append(setTools);
  updateManualPreview();
}
function updateManualPreview() {
  let valid;
  try { valid=validateManualScore(manualDraft); manualError.textContent=''; }
  catch(error) { manualError.textContent=error.message; }
  document.getElementById('manualApply').disabled=!valid;
  const score=valid||manualDraft;
  let changed=['pointsA','pointsB','gamesA','gamesB','serve','deuceCount'].filter(k=>JSON.stringify(score[k])!==JSON.stringify(manualBase[k])).length;
  for(const team of ['A','B']) {
    const before=manualBase['setHistory'+team],after=score['setHistory'+team];
    for(let i=0;i<Math.max(before.length,after.length);i++)if(before[i]!==after[i])changed++;
  }
  document.getElementById('manualPending').textContent=`${changed} ${changed===1?'change':'changes'} pending`;
}
function openManualEdit() {
  readState(state=>{
    manualBase=clone(state); manualDraft=clone(state);
    if(state.mode==='normal') for(const team of ['A','B']) if(manualDraft['points'+team]===4)manualDraft['points'+team]=state.deuceCount===1?'AD2':'AD1';
    drawManualFields(); document.body.classList.add('manualEditing'); manualDialog.showModal();
  });
}
function closeManualEdit() { manualDialog.close(); }
manualDialog.addEventListener('close',()=>{manualDraft=manualBase=null;document.body.classList.remove('manualEditing');updateFloatingPreviewLayout();});
document.getElementById('manualCancel').addEventListener('click',closeManualEdit);
document.getElementById('manualApply').addEventListener('click',async()=>{
  const button=document.getElementById('manualApply'), cancel=document.getElementById('manualCancel');
  try {
    const corrected=validateManualScore(manualDraft), expected=scoreIdentity(manualBase);
    button.disabled=cancel.disabled=true;
    await atomicStateChange(current=>{
      if(scoreIdentity(current)!==expected)return;
      for(const key of SCORE_KEYS)current[key]=clone(corrected[key]);
      current.matchHistory = createMatchHistoryBaseline(current, "manualCorrection");
      current.correctionRevision=(current.correctionRevision||0)+1;
      return current;
    });
    historyStack=[]; closeManualEdit();
  } catch(error) { manualError.textContent=error.message; button.disabled=false; }
  finally { cancel.disabled=false; }
});
manualDialog.addEventListener('cancel',event=>{if(document.getElementById('manualCancel').disabled)event.preventDefault();});
