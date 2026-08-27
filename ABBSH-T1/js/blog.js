function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function readingTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)) + " min read";
}

/* animate a number counting up, unless the user prefers reduced motion */
function animateCount(el, target) {
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || target === 0) { el.textContent = target; return; }
  const duration = 700;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- cover art: uploaded image, or a generated SVG illustration per category ---------- */
/* one vivid two-tone gradient per category, so the shelf reads as colorful rather than uniform */
const CATEGORY_PALETTE = {
  craft: ["#ff5a3c", "#ffb199"],
  build: ["#eb8f1f", "#ffd166"],
  notes: ["#5b5570", "#c9c2e0"],
  lifestyle: ["#2fae86", "#8fe9cf"],
  technology: ["#3457d5", "#8ea6ff"],
  travel: ["#0eb6c2", "#7fe3ea"],
  opinion: ["#a23e9c", "#e08ede"],
  business: ["#2c3e6b", "#6d84c9"],
  finance: ["#1f9d55", "#7de6a5"],
  health: ["#ff4d6d", "#ff9eb3"],
  food: ["#ff7a33", "#ffc27a"],
  sports: ["#1f7fd1", "#7ec4ff"],
  entertainment: ["#c0219b", "#ff7fd6"],
  science: ["#1c8fae", "#6fd6e8"],
  fashion: ["#d13a7a", "#ff9dc0"],
  education: ["#4353b0", "#96a4ff"],
  music: ["#7c3fd1", "#c39dff"],
  art: ["#ff5a3c", "#ffcd3c"],
  photography: ["#3a3a45", "#9aa0ad"],
  gaming: ["#5533c9", "#9d84ff"],
  environment: ["#1f9d55", "#8fe0a5"],
  politics: ["#7a5a2e", "#d1a95c"],
  relationships: ["#e0335f", "#ff8fae"],
  parenting: ["#1f9d8f", "#7fe0d3"],
  culture: ["#a2452e", "#e0a07f"],
  general: ["#4a4558", "#9891a8"]
};
/* fallback palette for any custom category an author types in */
const COVER_PALETTES = Object.values(CATEGORY_PALETTE);

/* simple, single-color line icons drawn in a 300x200 viewBox, centered around (150,100) */
const CATEGORY_ICONS = {
  craft: `<path d="M105 135 L185 55 L195 65 L115 145 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <path d="M185 55 L200 45 L195 65 Z" fill="#fbf6ec"/>
    <line x1="100" y1="140" x2="112" y2="128" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>`,
  build: `<rect x="95" y="90" width="110" height="20" rx="4" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <circle cx="95" cy="100" r="16" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="130" y1="100" x2="190" y2="100" stroke="#fbf6ec" stroke-width="4"/>`,
  notes: `<rect x="105" y="55" width="90" height="90" rx="4" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="120" y1="80" x2="180" y2="80" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="120" y1="98" x2="180" y2="98" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="120" y1="116" x2="160" y2="116" stroke="#fbf6ec" stroke-width="4"/>`,
  lifestyle: `<path d="M150 60 C185 70 190 110 150 140 C110 110 115 70 150 60 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <line x1="150" y1="70" x2="150" y2="135" stroke="#fbf6ec" stroke-width="3"/>`,
  technology: `<rect x="118" y="68" width="64" height="64" rx="6" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <rect x="136" y="86" width="28" height="28" fill="none" stroke="#fbf6ec" stroke-width="3"/>
    <line x1="150" y1="52" x2="150" y2="68" stroke="#fbf6ec" stroke-width="3"/>
    <line x1="150" y1="132" x2="150" y2="148" stroke="#fbf6ec" stroke-width="3"/>
    <line x1="102" y1="100" x2="118" y2="100" stroke="#fbf6ec" stroke-width="3"/>
    <line x1="182" y1="100" x2="198" y2="100" stroke="#fbf6ec" stroke-width="3"/>`,
  travel: `<circle cx="150" cy="100" r="42" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M150 78 L162 100 L150 122 L138 100 Z" fill="#fbf6ec"/>
    <circle cx="150" cy="100" r="4" fill="var(--paper, #f2ead9)"/>`,
  opinion: `<path d="M100 65 h100 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-62 l-22 20 v-20 h-16 a10 10 0 0 1 -10 -10 v-40 a10 10 0 0 1 10 -10 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="128" cy="100" r="4" fill="#fbf6ec"/><circle cx="150" cy="100" r="4" fill="#fbf6ec"/><circle cx="172" cy="100" r="4" fill="#fbf6ec"/>`,
  business: `<rect x="100" y="90" width="100" height="55" rx="6" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M125 90 v-15 a10 10 0 0 1 10 -10 h30 a10 10 0 0 1 10 10 v15" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="100" y1="115" x2="200" y2="115" stroke="#fbf6ec" stroke-width="3"/>`,
  finance: `<polyline points="95,140 130,105 155,125 205,70" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="178,70 205,70 205,97" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  health: `<path d="M150 138 C112 112 95 92 95 72 C95 55 108 45 122 45 C133 45 142 51 150 62 C158 51 167 45 178 45 C192 45 205 55 205 72 C205 92 188 112 150 138 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>`,
  food: `<line x1="112" y1="55" x2="112" y2="145" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <line x1="102" y1="55" x2="102" y2="82" stroke="#fbf6ec" stroke-width="3" stroke-linecap="round"/>
    <line x1="122" y1="55" x2="122" y2="82" stroke="#fbf6ec" stroke-width="3" stroke-linecap="round"/>
    <path d="M195 55 C183 55 176 66 176 82 C176 96 184 101 190 101 L190 145" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  sports: `<circle cx="150" cy="100" r="42" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M120 75 Q150 100 120 125" fill="none" stroke="#fbf6ec" stroke-width="3"/>
    <path d="M180 75 Q150 100 180 125" fill="none" stroke="#fbf6ec" stroke-width="3"/>`,
  entertainment: `<rect x="100" y="85" width="100" height="60" rx="4" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M100 85 L120 62 h84 l-18 23 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <line x1="132" y1="62" x2="112" y2="85" stroke="#fbf6ec" stroke-width="3"/>
    <line x1="162" y1="62" x2="142" y2="85" stroke="#fbf6ec" stroke-width="3"/>`,
  science: `<path d="M135 55 h30 v35 l25 45 a10 10 0 0 1 -9 15 h-62 a10 10 0 0 1 -9 -15 l25 -45 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <line x1="128" y1="100" x2="172" y2="100" stroke="#fbf6ec" stroke-width="3"/>`,
  fashion: `<path d="M150 62 a9 9 0 1 1 -7 14.5 l7 8.5 l58 32 h-116 l58 -32 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
  education: `<path d="M150 62 L212 90 L150 118 L88 90 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <path d="M115 100 v20 c0 8 15 15 35 15 s35 -7 35 -15 v-20" fill="none" stroke="#fbf6ec" stroke-width="3"/>
    <line x1="212" y1="90" x2="212" y2="120" stroke="#fbf6ec" stroke-width="3" stroke-linecap="round"/>`,
  music: `<circle cx="115" cy="130" r="14" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="129" y1="130" x2="129" y2="58" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M129 58 q32 6 32 32" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>`,
  art: `<circle cx="150" cy="100" r="42" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <circle cx="132" cy="86" r="6" fill="#fbf6ec"/><circle cx="168" cy="86" r="6" fill="#fbf6ec"/>
    <circle cx="126" cy="110" r="6" fill="#fbf6ec"/><circle cx="150" cy="122" r="6" fill="#fbf6ec"/>`,
  photography: `<rect x="98" y="80" width="104" height="66" rx="8" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M124 80 l8 -14 h36 l8 14" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="150" cy="113" r="20" fill="none" stroke="#fbf6ec" stroke-width="4"/>`,
  gaming: `<rect x="90" y="82" width="120" height="52" rx="26" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="118" y1="98" x2="118" y2="118" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <line x1="108" y1="108" x2="128" y2="108" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <circle cx="178" cy="102" r="5" fill="#fbf6ec"/><circle cx="190" cy="114" r="5" fill="#fbf6ec"/>`,
  environment: `<path d="M150 145 V95" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <path d="M150 100 C110 100 100 65 108 45 C140 50 155 75 150 100 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <path d="M150 115 C185 110 195 82 190 62 C160 68 148 92 150 115 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>`,
  politics: `<path d="M150 55 L200 78 L150 101 L100 78 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <line x1="118" y1="86" x2="118" y2="120" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <line x1="182" y1="86" x2="182" y2="120" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <line x1="100" y1="140" x2="200" y2="140" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>`,
  relationships: `<path d="M126 70 C110 70 98 82 98 98 C98 122 126 138 150 156 C174 138 202 122 202 98 C202 82 190 70 174 70 C162 70 152 78 150 88 C148 78 138 70 126 70 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>`,
  parenting: `<circle cx="118" cy="70" r="16" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <path d="M92 140 C92 112 102 98 118 98 C134 98 144 112 144 140" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linecap="round"/>
    <circle cx="182" cy="90" r="11" fill="none" stroke="#fbf6ec" stroke-width="3.5"/>
    <path d="M164 140 C164 120 172 110 182 110 C192 110 200 120 200 140" fill="none" stroke="#fbf6ec" stroke-width="3.5" stroke-linecap="round"/>`,
  culture: `<path d="M100 90 Q150 55 200 90 L200 100 Q150 65 100 100 Z" fill="none" stroke="#fbf6ec" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100 100 Q150 135 200 100" fill="none" stroke="#fbf6ec" stroke-width="4"/>
    <line x1="112" y1="100" x2="112" y2="130" stroke="#fbf6ec" stroke-width="3" stroke-linecap="round"/>
    <line x1="150" y1="105" x2="150" y2="140" stroke="#fbf6ec" stroke-width="3" stroke-linecap="round"/>
    <line x1="188" y1="100" x2="188" y2="130" stroke="#fbf6ec" stroke-width="3" stroke-linecap="round"/>`
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}

/* the full set of 25 categories the shelf always shows
   (this list matches the category dropdown in create-blog.html) */
const MASTER_CATEGORIES = [
  "Craft", "Build", "Notes", "Lifestyle", "Technology", "Travel", "Opinion",
  "Business", "Finance", "Health", "Food", "Sports", "Entertainment",
  "Science", "Fashion", "Education", "Music", "Art", "Photography",
  "Gaming", "Environment", "Politics", "Relationships", "Parenting", "Culture"
];

function categoryColor(category) {
  const key = category.trim().toLowerCase();
  const palette = CATEGORY_PALETTE[key] || COVER_PALETTES[hashString(key) % COVER_PALETTES.length];
  return palette[0];
}

function categoryImageSrc(category) {
  const key = category.trim().toLowerCase();
  const palette = CATEGORY_PALETTE[key] || COVER_PALETTES[hashString(key) % COVER_PALETTES.length];
  const icon = CATEGORY_ICONS[key];

  const iconMarkup = icon
    ? icon
    // unrecognized / custom category: a monogram of its first letter instead of a guessed icon
    : `<text x="150" y="118" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#fbf6ec" text-anchor="middle">${escapeHtml(category.trim().charAt(0).toUpperCase() || "?")}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette[0]}"/>
        <stop offset="1" stop-color="${palette[1]}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#g)"/>
    ${iconMarkup}
  </svg>`;

  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function coverThumbHtml(post) {
  const category = post.tag || "General";
  const src = post.image || categoryImageSrc(category);
  return `<div class="cover-thumb">
    <img src="${src}" alt="Cover image for ${escapeHtml(post.title)}">
    ${post.image ? "" : `<span class="cover-label">${escapeHtml(category)}</span>`}
  </div>`;
}

/* ---------- hero featured entry ---------- */
function renderFeaturedHero() {
  const el = document.getElementById("featured-card");
  if (!el) return;
  const posts = getPosts();
  if (posts.length === 0) { el.style.display = "none"; return; }
  const p = posts[0];
  el.innerHTML = `
    <a href="post.html?id=${p.id}" class="featured-link">
      ${coverThumbHtml(p)}
      <div class="featured-body">
        <p class="eyebrow">Latest entry · ${formatDate(p.date)} · ${readingTime(p.content)}</p>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.excerpt)}</p>
      </div>
    </a>
  `;
}

/* ---------- hero live stats ---------- */
function renderHeroStats() {
  const el = document.getElementById("hero-stats");
  if (!el) return;
  const posts = getPosts();
  const categories = new Set(posts.map(p => p.tag || "General")).size;
  const writers = new Set(posts.map(p => p.authorId)).size;
  el.textContent = `${posts.length} ${posts.length === 1 ? "entry" : "entries"} · ` +
    `${categories} ${categories === 1 ? "category" : "categories"} · ` +
    `${writers} ${writers === 1 ? "writer" : "writers"} on the shelf`;
}

/* ---------- browse-by-category shelf ---------- */
function renderCategoryShelf() {
  const el = document.getElementById("category-shelf");
  const section = document.getElementById("category-shelf-section");
  if (!el || !section) return;
  const posts = getPosts();

  const counts = {};
  posts.forEach(p => { const c = p.tag || "General"; counts[c] = (counts[c] || 0) + 1; });

  // always show the full set of 25 categories, plus any custom ones authors have added
  const allCategories = Array.from(new Set([...MASTER_CATEGORIES, ...Object.keys(counts)]));
  const topCategory = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

  const categories = allCategories.sort((a, b) => {
    const diff = (counts[b] || 0) - (counts[a] || 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  el.innerHTML = categories.map(c => {
    const count = counts[c] || 0;
    const color = categoryColor(c);
    const countLabel = count === 0
      ? "No stories yet"
      : `${count} ${count === 1 ? "story" : "stories"}`;
    return `
    <button type="button" class="category-tile" style="--tile-color: ${color};" data-category="${escapeHtml(c)}">
      ${c === topCategory && count > 0 ? `<span class="cat-badge" style="background:${color};">Popular</span>` : ""}
      <img src="${categoryImageSrc(c)}" alt="">
      <span class="cat-name">${escapeHtml(c)}</span>
      <span class="cat-count">${countLabel}</span>
    </button>
  `;
  }).join("");

  el.querySelectorAll(".category-tile").forEach(btn => {
    btn.addEventListener("click", () => {
      const filterSelect = document.getElementById("category-filter");
      if (filterSelect) filterSelect.value = btn.dataset.category;
      renderHomeLedger(btn.dataset.category);
      document.getElementById("ledger-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ---------- home (ledger of all posts) ---------- */
function renderHomeLedger(filterCategory) {
  const list = document.getElementById("ledger-list");
  if (!list) return;
  const allPosts = getPosts();

  const filterSelect = document.getElementById("category-filter");
  if (filterSelect && !filterSelect.dataset.wired) {
    const categories = Array.from(new Set([...MASTER_CATEGORIES, ...allPosts.map(p => p.tag || "General")])).sort();
    filterSelect.innerHTML = `<option value="all">All categories</option>` +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    filterSelect.dataset.wired = "true";
    filterSelect.addEventListener("change", () => renderHomeLedger(filterSelect.value));
  }

  const posts = (!filterCategory || filterCategory === "all")
    ? allPosts
    : allPosts.filter(p => (p.tag || "General") === filterCategory);

  if (allPosts.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>Nothing on the shelf yet</h3><p>Be the first to add something to it.</p></div>`;
    return;
  }
  if (posts.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>Nothing under "${escapeHtml(filterCategory)}" yet</h3><p>Pick another category, or write the first one.</p></div>`;
    return;
  }

  list.innerHTML = posts.map(p => `
    <a class="ledger-entry-link" href="post.html?id=${p.id}">
      <article class="ledger-entry">
        ${coverThumbHtml(p)}
        <div class="col-meta">
          <span class="date-stamp">${formatDate(p.date)}</span>
          <span class="tag" style="--tag-color: ${categoryColor(p.tag || "General")};">${escapeHtml(p.tag || "General")}</span>
          <span class="reading-time">${readingTime(p.content)}</span>
        </div>
        <div class="col-body">
          <h3>${escapeHtml(p.title)}</h3>
          <p class="excerpt">${escapeHtml(p.excerpt)}</p>
          <p class="by">by ${escapeHtml(p.author)}</p>
          <span class="read-link">Read entry →</span>
        </div>
      </article>
    </a>
  `).join("");
}

/* ---------- post detail page ---------- */
function renderPostDetail() {
  const el = document.getElementById("post-detail");
  if (!el) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const post = getPosts().find(p => p.id === id);

  if (!post) {
    el.innerHTML = `
      <div class="wrap">
        <div class="empty-state" style="margin:60px 0;">
          <h3>Can't find that entry</h3>
          <p>The author may have taken it down.</p><br>
          <a class="btn btn-accent" href="index.html">Back to the shelf</a>
        </div>
      </div>`;
    return;
  }

  document.getElementById("doc-title").textContent = `${post.title} — Abbsh Blogs`;
  const src = post.image || categoryImageSrc(post.tag || "General");

  el.innerHTML = `
    <article class="post-article">
      <div class="wrap">
        <a href="index.html" class="back-link">← Back to the shelf</a>
        <p class="eyebrow">${escapeHtml(post.tag || "General")} · ${formatDate(post.date)} · ${readingTime(post.content)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="post-byline">by ${escapeHtml(post.author)}</p>
      </div>
      <img src="${src}" alt="" class="post-hero-image">
      <div class="wrap post-body-wrap">
        <div class="post-body">${escapeHtml(post.content).split(/\n+/).map(p => `<p>${p}</p>`).join("")}</div>
      </div>
    </article>
  `;
}
function renderDashboard() {
  const list = document.getElementById("my-posts-list");
  if (!list) return; // not on the dashboard page — don't touch auth

  const user = requireAuth();
  if (!user) return;

  const nameEl = document.getElementById("dash-username");
  if (nameEl) nameEl.textContent = user.name.split(" ")[0];

  const avatarEl = document.getElementById("dash-avatar");
  if (avatarEl) avatarEl.textContent = user.name.trim().charAt(0).toUpperCase();

  const allPosts = getPosts();
  const myPosts = allPosts.filter(p => p.authorId === user.id);

  const totalEl = document.getElementById("stat-total");
  const wordsEl = document.getElementById("stat-words");
  const latestEl = document.getElementById("stat-latest");
  const totalWords = myPosts.reduce((sum, p) => sum + p.content.trim().split(/\s+/).filter(Boolean).length, 0);
  animateCount(totalEl, myPosts.length);
  animateCount(wordsEl, totalWords);
  if (latestEl) latestEl.textContent = myPosts.length ? formatDate(myPosts[0].date) : "—";

  /* category breakdown chart */
  const breakdownEl = document.getElementById("category-breakdown");
  if (breakdownEl) {
    if (myPosts.length === 0) {
      breakdownEl.style.display = "none";
    } else {
      breakdownEl.style.display = "block";
      const counts = {};
      myPosts.forEach(p => { const c = p.tag || "General"; counts[c] = (counts[c] || 0) + 1; });
      const maxCount = Math.max(...Object.values(counts));
      const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      breakdownEl.innerHTML = `<p class="category-breakdown-title">Your categories</p>` +
        categories.map(c => {
          const palette = COVER_PALETTES[hashString(c.toLowerCase()) % COVER_PALETTES.length];
          const pct = Math.round((counts[c] / maxCount) * 100);
          return `
            <div class="cat-bar-row">
              <span class="cat-bar-label">${escapeHtml(c)}</span>
              <span class="cat-bar-track"><span class="cat-bar-fill" style="width:${pct}%; background:linear-gradient(90deg, ${palette[0]}, ${palette[1]});"></span></span>
              <span class="cat-bar-count">${counts[c]}</span>
            </div>`;
        }).join("");
    }
  }

  if (myPosts.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>Your shelf is still bare</h3><p>Write your first entry — it only takes a minute.</p><br><a class="btn btn-accent" href="create-blog.html">Create Blog</a></div>`;
    return;
  }

  list.innerHTML = myPosts.map(p => {
    const palette = COVER_PALETTES[hashString((p.tag || "General").toLowerCase()) % COVER_PALETTES.length];
    return `
    <div class="post-row" data-id="${p.id}" style="--row-color:${palette[0]};">
      ${coverThumbHtml(p)}
      <div class="info">
        <h4>${escapeHtml(p.title)}</h4>
        <div class="meta">${formatDate(p.date)} · ${escapeHtml(p.tag || "General")} · ${readingTime(p.content)}</div>
      </div>
      <div class="actions">
        <a href="post.html?id=${p.id}" class="btn btn-outline btn-sm">View</a>
        <a href="create-blog.html?edit=${p.id}" class="btn btn-outline btn-sm">Edit</a>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${p.id}">Delete</button>
      </div>
    </div>`;
  }).join("");

  list.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this post? This can't be undone.")) return;
      const posts = getPosts().filter(p => p.id !== btn.dataset.id);
      savePosts(posts);
      renderDashboard();
    });
  });
}

/* ---------- create / edit blog ---------- */
function initCreateBlogForm() {
  const form = document.getElementById("create-form");
  if (!form) return; // not on the create-blog page — don't touch auth

  const user = requireAuth();
  if (!user) return;

  const editId = new URLSearchParams(window.location.search).get("edit");
  let editingPost = null;
  if (editId) {
    editingPost = getPosts().find(p => p.id === editId && p.authorId === user.id);
    if (!editingPost) { window.location.href = "dashboard.html"; return; }
  }

  const textarea = form.content;
  const counter = document.getElementById("char-count");
  const updateCounter = () => {
    counter.textContent = `${textarea.value.trim().split(/\s+/).filter(Boolean).length} words`;
  };
  if (textarea && counter) textarea.addEventListener("input", updateCounter);

  const categorySelect = form.category;
  const otherWrap = document.getElementById("other-category-wrap");
  const otherInput = form.categoryOther;
  const knownCategories = Array.from(categorySelect.options).map(o => o.value);
  if (categorySelect && otherWrap) {
    categorySelect.addEventListener("change", () => {
      const isOther = categorySelect.value === "Other";
      otherWrap.style.display = isOther ? "block" : "none";
      otherInput.required = isOther;
      if (!isOther) otherInput.value = "";
    });
  }

  /* image upload */
  const dropzone = document.getElementById("image-drop");
  const fileInput = document.getElementById("cover-image");
  const emptyState = document.getElementById("image-drop-empty");
  const previewWrap = document.getElementById("image-preview-wrap");
  const previewImg = document.getElementById("image-preview");
  const removeBtn = document.getElementById("image-remove");
  const imageError = document.getElementById("image-error");
  let coverImageData = null;

  function showImagePreview(dataUrl) {
    coverImageData = dataUrl;
    previewImg.src = dataUrl;
    emptyState.style.display = "none";
    previewWrap.style.display = "flex";
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", (e) => {
      if (e.target !== removeBtn) fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      imageError.classList.remove("show");

      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        imageError.textContent = "Please choose a PNG, JPG, or WEBP image.";
        imageError.classList.add("show");
        fileInput.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        imageError.textContent = "Image is too large — please choose one under 2MB.";
        imageError.classList.add("show");
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => showImagePreview(reader.result);
      reader.readAsDataURL(file);
    });

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      coverImageData = null;
      fileInput.value = "";
      previewWrap.style.display = "none";
      emptyState.style.display = "flex";
    });
  }

  /* prefill the form when editing an existing post */
  if (editingPost) {
    document.getElementById("page-eyebrow").textContent = "Edit entry";
    document.getElementById("page-title").textContent = "Give it another pass.";
    document.getElementById("page-sub").textContent = "Tweak whatever needs it — your changes save the moment you publish.";
    document.getElementById("submit-btn").textContent = "Save changes";

    form.title.value = editingPost.title;
    textarea.value = editingPost.content;
    updateCounter();

    if (knownCategories.includes(editingPost.tag)) {
      categorySelect.value = editingPost.tag;
    } else {
      categorySelect.value = "Other";
      otherWrap.style.display = "block";
      otherInput.required = true;
      otherInput.value = editingPost.tag;
    }

    if (editingPost.image) showImagePreview(editingPost.image);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    const title = form.title.value.trim();
    const content = form.content.value.trim();

    let tag = categorySelect ? categorySelect.value : "General";
    if (tag === "Other") {
      tag = otherInput.value.trim();
      if (tag.length < 2) return showFormError(msg, "Enter a name for your custom category.");
    }

    if (title.length < 3) return showFormError(msg, "Give your post a title (3+ characters).");
    if (content.length < 20) return showFormError(msg, "Write a little more before publishing (20+ characters).");

    const posts = getPosts();
    const excerpt = content.slice(0, 140).trim() + (content.length > 140 ? "…" : "");

    if (editingPost) {
      const idx = posts.findIndex(p => p.id === editingPost.id);
      posts[idx] = { ...posts[idx], title, tag, image: coverImageData, excerpt, content };
      savePosts(posts);
      msg.textContent = "Changes saved — heading to your dashboard.";
    } else {
      posts.push({
        id: "p" + Date.now(),
        title,
        tag,
        image: coverImageData,
        excerpt,
        content,
        author: user.name,
        authorId: user.id,
        date: new Date().toISOString().slice(0, 10)
      });
      savePosts(posts);
      msg.textContent = "It's live — heading to your dashboard.";
    }

    msg.className = "form-msg success show";
    setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
  });
}

function showFormError(msgEl, text) {
  msgEl.textContent = text;
  msgEl.className = "form-msg error show";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHomeLedger();
  renderCategoryShelf();
  renderHeroStats();
  renderDashboard();
  initCreateBlogForm();
  renderPostDetail();
});
