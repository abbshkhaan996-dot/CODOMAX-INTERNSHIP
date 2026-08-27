# Abbsh Blogs — Module 4 (CRUD Operations)

Full CRUD (Create, Read, Update, Delete) was already built and tested during
Module 2/3 — this module adds the optional extras: a live search bar on the
homepage, working alongside the existing category filter.

## What's new since Module 3

- `frontend/index.html` — added a search input next to the category dropdown
- `frontend/css/style.css` — styled the search box to match the existing design
- `frontend/js/blog.js` — search now filters posts live (title, excerpt,
  content, and author), combined with the category filter, with a small
  debounce so it's not searching on every keystroke
- Backend is unchanged — all CRUD routes (`GET/POST/PUT/DELETE /api/posts`)
  were already complete from Module 2/3

## CRUD feature checklist

- **Create** — Create Blog page → publish (`POST /api/posts`)
- **Read (all)** — homepage ledger (`GET /api/posts`)
- **Read (one)** — individual blog detail page (`GET /api/posts/:id`)
- **Update** — Dashboard → Edit on your own post (`PUT /api/posts/:id`)
- **Delete** — Dashboard → Delete on your own post (`DELETE /api/posts/:id`)
- **Search** — homepage search bar (new this module)
- **Category filter** — homepage dropdown + category tiles (already existed)


## Step 1 — Create a free MongoDB Atlas database

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a free "M0" cluster (takes a couple of minutes to spin up).
3. Under **Database Access**, create a database user with a username and password (write these down — you'll need them).
4. Under **Network Access**, click "Add IP Address" → "Allow Access from Anywhere" (fine for development/learning).
5. Once the cluster is ready, click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your actual database user credentials, and add `abbsh_blogs` as the database name right after `.net/`, like:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/abbsh_blogs?retryWrites=true&w=majority
   ```

## Step 2 — Set up your `.env` file

In the `backend` folder, copy `.env.example` to a new file named exactly `.env`, and paste in your real connection string:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/abbsh_blogs?retryWrites=true&w=majority
JWT_SECRET=make-up-any-long-random-string-here
PORT=5000
```
This file is already listed in `.gitignore` — it will never get pushed to GitHub, which is exactly what you want (your database password should never be public).

## Step 3 — Run it (same two-window routine as before)

**Window 1 — backend:**
```
cd backend
npm install
npm start
```
You should see:
```
Abbsh Blogs backend running on http://localhost:5000
Connected to MongoDB
Seeded database with demo user (mara@abbshblogs.dev / password123) and 3 posts.
```
(The "Seeded database" line only appears the very first time — after that, your data already exists.)

**Window 2 — frontend:**
```
cd frontend
npx http-server -p 8080
```
Open `http://localhost:8080` and test exactly like before — register, log in, publish, view an individual post, edit, delete.

## Troubleshooting

- **"MongoDB connection error"** in the backend window — double check your `MONGODB_URI` in `.env`: username/password typos are the most common cause. Also confirm your IP is allowed under Network Access in Atlas.
- **Nothing shows up on the homepage** — check the backend window is actually running and shows "Connected to MongoDB."
- Want to see your actual data? In MongoDB Atlas, click **Browse Collections** on your cluster — you'll see `users` and `posts` collections with real documents in them.

## Notes

- Passwords are still hashed with bcrypt before being saved — same as before, now stored in MongoDB instead of a JSON file.
- Post and user IDs are now MongoDB's own IDs (a 24-character string) instead of the old `p1`/`u1` style — this doesn't require any change on your end, the frontend already works with whatever ID format the backend sends.
- If you ever want to wipe your data and reseed, just delete the `users` and `posts` collections in Atlas's "Browse Collections" view, then restart the server.
