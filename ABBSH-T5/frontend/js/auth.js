/* ---------- login ---------- */
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    msg.className = "form-msg";
    submitBtn.disabled = true;

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      setToken(data.token);
      setCachedUser(data.user);

      msg.textContent = "Good to see you — taking you to your dashboard.";
      msg.className = "form-msg success show";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
    } catch (err) {
      msg.textContent = err.message || "We couldn't match that email and password.";
      msg.className = "form-msg error show";
      submitBtn.disabled = false;
    }
  });
}

/* ---------- register ---------- */
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    const submitBtn = form.querySelector('button[type="submit"]');
    msg.className = "form-msg";

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (name.length < 2) return showError(msg, "We'll need your full name first.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showError(msg, "That doesn't look like a valid email.");
    if (password.length < 6) return showError(msg, "Give the password at least 6 characters.");
    if (password !== confirm) return showError(msg, "Those two passwords don't match.");

    submitBtn.disabled = true;

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });

      setToken(data.token);
      setCachedUser(data.user);

      msg.textContent = "You're in — setting up your dashboard.";
      msg.className = "form-msg success show";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
    } catch (err) {
      showError(msg, err.message || "That email already has a shelf here.");
      submitBtn.disabled = false;
    }
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
