# The Trade Table

A mobile-first inventory tracker for the collectibles side hustle: baseball
cards, Star Wars toys, Magic: The Gathering cards, Legos, and whatever else
gets added to a category later. Tracks cost vs. value, photos, buyers and
their purchase history, how long items have been listed (and where), and a
metrics page for what sells fastest and best by category.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (the
   free tier is plenty to start).
2. Open **SQL Editor > New query**, paste in the contents of
   `supabase/schema.sql`, and run it. This creates all the tables and locks
   them down so only signed-in users can read or write anything.
3. Open **Storage** and create a new bucket named `item-photos`. Set it to
   **Public** (so photo URLs work directly in the app) — this is fine since
   photos aren't sensitive, but item names, buyer contact info, and sales
   stay protected because they're in the database, not Storage.
4. Open **Authentication > Users** and manually add an account for yourself
   and one for your husband (email + password). This is a two-person tool,
   so there's no public sign-up page — you just create the accounts once.
5. Open **Project Settings > API** and copy the **Project URL** and the
   **anon public** key — you'll need both next.

## 2. Run it locally

```bash
npm install
cp .env.example .env
# paste your Project URL and anon key into .env
npm run dev
```

Open the printed local URL, sign in with the account you created in step
4, and you're in.

## 3. Deploy it

The easiest path is [Vercel](https://vercel.com) or
[Netlify](https://netlify.com):

1. Push this folder to a GitHub repo.
2. Import it into Vercel/Netlify.
3. Add the same two environment variables from your `.env` file
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the project's
   environment variable settings.
4. Deploy. Add it to your phone's home screen for an app-like feel — it's
   built mobile-first.

## What's built

- **Inventory** — grid of items with cost vs. value, a photo, and a "shelf
  tag" that visually fades the longer an item has been listed (fresh = gold,
  stale = sun-bleached). Filter chips only show categories marked active.
- **Add item** — photo capture straight from the camera, category picker
  with inline "+ New category," cost/value, and multi-select for which
  sites it's listed on.
- **Item detail** — shows all active listings and how long each has been up,
  plus a "Mark as sold" flow that records the sale, price, site, and buyer
  (matching an existing buyer by name if there is one, so purchase history
  rolls up correctly).
- **Buyers** — list of everyone who's bought something, tap into anyone to
  see their full purchase history.
- **Settings** — toggle which categories show up as filter chips (doesn't
  touch existing data) and add brand-new categories.
- **Metrics** — average days-to-sell by category, which site each category
  sells best on, and which category is currently most popular — all computed
  from real sales data.

## What's intentionally left for a second pass

- Editing/deleting items and buyers (currently add + mark-sold only)
- Multiple photos per item (schema supports it via `item_photos`, only the
  first upload is wired into the UI)
- Deleting/archiving a category from Settings (currently add + hide only, per
  the "keep history, just retire it" decision)
- Push/email reminders for stale listings
