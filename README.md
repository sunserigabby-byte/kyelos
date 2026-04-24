# PR Cut Tracker 🌴

A shared Next.js app to track the Puerto Rico 10-Day Cut Protocol for Gabby and Jon. Installs as a PWA on mobile, live syncs across devices, and lets you see each other's progress in real time.

**Protocol runs April 23 → May 2, 2026.**

## Features

- 📱 **Installable PWA** — add to home screen on iPhone/Android, opens like a native app
- 🔄 **Live sync** — check off an item and the other device updates instantly
- 👥 **Partner view** — see both Gabby and Jon's stats side-by-side on the Progress page
- ✅ **Daily checklist** — AM cardio, meals, supplements, workout, all checkable
- 📝 **Check-in form** — weight, waist, sleep, energy, compliance, notes (auto-saves)
- 📊 **Progress page** — 10-day table with completion %, weight trend, notes summary
- 📳 **Haptic feedback** on mobile when you check items
- 🎨 **Blueprint Athletics branding** — navy + gold throughout

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Realtime)
- Vercel for hosting

## Setup — Step by Step

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com), click **New project**
2. Pick a name (e.g. `pr-cut-tracker`), set a database password, choose a region near you
3. Wait ~2 minutes for provisioning

### 2. Run the schema
1. In your Supabase dashboard, go to **SQL Editor** → **New query**
2. Copy the contents of `supabase/schema.sql` and paste it in
3. Click **Run**

### 3. Enable Realtime (if not already enabled by schema)
The schema tries to enable Realtime automatically. If you get an error on that line, you can ignore it — or manually enable it:
1. Go to **Database** → **Replication**
2. Find the `supabase_realtime` publication
3. Toggle on `daily_logs` and `completions`

### 4. Get your API keys
1. In Supabase: **Settings** → **API**
2. Copy the **Project URL** and the **anon public** key

### 5. Set up local environment
```bash
cp .env.example .env.local
```
Paste your Supabase URL + anon key into `.env.local`.

### 6. Run locally
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Deploy to Vercel
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add env vars in Vercel settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 8. Install to home screen

**iPhone (Safari):**
1. Open your Vercel URL in Safari
2. Tap the Share button (square with arrow up)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

**Android (Chrome):**
1. Open your Vercel URL in Chrome
2. Tap the three-dot menu
3. Tap **Install app** or **Add to Home Screen**
4. Follow prompts

Both of you do this on your own phones. The icon opens the app full-screen, no browser chrome.

## How to use it

- **Day 1 = April 23, 2026.** The app auto-detects today's day. Today is highlighted in gold on the day selector.
- **Toggle profiles** at the top-right (Gabby / Jon). Each device remembers which profile you're using.
- **Tap items** to check them off. Data saves instantly, syncs instantly to the other device.
- **Live indicator** (green pulse in top-left) shows when Realtime is connected.
- **Progress tab** shows the Partner View at top (both of you side-by-side with live updates), then your own 10-day table below.

## Data model

- **`daily_logs`** — one row per person per day (weight, waist, sleep, energy, compliance, notes)
- **`completions`** — tracks which items are checked (meals, supps, cardio, workout)

Both tables have Realtime enabled so changes broadcast to connected clients instantly.

## Notes

- No auth — simple profile toggle only. Don't share the URL publicly.
- Both devices hit the same Supabase backend, so data is shared.
- Haptic feedback works on devices that support `navigator.vibrate` (most Androids, not iPhones — iOS doesn't expose the API to browsers).
- To tweak meals, workouts, or supplements, edit `lib/plan-data.ts`.
