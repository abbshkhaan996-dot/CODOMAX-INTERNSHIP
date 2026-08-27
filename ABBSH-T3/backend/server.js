/* ===========================================================
   ABBSH BLOGS — backend API (Module 3: Database Integration)
   Node.js + Express, JWT auth, bcrypt password hashing,
   MongoDB storage via Mongoose (replaces the JSON files
   used in Module 2).
   =========================================================== */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("./models/User");
const Post = require("./models/Post");

const app = express();
const PORT = process.env.PORT || 5000;

// In development these fall back to safe defaults so the app still runs
// without a .env file — but for anything real, always set these via
// environment variables (see .env.example).
const JWT_SECRET = process.env.JWT_SECRET || "abbsh-blogs-dev-secret-change-in-production";
const TOKEN_EXPIRY = "7d";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abbsh_blogs";

app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb to allow base64 cover images

/* ---------- database connection ---------- */
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

mongoose.connection.once("open", seed);

/* ---------- seed data (first run only) ---------- */
async function seed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return; // already seeded (or real users exist) — leave it alone

  const passwordHash = await bcrypt.hash("password123", 10);
  const mara = await User.create({ name: "Mara Ellison", email: "mara@abbshblogs.dev", passwordHash });

  await Post.create([
    {
      title: "I Deleted My Outline and the Draft Got Better",
      tag: "Craft",
      image: null,
      excerpt: "Planning every beat in advance was killing my momentum. Here's what happened when I let the draft find its own shape.",
      content: "For years I wouldn't start a piece without a full outline — every section mapped, every argument pre-sequenced. It felt responsible. It also meant I dreaded sitting down, because the actual writing had already been decided by an earlier, less-informed version of me.\n\nSo on a whim I tried the opposite: one sentence about what I wanted to figure out, then just typing until I hit an answer. The first draft was messier. The second draft, the one where I actually revised, was sharper — because I was editing something that existed instead of forcing reality to match a plan.\n\nOutlines aren't the enemy. Treating them as contracts instead of guesses is.",
      author: mara.name,
      authorId: mara._id,
      date: new Date("2026-08-04")
    },
    {
      title: "Your Headline Is Making a Promise. Keep It.",
      tag: "Notes",
      image: null,
      excerpt: "A good headline and a good opening paragraph should be arguing about the same thing. Most aren't.",
      content: "Here's a quick test: read your headline, then read your first paragraph. Do they agree on what the piece is actually about? Surprisingly often, they don't — the headline was written to be clever or to get a click, and the piece itself is doing something quieter and more specific.\n\nWhen that gap exists, readers feel misled even if nothing you wrote was technically false. The fix isn't to write duller headlines. It's to make sure the headline is a promise your first paragraph is already keeping.\n\nWrite the piece first. Let the headline come out of what you actually said, not the other way around.",
      author: mara.name,
      authorId: mara._id,
      date: new Date("2026-07-22")
    },
    {
      title: "What I Actually Needed to Launch a Blog: One Evening",
      tag: "Build",
      image: null,
      excerpt: "No CMS, no database, no build step. A text editor and the willingness to hit publish before it felt ready.",
      content: "I spent more time researching static site generators than I ever spent writing. Themes, plugins, deployment pipelines — all of it felt like progress, and none of it was a single word toward an actual post.\n\nWhat finally got something live was ignoring all of that. One HTML file, one evening, one post that wasn't perfect. Comments, search, tags — every feature I thought I needed on day one turned out to be something the blog could ask for later, once there was enough content to justify it.\n\nStart smaller than feels responsible. You can always add the scaffolding once you know what you're actually building around.",
      author: mara.name,
      authorId: mara._id,
      date: new Date("2026-07-09")
    }
  ]);

  console.log("Seeded database with demo user (mara@abbshblogs.dev / password123) and 3 posts.");
}

/* ---------- helpers ---------- */
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
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (cleanName.length < 2) return res.status(400).json({ error: "We'll need your full name first." });
    if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: "That doesn't look like a valid email." });
    if (!password || password.length < 6) return res.status(400).json({ error: "Give the password at least 6 characters." });

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ error: "That email already has a shelf here." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: cleanName, email: cleanEmail, passwordHash });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong creating your account." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(400).json({ error: "We couldn't match that email and password." });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong logging you in." });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(404).json({ error: "User not found." });
  }
});

/* ===========================================================
   POST ROUTES
   =========================================================== */

// GET /api/posts — public, newest first
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts.map((p) => p.toJSON()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load posts." });
  }
});

// GET /api/posts/:id — public (this is the "individual blog details" page)
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "That entry doesn't exist." });
    res.json(post.toJSON());
  } catch (err) {
    // an invalid/malformed id throws a CastError — treat it the same as "not found"
    res.status(404).json({ error: "That entry doesn't exist." });
  }
});

// POST /api/posts — create (auth required)
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { title, tag, image, content } = req.body || {};
    const cleanTitle = (title || "").trim();
    const cleanContent = (content || "").trim();
    const cleanTag = (tag || "General").trim();

    if (cleanTitle.length < 3) return res.status(400).json({ error: "Give your post a title (3+ characters)." });
    if (cleanContent.length < 20) return res.status(400).json({ error: "Write a little more before publishing (20+ characters)." });

    const post = await Post.create({
      title: cleanTitle,
      tag: cleanTag,
      image: image || null,
      excerpt: excerptOf(cleanContent),
      content: cleanContent,
      author: req.user.name,
      authorId: req.user.id,
      date: new Date()
    });

    res.status(201).json(post.toJSON());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not publish your post." });
  }
});

// PUT /api/posts/:id — edit (auth required, must be the owner)
app.put("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "That entry doesn't exist." });
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You can only edit your own posts." });
    }

    const { title, tag, image, content } = req.body || {};
    const cleanTitle = (title || "").trim();
    const cleanContent = (content || "").trim();
    const cleanTag = (tag || "General").trim();

    if (cleanTitle.length < 3) return res.status(400).json({ error: "Give your post a title (3+ characters)." });
    if (cleanContent.length < 20) return res.status(400).json({ error: "Write a little more before publishing (20+ characters)." });

    post.title = cleanTitle;
    post.tag = cleanTag;
    if (image !== undefined) post.image = image;
    post.excerpt = excerptOf(cleanContent);
    post.content = cleanContent;
    await post.save();

    res.json(post.toJSON());
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "That entry doesn't exist." });
  }
});

// DELETE /api/posts/:id — auth required, must be the owner
app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "That entry doesn't exist." });
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own posts." });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "That entry doesn't exist." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "not connected" });
});

app.listen(PORT, () => {
  console.log(`Abbsh Blogs backend running on http://localhost:${PORT}`);
});
