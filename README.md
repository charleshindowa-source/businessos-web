# MiKish Store — Retail Manager

All-in-one operations platform for small retail businesses — HR, attendance,
payroll, stock, sales, customer orders, invoicing, and financials for two
businesses (Root & Rinse and General Merchandise) in one shared, real-time
app. Built to run as a real website with its own address, syncing every
device through Firebase, installable on Android/iOS as a home-screen app —
and to keep working when that device loses signal.

## What's in this rebuild

- **Mobile-first Home dashboard** — a Daily/Weekly/Monthly toggle over
  Sales, Profit, Purchases, Expenses, Transactions, Other Income, and Net
  Cashflow, plus a Quick Actions grid into every part of the app and an
  Insights view (revenue trend, top products, stock alerts). The phone
  layout gets this dashboard, a bottom nav (Home / Multi Scan / Stock
  Scan), and a slide-out menu; wider screens keep the sidebar-based owner
  console.
- **Works offline, not just "installable"** — Firestore's persistent local
  cache is enabled, so the app opens with your last-synced data even with
  no signal, and anything you log while offline (a sale, a stock count)
  queues locally and syncs automatically the moment you're back online.
- **Multi Scan / Stock Scan** — global scan shortcuts from the bottom nav:
  Multi Scan keeps the camera open to ring up several items in a row into
  Sales; Stock Scan looks a product up and lets you adjust stock in/out on
  the spot.
- **A local AI Assistant** — answers quick questions ("today's sales",
  "low stock items", "who's checked in") straight from your data, entirely
  on-device — no API key, no network call, works offline.

- **Invoicing & receipts** — auto-numbered, printable invoices for customer
  orders (Orders → Invoice → Print/Save as PDF), pulling from a Business
  Profile you set once in Settings.
- **Barcode scanning in Sales**, not just Stock — scan a product straight
  into a sale line from Sales (owner) or the staff quick-entry sale form.
  Products now have a separate `barcode` field from their internal SKU.
- **Stronger security** — PINs (owner and staff) are salted-hashed, never
  stored or transmitted in plain text; Firestore/Storage access requires
  anonymous Firebase sign-in (see [Security](#security) below); repeated
  wrong PINs lock login for 30s; idle sessions auto-log-out after 20 min.
- **Expanded staff records** — ID/NIN number, date of birth, address,
  emergency contact, bank details, employment type, notes — saved per
  staff member alongside the existing role/pay/attendance data.
- **Dedicated Settings tab** — Owner PIN change, business profile for
  invoices, Orange Money number, backup/restore, and a plain-language
  summary of what's actually protecting your data.
- **GitHub Pages deploy pipeline** — push to `main` and a GitHub Actions
  workflow builds and deploys automatically. No Vercel/CLI step needed.

Everything from the previous version is still here: Staff, Attendance,
Payroll (Sierra Leone NASSIT/PAYE), Stock & Prices, Sales, Customer Orders
(WhatsApp-style messaging), Customers, Suppliers, WhatsApp Catalog export,
Income & Expenses, Profit & Loss, Balance Sheet, Budget vs Actual.

---

## Architecture

- **Frontend**: React 18 + Vite + Tailwind, organized as `src/lib` (data
  model, calculations, Firebase), `src/components` (shared UI), and
  `src/features/<area>` (one folder per tab/feature).
- **Backend**: Firebase — Firestore holds one shared document
  (`businessos/shared-data`) that every device reads/writes in real time;
  Storage holds product photos; Anonymous Authentication gates access to
  both (see Security).
- **Hosting**: static build (`npm run build` → `dist/`), deployed to
  GitHub Pages by `.github/workflows/deploy.yml`. No server to run or pay
  for beyond Firebase's free tier.

---

## Setup — local development

### 1. Install Node.js
Download the LTS version from **https://nodejs.org** if you don't have it.

### 2. Create your Firebase project (free)
1. Go to **https://console.firebase.google.com**, sign in, click **"Add
   project"**. Name it anything (e.g. `mikish-store`). Analytics is
   optional — you can turn it off.
2. Click the web icon (`</>`) to register a web app. Skip Firebase
   Hosting if asked.
3. Firebase shows you a `firebaseConfig` object with six values
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`). Keep this tab open.
4. Copy `.env.example` to `.env` in this project folder and paste the six
   values in, matching each `VITE_FIREBASE_*` name to the corresponding
   field. These values are not secret — see [Security](#security) — but
   `.env` is gitignored regardless, so nothing you paste there gets
   committed.

### 3. Turn on Firestore
1. Firebase console sidebar → **Build → Firestore Database → Create
   database**. Pick a nearby region, **"Start in test mode"**, Enable.
2. Go to the **Rules** tab, replace the contents with the contents of
   [`firestore.rules`](./firestore.rules) in this repo, and click
   **Publish**.
3. Sidebar → **Build → Authentication → Get started → Sign-in method →
   Anonymous → Enable**. This is what the rule in step 2 relies on — the
   app signs in anonymously the moment it loads, before touching your
   data.

### 4. Turn on Storage (for product photos)
1. Sidebar → **Build → Storage → Get started**, same region as Firestore.
2. Rules tab → paste the contents of [`storage.rules`](./storage.rules) →
   Publish.
3. Optional: if you skip this, everything else still works — you'll just
   get an "Upload failed" message if you try to add a product photo.

### 5. Install and run
```
npm install
npm run dev
```
Opens at `http://localhost:5173`. Log in with the owner PIN (`0000` by
default — **change this immediately** in Settings once you're in; the app
will nag you with a banner until you do). Test the barcode scanner (Stock
& Prices → camera icon, or Sales → camera icon) — it needs a real device
with a camera and, on some Android browsers, an HTTPS origin (works on
`localhost` in Chrome desktop; once deployed, GitHub Pages serves HTTPS
automatically).

---

## Deploy — GitHub Pages (automatic)

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds and deploys on every push to `main`. To turn it on:

1. **Add your Firebase config as repository secrets.** GitHub repo →
   **Settings → Secrets and variables → Actions → New repository
   secret**, one for each of the six names in `.env.example`
   (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.) with the
   same values you put in your local `.env`.
2. **Turn on Pages for this repo** (one-time, can't be automated from
   outside GitHub's UI): **Settings → Pages → Build and deployment →
   Source → GitHub Actions**.
3. **Push to `main`.** The workflow runs automatically — check the
   **Actions** tab for progress. When it finishes, your site is live at
   `https://<your-username>.github.io/<repo-name>/`. You can also trigger
   it manually from the Actions tab (**Deploy to GitHub Pages → Run
   workflow**) without waiting for a push.

Every future push to `main` redeploys automatically — no `vercel --prod`
or manual step needed.

### Installing on phones
Open the live URL in Chrome (Android) or Safari (iOS) → menu → **"Add to
Home Screen"** / **"Install app"**. It opens full-screen and behaves like
an installed app.

### Alternative: Vercel/Netlify
The build is a completely standard static Vite app (`npm run build` →
`dist/`), so it deploys to Vercel, Netlify, or any static host the same
way any Vite app does — connect the repo, set the same six env vars in
that host's dashboard, done. GitHub Pages is just what's wired up
automatically in this repo.

---

## Security

Being upfront about what this setup actually protects, and what it
doesn't — same spirit as the original honest note this README carried:

**What's better than a fully open database:**
- Firestore/Storage rules now require `request.auth != null` — a stranger
  who only finds your Firebase project ID (not secret, but discoverable)
  can no longer read or write your data without going through Firebase's
  own sign-in flow.
- Owner and staff PINs are salted, hashed (SHA-256 via the browser's Web
  Crypto API) client-side before they ever reach Firestore — even someone
  with direct database access can't read PINs back in plain text.
- Repeated wrong PINs lock the login screen for 30 seconds after 5
  attempts, slowing down brute-force guessing.
- A device left idle for 20 minutes automatically logs itself out — real
  exposure reduction for a shared counter/kiosk device.

**What this still isn't:**
- Anonymous auth is not per-user identity — every device that loads the
  app gets equivalent Firestore access; the PIN screen is the real "who
  are you" check, and it's enforced by the app's UI, not the database.
  Someone who reads the Firestore document directly (with valid anonymous
  auth) still sees everyone's data.
- There's no server-side validation of who's allowed to change what — a
  determined user with dev tools open could still write directly to
  Firestore if they have a valid (anonymous) session.
- For real per-person accounts with server-enforced permissions, the next
  step is Firebase Authentication with email/password or phone sign-in
  per staff member, plus Cloud Functions or more granular security rules
  keyed to `request.auth.uid`. That's a bigger change — ask if you want
  it built.

For a small internal tool run by a trusted team, this is a meaningfully
better baseline than the previous fully-open rules, without adding
login friction for staff on a shared device.

---

## Ongoing costs

Firebase's free "Spark plan" covers ~50,000 reads and ~20,000 writes per
day — a 5-person business logging attendance/sales/orders won't come
close. GitHub Pages is free for public repos. Realistically: **$0/month**
unless usage grows dramatically.

## If something breaks

- **"Can't connect to the database"** → check your `.env` (local) or
  repository secrets (deployed build) have real values, not blanks; check
  Firestore *and* Anonymous Authentication are both enabled (Setup steps
  2–3).
- **Changes not syncing between devices** → the app caches data locally and
  queues writes made offline, syncing automatically once a device is back
  online; if two devices are online but still not seeing each other's
  changes, check they're both pointed at the same Firebase project (same
  `.env` values).
- **Camera scanner doesn't open** → check the site's camera permission in
  your browser/phone settings; must be served over HTTPS (GitHub Pages is,
  automatically) except on `localhost`.
- **Locked out after wrong PINs** → wait 30 seconds; the lockout is
  per-browser (stored in `localStorage`), so a different device isn't
  affected.
- **Need to change Firebase config later** → update `.env` locally and/or
  the repository secrets, then push (or re-run the Actions workflow).
