(function () {
  const auth = firebase.auth();
  const gate = document.getElementById("authGate");
  const shell = document.querySelector(".appShell");
  const form = document.getElementById("authForm");
  const error = document.getElementById("authError");
  let controllerStarted = false;

  const controllerScripts = [
    "js/state.js?v=2",
    "js/timer.js",
    "js/match-history.js",
    "js/controller.js?v=2",
    "js/mobile.js",
    "js/manual-edit.js"
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Unable to load controller."));
      document.body.appendChild(script);
    });
  }

  function showAuthenticatedController() {
    gate.hidden = true;
    shell.hidden = false;
    const preview = document.getElementById("obsPreview");
    if (preview) preview.src = preview.src;
  }

  function showLogin() {
    shell.hidden = true;
    gate.hidden = false;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    error.textContent = "";
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    auth.signInWithEmailAndPassword(email, password).catch(() => {
      error.textContent = "Sign-in failed. Check your email and password.";
    });
  });

  auth.onAuthStateChanged(async user => {
    if (!user) {
      showLogin();
      return;
    }
    showAuthenticatedController();
    if (controllerStarted) return;
    controllerStarted = true;
    try {
      for (const src of controllerScripts) await loadScript(src);
    } catch (loadError) {
      controllerStarted = false;
      error.textContent = loadError.message;
      await auth.signOut();
    }
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    auth.signOut().then(() => window.location.reload());
  });
}());
