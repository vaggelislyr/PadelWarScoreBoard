console.log("Controller loaded");

/* ---------- TIMER ---------- */

let timerInterval = null;
let timerSeconds = 0;

function updateTimerDisplay(){
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2,"0");
  const seconds = (timerSeconds % 60).toString().padStart(2,"0");

  updateState(state=>{
    state.timerText = minutes + ":" + seconds;
  });
}

function startTimer(){

  if(timerInterval) return;

  timerInterval = setInterval(()=>{
    timerSeconds++;
    updateTimerDisplay();
  },1000);
}

function stopTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer(){
  stopTimer();
  timerSeconds = 0;
  updateTimerDisplay();
}


/* ---------- NAMES ---------- */

document.getElementById("updateNames").onclick = ()=>{

  const nameA = document.getElementById("nameA").value;
  const nameB = document.getElementById("nameB").value;

  updateState(state=>{
    state.nameA = nameA;
    state.nameB = nameB;
  });

};


/* ---------- SPONSOR ---------- */

document.getElementById("updateOrganizer").onclick = ()=>{

  const org = document.getElementById("organizerInput").value;

  updateState(state=>{
    state.organizer = org;
  });

};


/* ---------- POINTS ---------- */

document.getElementById("pointA").onclick = ()=>{
  addPoint("A");
};

document.getElementById("pointB").onclick = ()=>{
  addPoint("B");
};


/* ---------- SERVE ---------- */

document.getElementById("switchServe").onclick = ()=>{

  updateState(state=>{
    state.serve = state.serve === "A" ? "B" : "A";
  });

};


/* ---------- UNDO ---------- */

document.getElementById("undo").onclick = ()=>{
  undoLastAction();
};


/* ---------- RESET ---------- */

document.getElementById("reset").onclick = ()=>{

  updateState(state=>{

    state.pointsA = 0;
    state.pointsB = 0;

    state.gamesA = 0;
    state.gamesB = 0;

    state.setsA = 0;
    state.setsB = 0;

    state.mode = "normal";

  });

};


/* ---------- TIMER BUTTONS ---------- */

document.getElementById("timerStart").onclick = startTimer;
document.getElementById("timerStop").onclick = stopTimer;
document.getElementById("timerReset").onclick = resetTimer;
