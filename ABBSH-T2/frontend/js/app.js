/* ===========================================================
   ABBSH BLOGS — shared app logic
   Data now lives on the backend (Node.js + Express, JSON-file
   storage). The browser only keeps the JWT token and a cached
   copy of the logged-in user for instant UI rendering.
   =========================================================== */

const API_BASE = "http://localhost:5000/api";

const TOKEN_KEY = "abbsh_blogs_token";
const USER_KEY = "abbsh_blogs_user";

/* ---------- low-level API helper ---------- */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error("Can't reach the server. Is the backend running?");
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body is fine */ }

  if (res.status === 401) {
    // token missing/expired — clear the stale session
    clearSession();
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data;
}

/* ---------- token / cached-user storage ---------- */
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }

function getCachedUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setCachedUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ---------- session ---------- */
function getCurrentUser() {
  // synchronous — reads the cached user saved at login/register time
  if (!getToken()) return null;
  return getCachedUser();
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

/* ---------- posts API wrappers ---------- */
async function fetchPosts() {
  return await apiFetch("/posts");
}
async function fetchPost(id) {
  return await apiFetch(`/posts/${encodeURIComponent(id)}`);
}
async function createPost(payload) {
  return await apiFetch("/posts", { method: "POST", body: JSON.stringify(payload) });
}
async function updatePost(id, payload) {
  return await apiFetch(`/posts/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) });
}
async function deletePost(id) {
  return await apiFetch(`/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ---------- nav rendering ---------- */
function initNav(activePage) {
  const nav = document.getElementById("primary-nav");
  if (!nav) return;
  const user = getCurrentUser();

  const links = [];
  links.push({ href: "index.html", label: "Home", key: "home" });
  if (user) {
    links.push({ href: "dashboard.html", label: "Dashboard", key: "dashboard" });
    links.push({ href: "create-blog.html", label: "Create Blog", key: "create" });
  } else {
    links.push({ href: "login.html", label: "Log in", key: "login" });
    links.push({ href: "register.html", label: "Sign up", key: "register", btn: true });
  }

  nav.innerHTML = links.map(l =>
    `<a href="${l.href}" class="${l.key === activePage ? "active" : ""} ${l.btn ? "btn btn-sm btn-accent" : ""}">${l.label}</a>`
  ).join("");

  if (user) {
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Log out";
    logoutLink.addEventListener("click", (e) => { e.preventDefault(); logout(); });
    nav.appendChild(logoutLink);
  }

  const toggle = document.getElementById("nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
}
