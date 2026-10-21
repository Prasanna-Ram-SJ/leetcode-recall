# LeetCode Recall — Complete Setup & Deployment Guide

This guide provides exact, beginner-friendly instructions for configuring **LeetCode Recall** with Supabase email & password authentication, email confirmation, custom SMTP email delivery, and Vercel hosting.

---

## Architecture & Security Overview

- **Standard Email & Password Authentication**: Users sign up with their actual email address, chosen username (display name), and password (minimum 8 characters).
- **Email Confirmation**: Supabase Auth verifies email ownership before account access.
- **Password Recovery**: Users can request a password reset email and set a new password via `/reset-password`.
- **Zero LeetCode Scraping or API Keys**: The app never connects to LeetCode APIs, uses credentials, or scrapes data. Pasting URLs extracts problem identifiers locally in the user's browser.
- **Row Level Security (RLS)**: All library entries, recall lists, cycles, and daily batches are isolated to the authenticated user ID (`auth.uid()`).
- **Free-Tier Friendly**: Operates within the free tiers of Supabase and Vercel.

---

## Step 1: Create a Free Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **"New Project"**.
3. Choose a name (e.g. `leetcode-recall`), set a strong database password, and choose your preferred hosting region.
4. Select the **Free plan**.
5. Click **"Create new project"** and wait ~1–2 minutes for the database to provision.

---

## Step 2: Configure Supabase Email & Password Auth

1. In the Supabase Dashboard, click **Authentication** in the left sidebar.
2. Under **Configuration**, click **Providers**.
3. Click on the **Email** provider:
   - Ensure **"Enable Email provider"** is **ON**.
   - Turn **"Confirm email"** to **OFF** (enables immediate signup and dashboard access without requiring email confirmation links).
   - Ensure **"Secure email change"** is enabled.
4. Click **Save** at the bottom of the Email section.

---

## Step 3: Configure Site URL and Redirect URLs

Supabase needs to know where to direct users when they click email confirmation links or password-reset links:

1. In **Authentication**, click on **URL Configuration**.
2. **Site URL**:
   - For local development: `http://localhost:3000`
   - When deployed to production: update this to your Vercel URL (e.g., `https://your-project.vercel.app`).
3. **Redirect URLs**:
   Click **"Add URL"** and add both local and production wildcards:
   - `http://localhost:3000/**`
   - `https://your-project.vercel.app/**`
4. Click **Save**.

---

## Step 4: Configure Custom SMTP Email Provider

### Important Information on Built-in Email vs. Custom SMTP
- **Built-in Supabase Email Sender**: Supabase provides a default email sender intended **only for development and testing**. It has a strict rate limit (~3–4 emails per hour) and may only deliver emails to addresses registered to your Supabase team/organization.
- **Custom SMTP Provider (Required for Real Users)**: To deliver confirmation and password-reset emails reliably to arbitrary users from any email domain (Gmail, Outlook, Yahoo, Apple, custom domains), you must connect a custom SMTP service. Popular options include **Resend**, **SendGrid**, **Postmark**, **AWS SES**, or **Brevo**.
- **Quotas & Delivery Limits**: Email delivery is not unlimited. Each third-party SMTP provider has its own free-tier or paid quotas, domain verification rules, and anti-abuse policies.

### Where to Enter SMTP Settings in Supabase
1. Obtain SMTP credentials from your email provider:
   - Host (e.g., `smtp.resend.com` or `smtp.sendgrid.net`)
   - Port (typically `587` or `465`)
   - Username (e.g., `resend` or `apikey`)
   - Password / API Key (generated in your SMTP provider dashboard)
   - Sender Email (e.g., `noreply@yourdomain.com`)
   - Sender Name (e.g., `LeetCode Recall`)
2. In the Supabase Dashboard, click **Project Settings** (gear icon at the bottom of the left sidebar).
3. Select **Authentication** from the settings menu.
4. Scroll down to the **SMTP Settings** card.
5. Toggle **"Enable Custom SMTP"** to **ON**.
6. Enter the Sender Email, Sender Name, Host, Port, Username, and Password.
7. Click **Save**.

> **CRITICAL SECURITY RULE:** Never put SMTP passwords, provider API keys, or email secrets into your frontend code, git repository, or environment files. Enter SMTP credentials **only** within the Supabase Dashboard.

---

## Step 5: Run the Database Schema & Profile Trigger

1. In the Supabase Dashboard, click **SQL Editor** on the left sidebar.
2. Click **"New query"**.
3. Open `supabase/schema.sql` from this repository.
4. Copy the entire file content and paste it into the SQL Editor.
5. Click **Run** (or press `Cmd/Ctrl + Enter`).
6. You will see `Success. No rows returned.` This script configures:
   - `profiles` table with unique usernames.
   - `problems`, `recall_lists`, `recall_list_problems`, `list_cycles`, `cycle_items`.
   - `daily_batches` and `daily_batch_items` with date uniqueness.
   - Row Level Security (RLS) policies on every table restricting access to `auth.uid()`.
   - The atomic `materialize_daily_batch` scheduling function.
   - The `on_auth_user_created` trigger that automatically creates the user's profile upon signup.

---

## Step 6: Configure Environment Variables

The application requires only two environment variables. Both are prefixed with `NEXT_PUBLIC_` and are safe to expose to browser code because all data access is guarded by Postgres Row Level Security:

| Variable | Where to find | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase &rarr; Project Settings &rarr; API &rarr; Project URL | URL of your Supabase instance. Public/safe. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase &rarr; Project Settings &rarr; API &rarr; Project API Keys (`anon` / `public`) | Public client API key. Safe for browser code (RLS-protected). |

> **Note:** Never add `SUPABASE_SERVICE_ROLE_KEY` or database passwords to environment variables exposed to the browser.

### Local Development Setup
1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Start the application:
   ```bash
   npm run dev
   ```

---

## Step 7: Deploy to Vercel (Hobby Free Plan)

1. Push your repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** &rarr; **"Project"** and import the repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Click **Deploy**.
6. Once deployed, copy your production domain (e.g., `https://your-app.vercel.app`) and update your **Site URL** and **Redirect URLs** in the Supabase Dashboard (Step 3).

---

## How to Restore a Paused Supabase Free Project

Supabase Free Tier projects pause automatically after 7 days of inactivity:

1. Log into [supabase.com/dashboard](https://supabase.com/dashboard).
2. Look for the project card showing **"Paused"**.
3. Click the **"Restore project"** button.
4. Supabase will restore and resume your database in 1–2 minutes. No data is lost.
