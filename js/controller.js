console.log("Controller loaded");

let history = [];

function cloneState(state){
  return JSON.parse(JSON.stringify(state));
}

function saveHistory(state){
  history.push(cloneState(state));
}

function undo(){
  if(history.length === 0) return;

  const previous = history.pop();

  updateState(state=>{
    Object.assign(state, previous);
  });
}

function nextServe(current){
  return current === "A" ? "B" : "A";
}

function resetPoints(state){
  state.pointsA = 0;
  state.pointsB = 0;
}

function winGame(state, player){

  if(player==="A") state.gamesA++;
  else state.gamesB++;

  resetPoints(state);
  state.serve = nextServe(state.serve);

  checkSetWinner(state);
}

function checkSetWinner(state){

  const {gamesA,gamesB} = state;

  // κανονική νίκη σετ
  if(gamesA>=6 && gamesA-gamesB>=2){

    state.setHistory = state.setHistory || [];
    state.setHistory.push(`${gamesA}-${gamesB}`);

    state.setsA++;

    state.gamesA=0;
    state.gamesB=0;

    return;
  }

  if(gamesB>=6 && gamesB-gamesA>=2){

    state.setHistory = state.setHistory || [];
    state.setHistory.push(`${gamesA}-${gamesB}`);

    state.setsB++;

    state.gamesA=0;
    state.gamesB=0;

    return;
  }

  // tie break στο 6-6
  if(gamesA===6 && gamesB===6){

    state.mode="tiebreak";

    resetPoints(state);
  }
}

function handleNormalPoint(state,player){

  const opponent = player==="A"?"B":"A";

  if(state.pointsA>=3 && state.pointsB>=3){

    if(state.pointsA===4 && player==="B"){
      state.pointsA=3;
      state.pointsB=3;
      return;
    }

    if(state.pointsB===4 && player==="A"){
      state.pointsA=3;
      state.pointsB=3;
      return;
    }

    if(state.pointsA===4 && player==="A"){
      winGame(state,"A");
      return;
    }

    if(state.pointsB===4 && player==="B"){
      winGame(state,"B");
      return;
    }

    if(state.pointsA===3 && state.pointsB===3){
      state["points"+player]++;
      return;
    }
  }

  state["points"+player]++;

  if(state["points"+player]>=4 &&
     state["points"+player]-state["points"+opponent]>=2){

     winGame(state,player);
  }
}

function handleTieBreak(state,player){

  state["points"+player]++;

  const opponent = player==="A"?"B":"A";

  if(state["points"+player]>=7 &&
     state["points"+player]-state["points"+opponent]>=2){

     if(player==="A") state.setsA++;
     else state.setsB++;

     state.setHistory = state.setHistory || [];
     state.setHistory.push(`7-6`);

     state.gamesA=0;
     state.gamesB=0;

     resetPoints(state);

     state.mode="normal";
  }
}

function addPoint(player){

  updateState(state=>{

    saveHistory(state);

    if(state.mode==="normal")
      handleNormalPoint(state,player);

    else if(state.mode==="tiebreak")
      handleTieBreak(state,player);

  });
}

function resetMatch(){

  history=[];

  updateState(state=>{

    state.pointsA=0;
    state.pointsB=0;

    state.gamesA=0;
    state.gamesB=0;

    state.setsA=0;
    state.setsB=0;

    state.setHistory=[];

    state.mode="normal";

    state.serve="A";
  });
}

function switchServe(){
  updateState(state=>{
    saveHistory(state);
    state.serve = nextServe(state.serve);
  });
}

function toggleScoreboard(){
  updateState(state=>{
    state.visible = !state.visible;
  });
}

document.getElementById("pointA").onclick = ()=>addPoint("A");
document.getElementById("pointB").onclick = ()=>addPoint("B");
document.getElementById("switchServe").onclick = switchServe;
document.getElementById("reset").onclick = resetMatch;
document.getElementById("undo").onclick = undo;
document.getElementById("toggle").onclick = toggleScoreboard;
