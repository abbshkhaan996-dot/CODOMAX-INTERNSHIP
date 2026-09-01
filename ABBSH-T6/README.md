# Abbsh Blogs

A full-stack blogging platform where users can create an account, write and publish blog posts under a category, browse and search everyone's posts, and manage their own posts from a personal dashboard.

**Live demo:** _add your deployed URL here after deployment_
**Repository:** _add your GitHub link here_

---

## Features

- Account registration and login, secured with JWT authentication and bcrypt password hashing
- Publish, read, edit, and delete blog posts (full CRUD)
- Individual post pages with live data from the database
- Live search across post titles, content, and authors
- Browse by category, with a category filter and category tiles
- Personal dashboard showing only your own posts, with stats (post count, word count, latest post)
- Editable user profile: update your name, change your password, log out
- Fully responsive layout, from desktop down to small phone screens

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, via Mongoose |
| Auth | JWT (JSON Web Tokens), bcrypt |

## Project structure

```
backend/
  server.js            — Express app, all API routes
  models/
    User.js             — Mongoose schema for user accounts
    Post.js             — Mongoose schema for blog posts
  .env.example          — template for required environment variables
frontend/
  index.html, login.html, register.html,
  dashboard.html, create-blog.html, post.html, profile.html
  css/style.css
  js/
    app.js               — shared logic: API calls, auth/session, nav
    auth.js               — login/register form handling
    blog.js                — all page-specific rendering logic
```

## API reference

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Log in, returns a JWT |
| GET | `/api/auth/me` | Yes | Get the current user's profile |
| PUT | `/api/auth/me` | Yes | Update name and/or password |
| GET | `/api/posts` | No | Get all posts |
| GET | `/api/posts/:id` | No | Get a single post |
| POST | `/api/posts` | Yes | Create a post |
| PUT | `/api/posts/:id` | Yes (owner only) | Edit a post |
| DELETE | `/api/posts/:id` | Yes (owner only) | Delete a post |

## Running it locally

**1. Backend**
```
cd backend
npm install
cp .env.example .env
# fill in your own MongoDB connection string and a JWT secret in .env
npm start
```

**2. Frontend** (separate terminal)
```
cd frontend
npx http-server -p 8080
```

Then open `http://localhost:8080`.

## Environment variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string (see `.env.example`) |
| `JWT_SECRET` | Any long random string, used to sign login tokens |
| `PORT` | Port for the backend server (defaults to 5000) |

## Deployment

The backend and frontend are deployed separately:
- **Backend** — deployed as a Node web service (Render/Railway/similar), with `MONGODB_URI` and `JWT_SECRET` set as environment variables on the hosting platform
- **Frontend** — deployed as a static site (Netlify/Vercel), with `API_BASE` in `js/app.js` pointed at the live backend URL

## What changed in this final module

- Fixed: the homepage's "Start writing" button now correctly goes to Create Blog for logged-in users, instead of always sending them to registration
- Fixed: the search bar is now fluid-width instead of fixed, so it no longer crowds the layout on narrow phone screens
- Fixed: form cards (login, register, create post) now have tighter, better-fitted padding on small phones (under 480px wide)
- Added: this consolidated, professional README

## Author

Built by Asma Khan as part of a Full Stack Web Development internship.
