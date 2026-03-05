// Firebase CDN (compat version for OBS safety)

const firebaseConfig = {
  apiKey: "AIzaSyCpD_3E32OgVJq9Zw_rTeeaeR2WGlXMs_4",
  authDomain: "padelwarscoreboard.firebaseapp.com",
  databaseURL: "https://padelwarscoreboard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "padelwarscoreboard",
  storageBucket: "padelwarscoreboard.firebasestorage.app",
  messagingSenderId: "443269359115",
  appId: "1:443269359115:web:511358eab031b0930d090e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = firebase.database();
