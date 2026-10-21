import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";
import { SetupNotice } from "@/components/SetupNotice";
import { Navbar } from "@/components/Navbar";
import { CheckCircle2, RotateCcw, ShieldCheck, Zap } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar username={null} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <SetupNotice />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Private Spaced Recall for Problem Solvers
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.15]">
              Master LeetCode by{" "}
              <span className="text-amber-500 underline decoration-amber-400/40">
                recalling
              </span>{" "}
              what you already solved.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed">
              Never forget an algorithmic pattern again. Paste problem links as you solve them, create custom recall lists, and get a stable, shuffled daily rotation without repeats.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Non-Repeating Cycles
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Every problem is served exactly once per cycle before reshuffling.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Instant Link Pasting
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    No scraping or API keys. Paste problem links and titles are extracted locally.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Private & Isolated
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Your library and schedules are locked to your account with Supabase RLS.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Stable Daily Batches
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Batches remain locked throughout your calendar day in your timezone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Combined Login / Signup Form */}
          <div className="lg:col-span-5">
            <AuthForm />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-zinc-800 py-6 text-center text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>LeetCode Recall &mdash; Private spaced repetition for solved problems.</span>
          <span>Not affiliated with or endorsed by LeetCode.</span>
        </div>
      </footer>
    </div>
  );
}
