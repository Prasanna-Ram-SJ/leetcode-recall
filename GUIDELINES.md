# Project Guidelines — LeetCode Recall

## Product goal

Build a real, responsive website for a small noncommercial group to revisit LeetCode problems they have solved. A signed-out visitor lands on sign up or login. After authentication, each user maintains a private solved-problem library, creates recall lists from that library, and receives a stable daily batch from each active list.

The app does not connect to LeetCode. Pasting a problem URL is how a user records a problem as solved. The app does not verify the user's LeetCode identity or whether a problem was actually solved.

## Fixed stack and delivery

- Use Next.js App Router, TypeScript, and Tailwind CSS, with Supabase Postgres and Auth. Deploy on Vercel.
- Prefer current stable package versions and current official Supabase SSR/Next.js guidance. Keep the code understandable and avoid unnecessary services.
- The application must work without any LeetCode API, paid AI/API runtime, cron, external scheduler, or custom domain.
- Create an .env.example with placeholders only. Never commit real credentials. Use a Supabase URL and publishable/anon browser key; never expose a secret/service-role key to browser code.
- Provide a beginner-friendly SETUP.md with exact dashboard steps for creating/configuring Supabase, applying the database setup, setting environment variables, connecting the repository to Vercel, deploying, and restoring a paused Supabase project. State that no LeetCode API key is needed. Do not imply Antigravity can create accounts or supply secrets.

## Authentication and privacy

- Sign-up fields: username and password only. Login fields: username and password only. Do not collect a LeetCode username, email, or phone number.
- Username is 3–24 ASCII letters, numbers, or underscores. Normalize it to lowercase for identity and uniqueness; show the chosen spelling in the UI. Password minimum is eight characters.
- Supabase Auth password sign-in requires email or phone. Implement the requested email-free UI by mapping each normalized username deterministically to an internal synthetic address at the reserved .invalid domain, for example a normalized name followed by @auth.invalid. This is only an Auth identifier: never ask the user for it, display it, treat it as a contact address, or send mail to it. Disable email confirmation in Supabase setup instructions.
- Store passwords only in Supabase Auth. Do not create a password column or implement custom password hashing/authentication. Do not implement email/password reset, recovery codes, or account recovery. Explain at signup that a forgotten password cannot be recovered.
- Enforce case-insensitive unique usernames in the database as well as the UI. Do not create an endpoint that lists usernames or reveals whether an arbitrary username is registered.
- Use Supabase SSR session handling and protect authenticated routes. Add Row Level Security to every user-owned table. Policies must restrict reads and writes to rows owned by auth.uid(). Keep data access scoped by the authenticated user, including nested list/problem records. Never trust a user_id supplied by the browser when a database policy can derive ownership from auth.uid().
- No user can see or change another user's library, lists, schedule, or completion records. Keep public profile data to a minimum.
- Open signup means anyone who finds the URL can register. Do not add an invite-code gate. Use Supabase's normal auth protections and avoid exposing account-existence information.

## Adding solved problems from pasted URLs

There is no LeetCode API integration in this product. Do not make HTTP requests to LeetCode or any third-party service when a user pastes a URL.

Implement the add flow exactly as follows:

1. Provide a clearly labeled “Paste a LeetCode problem link” field on the user's Problem Library page. The field can also accept multiple links separated by newlines or commas.
2. When a user pastes a complete link, parse it locally in the browser. Accept links with or without the https:// prefix, but only accept hostnames leetcode.com and www.leetcode.com. Require a path containing /problems/{slug}; allow trailing path segments such as description and ignore query strings/fragments.
3. Extract the slug from the first path segment after problems. Normalize it to lowercase and validate it as letters, numbers, or hyphens. Reject profile, discuss, submission, and other non-problem links with a clear inline error. Do not navigate to or fetch the supplied link.
4. Build a canonical link as https://leetcode.com/problems/{slug}/. Derive the initial display title from the slug by replacing hyphens with spaces and applying readable title capitalization. Because slug capitalization does not guarantee the official title's capitalization, let the user edit the title after adding.
5. Treat a valid pasted link as the user's assertion that the problem is solved. Immediately save the normalized problem to that user's library, then show its derived title, canonical link, success notice, and edit-title action. If parsing or saving fails, keep the field contents and show a useful error. Clear the field after a successful add.
6. For a repeated slug in that user's library, do not create a second record; show “Already in your library.” Deduplicate by normalized slug. For a multi-link paste, process all links and report how many were added, already present, or invalid.
7. Never claim to have verified a problem title or solved status against LeetCode. Label the dashboard total “Problems in library,” since it counts only links the user added.

The library is private per user. Recall-list creation and editing must let the user choose only from that user's already-added library entries. If a library problem is deleted, remove it from that user's list memberships and future batches; do not affect any other user.

## Recall lists and daily scheduling

- Users can create, rename, and delete multiple recall lists. Each list contains distinct problems from that user's library, has a per-list positive-integer daily target defaulting to 3, and can be Active or Paused.
- Show due-today problems, list progress, and completion state. Let users mark each daily problem complete; completion is for tracking and does not alter the date-based rotation.
- Use a shuffled, persisted order for each cycle. A problem appears at most once in a cycle. Do not reshuffle on page refresh or when the same user opens the site on another device.
- For each active list and user-local calendar date, persist one daily batch before displaying it. Keep the same batch for the whole date. Save the IANA timezone from the user's signup device so the date is consistent across devices; use UTC only if a valid timezone cannot be obtained.
- Generate up to the configured target from the next unserved problems in the current shuffled cycle. If fewer remain, show only those remaining. Start a newly shuffled cycle on the next active date after the final partial batch; never append the next cycle to that same day's batch. If the list has fewer problems than the target, show each at most once that date.
- A missed date does not create catch-up batches. An active list advances by at most one batch on a date when opened, regardless of how many dates elapsed.
- Pausing a list creates no batches and consumes no problems. If a batch already exists for the current date, resuming that date shows the same batch. Otherwise resume from the next unserved problem.
- Persist cycle order, cycle position, daily batch, local date, and completion state in Supabase. Make daily batch creation atomic or safely idempotent under simultaneous requests from multiple devices. Enforce uniqueness for one batch per list/date.
- Empty lists show a useful prompt to add library problems and create no batch. For a ten-problem list with target three, the expected sequence is 3, 3, 3, then 1; a new shuffled cycle begins on the following active date.
- Changes to list membership must not repeat already served items within the current cycle. New items join the next cycle; removed items are omitted from future batches. Preserve existing daily assignments unless the user removes a problem from that list.

## User experience

- Use a warm yellow accent with white surfaces/background in light mode and yellow with black/dark-charcoal surfaces in dark mode. Use readable dark text on yellow surfaces; do not rely on low-contrast yellow text on white.
- Provide an accessible theme toggle. Respect the system preference on first visit and persist the user's selection locally.
- Make auth, dashboard, Problem Library, recall-list detail, and settings flows complete. Include loading, empty, success, and actionable error states. Provide confirmation before destructive list deletion.
- Show username, “Problems in library,” due-today count, and recall lists on the dashboard. Provide an obvious path to paste a link and add a problem, create a recall list, and start or pause each list.
- Use a polished, restrained interface that works on mobile and desktop, supports keyboard navigation, and has visible focus states and accessible labels.

## Engineering and verification

- Inspect the workspace before editing. Use clear components, typed data, server-side validation, and error handling. Keep application logic separate from presentation.
- Provide database SQL/migrations that create all required tables, indexes, uniqueness constraints, and RLS policies. Include any safe, authenticated database function needed to materialize a daily batch atomically. Document how a nontechnical owner applies it in Supabase.
- Add focused automated checks for username normalization/validation, LeetCode URL parsing/canonicalization/deduplication, date and cycle scheduling, daily idempotency, and access isolation where practical.
- Verify formatting/lint, type checking, automated checks, and a production build. Fix failures caused by the implementation. Also provide a short manual acceptance checklist covering two separate users, valid and invalid links, duplicate links, title edits, theme modes, the ten-problem schedule, and paused lists.
- Do not claim the hosted app is deployed unless that has been verified in the actual accounts.

## Official references

- Antigravity workspace rules and file includes: https://antigravity.google/docs/rules/
- Supabase password authentication: https://supabase.com/docs/guides/auth/passwords
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- LeetCode Terms of Service: https://leetcode.com/terms/
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Supabase Free project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
