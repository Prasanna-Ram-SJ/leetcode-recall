# LeetCode Recall

> A private, accessible spaced-recall web application for problems you have solved on LeetCode.

LeetCode Recall helps software engineers and algorithm practitioners revisit solved problems consistently through deterministic, non-repeating shuffled daily cycles.

---

## Features

- **Standard Email & Password Authentication**:
  - Sign up with your email address, chosen username (display name), and password (minimum 8 characters).
  - Built-in email confirmation before account activation.
  - Self-service "Forgot password?" password reset flow with secure reset tokens.
  - Powered directly by Supabase Auth with passwords securely hashed and encrypted.
- **Local URL-Based Problem Ingestion**:
  - Paste single or multi-line LeetCode links with or without `https://`.
  - Zero external scraping or API calls. Slugs and readable titles are parsed and canonicalized locally in the browser.
  - Automatic duplicate detection and multi-paste breakdown (added, already present, invalid).
  - Editable display titles so you can refine problem naming anytime.
- **Custom Recall Lists & Daily Rotation**:
  - Group problems into focused lists (e.g. *Graphs*, *Dynamic Programming*, *Blind 75*).
  - Configure daily targets (default 3 problems/day).
  - Shuffled, non-repeating cycle scheduler. A 10-problem list with target 3 serves 3, 3, 3, then 1, and rolls over into a fresh cycle on the next active date.
  - Active and Paused list states.
  - Stable calendar-day batches respecting your device's IANA timezone.
- **Accessible Yellow & Dark/Light Theme**:
  - High-contrast warm yellow accent against crisp white in light mode and deep black in dark mode.
  - Keyboard accessible, screen-reader friendly, and visible focus rings.
- **Strict Row Level Security (RLS)**:
  - All library problems, lists, and schedules are strictly isolated to `auth.uid()`.
  - 100% Free-tier compatible with Supabase and Vercel.

---

## Tech Stack

- **Framework**: Next.js App Router (React 19, TypeScript)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase Postgres & Supabase SSR
- **Testing**: Vitest
- **Icons**: Lucide React

---

## Getting Started

1. Clone or navigate to this workspace:
   ```bash
   cd LeetCode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment:
   ```bash
   cp .env.example .env.local
   ```
   Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Apply the database schema in your Supabase SQL Editor:
   - Run the script located in `supabase/schema.sql`.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. [Open the website](https://leetcode-recall.vercel.app)

For full step-by-step dashboard instructions, see [SETUP.md](./SETUP.md).

---

## License

MIT
