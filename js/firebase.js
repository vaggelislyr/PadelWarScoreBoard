// Firebase core
const firebaseConfig = {
  apiKey: "AIzaSyCpD_3E32OgVJq9Zw_rTeeaeR2WGlXMs_4",
  authDomain: "padelwarscoreboard.firebaseapp.com",
  databaseURL: "https://padelwarscoreboard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "padelwarscoreboard",
  storageBucket: "padelwarscoreboard.firebasestorage.app",
  messagingSenderId: "443269359115",
  appId: "1:443269359115:web:511358eab031b0930d090e"
};

// Load Firebase (compat – works everywhere)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
