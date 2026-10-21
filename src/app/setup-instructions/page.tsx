import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Key, Database, Globe, RefreshCw, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function SetupInstructionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar username={null} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            Beginner-Friendly Setup Guide
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Step-by-step instructions for setting up Supabase standard email/password authentication, email confirmation, custom SMTP delivery, and deploying to Vercel.
          </p>
        </div>

        {/* Step 1: Create Supabase Project */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Create a Free Supabase Project
            </h2>
          </div>
          <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-zinc-300 space-y-2">
            <li>
              Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 underline font-semibold">supabase.com</a> and sign in.
            </li>
            <li>Click <strong>&quot;New project&quot;</strong>, name it (e.g., <code>leetcode-recall</code>), set a strong database password, and select your preferred region.</li>
            <li>Wait 1–2 minutes for the database to finish provisioning.</li>
          </ol>
        </section>

        {/* Step 2: Configure Email/Password Auth & Enable Confirmation */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Configure Email Authentication &amp; Email Confirmation
            </h2>
          </div>
          <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-zinc-300 space-y-2">
            <li>In your Supabase dashboard, click <strong>Authentication</strong> on the left sidebar.</li>
            <li>Under Configuration, select <strong>Providers</strong> &rarr; click on <strong>Email</strong>.</li>
            <li>Ensure <strong>&quot;Enable Email provider&quot;</strong> is turned <strong>ON</strong>.</li>
            <li>Ensure <strong>&quot;Confirm email&quot;</strong> is turned <strong>ON</strong> so that new accounts must verify their email before sign-in.</li>
            <li>Click <strong>Save</strong> at the bottom.</li>
          </ol>
        </section>

        {/* Step 3: Configure Redirect URLs */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Set Site URL &amp; Redirect URLs (For Confirmation &amp; Password Reset)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300">
            Supabase Auth needs to know where to redirect users when they click confirmation or password-reset links:
          </p>
          <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-zinc-300 space-y-2">
            <li>In <strong>Authentication</strong> &rarr; click on <strong>URL Configuration</strong>.</li>
            <li>
              <strong>Site URL</strong>: Set to your development URL (<code>http://localhost:3000</code>) or your production domain (e.g. <code>https://your-app.vercel.app</code>).
            </li>
            <li>
              <strong>Redirect URLs</strong>: Click <strong>&quot;Add URL&quot;</strong> and add the following patterns:
              <ul className="list-disc pl-5 mt-1 space-y-1 font-mono text-[11px]">
                <li><code>http://localhost:3000/**</code></li>
                <li><code>https://your-app.vercel.app/**</code></li>
              </ul>
            </li>
            <li>Click <strong>Save</strong>.</li>
          </ol>
        </section>

        {/* Step 4: Custom SMTP Email Provider (Production Delivery) */}
        <section className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4 text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-300">
            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Configuring Custom SMTP (Essential for Sending Emails to Real Users)
          </div>
          <div className="space-y-2 text-slate-700 dark:text-zinc-300">
            <p>
              <strong>Important Notice on Built-in Email Sender:</strong> Supabase includes a default built-in email service strictly meant for initial development and testing. It has a very low rate limit (approximately 3–4 emails per hour) and may only deliver to emails registered to your Supabase organization.
            </p>
            <p>
              To reliably send signup confirmations and password-reset emails to public users, you must configure a custom SMTP service (such as Resend, SendGrid, Postmark, AWS SES, or Brevo):
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 dark:text-zinc-300">
              <li>In Supabase, navigate to <strong>Project Settings</strong> (gear icon) &rarr; <strong>Authentication</strong> &rarr; scroll down to <strong>SMTP Settings</strong>.</li>
              <li>Toggle <strong>&quot;Enable Custom SMTP&quot;</strong> to <strong>ON</strong>.</li>
              <li>Enter your provider&apos;s SMTP details:
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  <li><strong>Sender email</strong>: Your verified sender address (e.g., <code>noreply@yourdomain.com</code>)</li>
                  <li><strong>Sender name</strong>: <code>LeetCode Recall</code></li>
                  <li><strong>Host</strong>: Your provider&apos;s host (e.g., <code>smtp.resend.com</code>)</li>
                  <li><strong>Port</strong>: <code>587</code> or <code>465</code></li>
                  <li><strong>User</strong> &amp; <strong>Password</strong>: Generated from your SMTP provider dashboard</li>
                </ul>
              </li>
              <li>Click <strong>Save</strong>.</li>
            </ol>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-950 dark:text-red-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p>
                <strong>Security Rule:</strong> Never put SMTP passwords or provider API keys into your source code, Git repository, or frontend environment variables. Enter them directly into the Supabase Dashboard. Note that third-party email providers have their own delivery quotas and verification requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Step 5: Database Setup SQL */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              4
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Apply Database Schema &amp; Automatic Profile Trigger
            </h2>
          </div>
          <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-zinc-300 space-y-2">
            <li>In your Supabase dashboard, click <strong>SQL Editor</strong> on the left sidebar.</li>
            <li>Click <strong>&quot;New query&quot;</strong>.</li>
            <li>Copy the contents of <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">supabase/schema.sql</code> and paste it into the query editor.</li>
            <li>Click <strong>Run</strong>. This creates all tables, Row Level Security policies, the cycle rotation function, and the trigger that creates user profiles on signup.</li>
          </ol>
        </section>

        {/* Step 6: Environment Variables */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              5
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Environment Variables
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300">
            This app only requires two environment variables. Both use the <code>NEXT_PUBLIC_</code> prefix and are safe to expose to browser code because all database access is governed by Supabase Row Level Security:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-zinc-800 rounded-xl">
              <thead className="bg-slate-100 dark:bg-zinc-800/60 font-bold text-slate-700 dark:text-zinc-300">
                <tr>
                  <th className="p-2.5">Variable</th>
                  <th className="p-2.5">Where to find</th>
                  <th className="p-2.5">Security Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-400">
                <tr>
                  <td className="p-2.5 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">NEXT_PUBLIC_SUPABASE_URL</td>
                  <td className="p-2.5">Supabase &rarr; Project Settings &rarr; API &rarr; Project URL</td>
                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">Public / Safe</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
                  <td className="p-2.5">Supabase &rarr; Project Settings &rarr; API &rarr; Project API Keys &rarr; <code>anon</code> / <code>public</code></td>
                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">Public / Safe (Protected by RLS)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Place these into <code>.env.local</code> for local development, and into your Vercel Project Settings &rarr; Environment Variables for production deployment. Never expose the <code>service_role</code> secret key.
          </p>
        </section>

        {/* Paused Supabase Project Notice */}
        <section className="p-6 rounded-3xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <RefreshCw className="w-4 h-4 text-amber-500" />
            Restoring Paused Supabase Projects
          </div>
          <p>
            Supabase Free Tier projects pause after 7 days of inactivity. If paused, log into your Supabase dashboard and click <strong>&quot;Restore&quot;</strong>. Your database will resume in 1–2 minutes without any data loss.
          </p>
        </section>
      </main>
    </div>
  );
}
