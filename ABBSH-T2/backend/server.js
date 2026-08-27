/* ===========================================================
   ABBSH BLOGS — backend API (Module 2)
   Node.js + Express, JWT auth, bcrypt password hashing,
   JSON-file storage (users.json / posts.json).
   =========================================================== */

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

// Dev-only secret. In a real deployment this MUST come from an
// environment variable and never be committed to source control.
const JWT_SECRET = "abbsh-blogs-dev-secret-change-in-production";
const TOKEN_EXPIRY = "7d";

app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb to allow base64 cover images

/* ---------- JSON file storage helpers ---------- */
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8").trim();
  if (!raw) return [];
  return JSON.parse(raw);
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ---------- seed data (first run only) ---------- */
function seed() {
  if (!fs.existsSync(USERS_FILE)) {
    const passwordHash = bcrypt.hashSync("password123", 10);
    const users = [
      { id: "u1", name: "Mara Ellison", email: "mara@abbshblogs.dev", passwordHash }
    ];
    writeJSON(USERS_FILE, users);
  }
  if (!fs.existsSync(POSTS_FILE)) {
    const posts = [
      {
        id: "p1",
        title: "I Deleted My Outline and the Draft Got Better",
        tag: "Craft",
        image: null,
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
        image: null,
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
        image: null,
        excerpt: "No CMS, no database, no build step. A text editor and the willingness to hit publish before it felt ready.",
        content: "I spent more time researching static site generators than I ever spent writing. Themes, plugins, deployment pipelines — all of it felt like progress, and none of it was a single word toward an actual post.\n\nWhat finally got something live was ignoring all of that. One HTML file, one evening, one post that wasn't perfect. Comments, search, tags — every feature I thought I needed on day one turned out to be something the blog could ask for later, once there was enough content to justify it.\n\nStart smaller than feels responsible. You can always add the scaffolding once you know what you're actually building around.",
        author: "Mara Ellison",
        authorId: "u1",
        date: "2026-07-09"
      }
    ];
    writeJSON(POSTS_FILE, posts);
  }
}
seed();

/* ---------- helpers ---------- */
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
function excerptOf(content) {
  const trimmed = (content || "").trim();
  return trimmed.slice(0, 140) + (trimmed.length > 140 ? "…" : "");
}
function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

/* ---------- auth middleware ---------- */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "You need to be logged in to do that." });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Your session has expired. Please log in again." });
    req.user = payload; // { id, name, email }
    next();
  });
}

/* ===========================================================
   AUTH ROUTES
   =========================================================== */

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();

  if (cleanName.length < 2) return res.status(400).json({ error: "We'll need your full name first." });
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: "That doesn't look like a valid email." });
  if (!password || password.length < 6) return res.status(400).json({ error: "Give the password at least 6 characters." });

  const users = readJSON(USERS_FILE);
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: "That email already has a shelf here." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = { id: "u" + crypto.randomUUID(), name: cleanName, email: cleanEmail, passwordHash };
  users.push(newUser);
  writeJSON(USERS_FILE, users);

  const token = jwt.sign(publicUser(newUser), JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.status(201).json({ token, user: publicUser(newUser) });
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || "").trim().toLowerCase();

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(400).json({ error: "We couldn't match that email and password." });
  }

  const token = jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
app.get("/api/auth/me", authenticateToken, (req, res) => {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

/* ===========================================================
   POST ROUTES
   =========================================================== */

// GET /api/posts — public, newest first
app.get("/api/posts", (req, res) => {
  const posts = readJSON(POSTS_FILE).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(posts);
});

// GET /api/posts/:id — public
app.get("/api/posts/:id", (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "That entry doesn't exist." });
  res.json(post);
});

// POST /api/posts — create (auth required)
app.post("/api/posts", authenticateToken, (req, res) => {
  const { title, tag, image, content } = req.body || {};
  const cleanTitle = (title || "").trim();
  const cleanContent = (content || "").trim();
  const cleanTag = (tag || "General").trim();

  if (cleanTitle.length < 3) return res.status(400).json({ error: "Give your post a title (3+ characters)." });
  if (cleanContent.length < 20) return res.status(400).json({ error: "Write a little more before publishing (20+ characters)." });

  const posts = readJSON(POSTS_FILE);
  const newPost = {
    id: "p" + crypto.randomUUID(),
    title: cleanTitle,
    tag: cleanTag,
    image: image || null,
    excerpt: excerptOf(cleanContent),
    content: cleanContent,
    author: req.user.name,
    authorId: req.user.id,
    date: new Date().toISOString().slice(0, 10)
  };
  posts.push(newPost);
  writeJSON(POSTS_FILE, posts);
  res.status(201).json(newPost);
});

// PUT /api/posts/:id — edit (auth required, must be the owner)
app.put("/api/posts/:id", authenticateToken, (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "That entry doesn't exist." });
  if (posts[idx].authorId !== req.user.id) return res.status(403).json({ error: "You can only edit your own posts." });

  const { title, tag, image, content } = req.body || {};
  const cleanTitle = (title || "").trim();
  const cleanContent = (content || "").trim();
  const cleanTag = (tag || "General").trim();

  if (cleanTitle.length < 3) return res.status(400).json({ error: "Give your post a title (3+ characters)." });
  if (cleanContent.length < 20) return res.status(400).json({ error: "Write a little more before publishing (20+ characters)." });

  posts[idx] = {
    ...posts[idx],
    title: cleanTitle,
    tag: cleanTag,
    image: image === undefined ? posts[idx].image : image,
    excerpt: excerptOf(cleanContent),
    content: cleanContent
  };
  writeJSON(POSTS_FILE, posts);
  res.json(posts[idx]);
});

// DELETE /api/posts/:id — auth required, must be the owner
app.delete("/api/posts/:id", authenticateToken, (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "That entry doesn't exist." });
  if (posts[idx].authorId !== req.user.id) return res.status(403).json({ error: "You can only delete your own posts." });

  posts.splice(idx, 1);
  writeJSON(POSTS_FILE, posts);
  res.json({ success: true });
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Abbsh Blogs backend running on http://localhost:${PORT}`);
});
