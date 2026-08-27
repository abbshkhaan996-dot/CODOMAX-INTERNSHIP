/* ---------- login ---------- */
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    const user = getUsers().find(u => u.email.toLowerCase() === email);

    if (!user || user.password !== password) {
      msg.textContent = "We couldn't match that email and password.";
      msg.className = "form-msg error show";
      return;
    }

    setSession(user.id);
    msg.textContent = "Good to see you — taking you to your dashboard.";
    msg.className = "form-msg success show";
    setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
  });
}

/* ---------- register ---------- */
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    msg.className = "form-msg";

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (name.length < 2) return showError(msg, "We'll need your full name first.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showError(msg, "That doesn't look like a valid email.");
    if (password.length < 6) return showError(msg, "Give the password at least 6 characters.");
    if (password !== confirm) return showError(msg, "Those two passwords don't match.");

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
      return showError(msg, "That email already has a shelf here.");
    }

    const newUser = { id: "u" + Date.now(), name, email, password };
    users.push(newUser);
    saveUsers(users);
    setSession(newUser.id);

    msg.textContent = "You're in — setting up your dashboard.";
    msg.className = "form-msg success show";
    setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
  });
}

function showError(msgEl, text) {
  msgEl.textContent = text;
  msgEl.className = "form-msg error show";
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
});
