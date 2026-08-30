# Abbsh Blogs — Module 5 (Authentication & Dashboard)

## What was already done before this module

Built in Module 2 and unchanged since — confirmed still working:
- JWT authentication (login issues a signed token; every protected route verifies it)
- Protected dashboard routes — both the frontend page (redirects to login if signed out)
  and the backend API itself (rejects requests without a valid token)
- Dashboard shows only the logged-in user's own posts
- Logout (nav bar link)

## What's new in this module

- **Profile page** (`frontend/profile.html`) — view your name and email, change your
  name, change your password, or log out, all in one place
- **`PUT /api/auth/me`** (backend route) — updates your name and/or password;
  requires your current password to set a new one; if your name changes, every
  post you've already published is updated to show your new name as the author
- **Database seeding removed** — the app no longer auto-creates a demo account
  or sample posts. Every account and post from here on is a real one you created.

## How authentication actually works (short version)

Login doesn't create a session stored on the server. Instead, it returns a signed
JWT (JSON Web Token) containing your user ID, name, and email. Your browser sends
this token with every request afterward. The server verifies the token's signature
on each request — if it's valid, the server trusts the identity inside it, because
only the server could have created a validly-signed token in the first place.
This is why dashboard filtering (`authorId === your verified id`) can be trusted:
it's based on a cryptographic guarantee, not just what the browser claims.

## Running it

Same as always:
```
cd backend
npm install
# copy .env.example to .env and fill in your real MongoDB connection string
npm start
```
```
cd frontend
npx http-server -p 8080
```

Since seeding is removed, `npm start` will NOT create a demo account this time —
register a new one to test, exactly like a real first-time user would.

## Testing checklist for this module

1. Register a new account
2. Confirm you land on the dashboard, and it's empty (no demo posts)
3. Publish a post, confirm it appears in your dashboard
4. Go to Profile — change your name, save, confirm the nav bar updates immediately
5. Go back to your dashboard/post — confirm the author name updated there too
6. Change your password on the Profile page, log out, log back in with the NEW password
7. Try visiting dashboard.html, create-blog.html, or profile.html while logged out —
   confirm you're redirected to the login page every time
