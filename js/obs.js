console.log("Obs loaded");

db.ref("score").on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  document.getElementById("teamA").innerText = data.teamA || 0;
  document.getElementById("teamB").innerText = data.teamB || 0;
});
