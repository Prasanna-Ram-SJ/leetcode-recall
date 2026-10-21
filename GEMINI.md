# Antigravity Project Instructions

Build this workspace into a complete, usable LeetCode recall web app. Do not stop at a visual mockup or a partially wired prototype.

@[Project guidelines](./GUIDELINES.md)

Before changing files, inspect the existing workspace and preserve useful work. Follow the product, security, URL parsing, scheduling, and deployment requirements in GUIDELINES.md. Use current official documentation for the app's framework and Supabase; do not invent undocumented integrations.

LeetCode data rules:
- Do not use any LeetCode API, third-party LeetCode API, scraping, browser automation, page fetch, GraphQL endpoint, cookie, or LeetCode credential.
- Add problems only from a LeetCode problem URL the user pastes. Parse the URL locally, derive the problem slug and a readable editable title, canonicalize the link, and save it to that user's solved-problem library. The user's paste is their assertion that they solved it; do not claim the app verifies completion.
- Recall lists can select only problems already in that signed-in user's library.

Security and delivery rules:
- Never store passwords in application tables or expose Supabase secret/service-role keys in browser code.
- Use Supabase Row Level Security to isolate every user's data.
- Keep the app functional within the stated free-tier assumptions. Do not add paid runtime services, cron jobs, or a custom-domain dependency.
- When a required account setting or secret is unavailable, finish all work possible locally, leave clear placeholders, document the exact dashboard action needed, and never claim deployment succeeded.

Implement and verify the working app, database setup, and beginner-friendly setup documentation described in GUIDELINES.md.
