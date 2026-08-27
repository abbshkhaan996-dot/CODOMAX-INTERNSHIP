/* ===========================================================
   ABBSH BLOGS — shared app logic
   Data is persisted in localStorage. This is a front-end-only
   demo: passwords are stored in plain text in the browser and
   must never be treated as a real authentication system.
   =========================================================== */

const DB_USERS = "abbsh_blogs_users";
const DB_POSTS = "abbsh_blogs_posts";
const DB_SESSION = "abbsh_blogs_session";

/* ---------- seed data (first run only) ---------- */
function seedIfEmpty() {
  if (!localStorage.getItem(DB_USERS)) {
    const users = [
      { id: "u1", name: "Mara Ellison", email: "mara@abbshblogs.dev", password: "password123" }
    ];
    localStorage.setItem(DB_USERS, JSON.stringify(users));
  }
  if (!localStorage.getItem(DB_POSTS)) {
    const posts = [
      {
        id: "p1",
        title: "I Deleted My Outline and the Draft Got Better",
        tag: "Craft",
        excerpt: "Planning every beat in advance was killing my momentum. Here's what happened when I let the draft find its own shape.",
        content: "For years I wouldn't start a piece without a full outline — every section mapped, every argument pre-sequenced. It felt responsible. It also meant I dreaded sitting down, because the actual writing had already been decided by an earlier, less-informed version of me.\n\nSo on a whim I tried the opposite: one sentence about what I wanted to figure out, then just typing until I hit an answer. The first draft was messier. The second draft, the one where I actually revised, was sharper — because I was editing something that existed instead of forcing reality to match a plan.\n\nOutlines aren't the enemy. Treating them as contracts instead of guesses is.",
        author: "Mara Ellison",
        authorId: "u1",
        date: "2026-08-04"
      },
      {
        id: "p2",
        title: "Your Headline Is Making a Promise. Keep It.",
        tag: "Notes",
        excerpt: "A good headline and a good opening paragraph should be arguing about the same thing. Most aren't.",
        content: "Here's a quick test: read your headline, then read your first paragraph. Do they agree on what the piece is actually about? Surprisingly often, they don't — the headline was written to be clever or to get a click, and the piece itself is doing something quieter and more specific.\n\nWhen that gap exists, readers feel misled even if nothing you wrote was technically false. The fix isn't to write duller headlines. It's to make sure the headline is a promise your first paragraph is already keeping.\n\nWrite the piece first. Let the headline come out of what you actually said, not the other way around.",
        author: "Mara Ellison",
        authorId: "u1",
        date: "2026-07-22"
      },
      {
        id: "p3",
        title: "What I Actually Needed to Launch a Blog: One Evening",
        tag: "Build",
        excerpt: "No CMS, no database, no build step. A text editor and the willingness to hit publish before it felt ready.",
        content: "I spent more time researching static site generators than I ever spent writing. Themes, plugins, deployment pipelines — all of it felt like progress, and none of it was a single word toward an actual post.\n\nWhat finally got something live was ignoring all of that. One HTML file, one evening, one post that wasn't perfect. Comments, search, tags — every feature I thought I needed on day one turned out to be something the blog could ask for later, once there was enough content to justify it.\n\nStart smaller than feels responsible. You can always add the scaffolding once you know what you're actually building around.",
        author: "Mara Ellison",
        authorId: "u1",
        date: "2026-07-09"
      }
    ];
    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
  }
}

/* ---------- data access ---------- */
function getUsers() { return JSON.parse(localStorage.getItem(DB_USERS) || "[]"); }
function saveUsers(users) { localStorage.setItem(DB_USERS, JSON.stringify(users)); }

function getPosts() {
  return JSON.parse(localStorage.getItem(DB_POSTS) || "[]")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
function savePosts(posts) { localStorage.setItem(DB_POSTS, JSON.stringify(posts)); }

/* ---------- session ---------- */
function getCurrentUser() {
  const id = localStorage.getItem(DB_SESSION);
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}
function setSession(userId) { localStorage.setItem(DB_SESSION, userId); }
function clearSession() { localStorage.removeItem(DB_SESSION); }

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

document.addEventListener("DOMContentLoaded", seedIfEmpty);
