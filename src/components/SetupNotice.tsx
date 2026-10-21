import Link from "next/link";
import { AlertTriangle, Key } from "lucide-react";

export function SetupNotice() {
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-anon-key";

  if (isConfigured) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 p-4 rounded-xl mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-amber-900 dark:text-amber-300">
            Supabase Credentials Required
          </p>
          <p className="text-slate-700 dark:text-zinc-300">
            Your application is running with placeholder configuration. To persist users and lists, please create a free Supabase project, run the database setup in <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">supabase/schema.sql</code>, and add your keys to <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">.env.local</code>.
          </p>
          <p className="pt-1">
            <Link
              href="/setup-instructions"
              className="inline-flex items-center gap-1.5 font-medium underline hover:text-amber-700 dark:hover:text-amber-300"
            >
              <Key className="w-3.5 h-3.5" />
              View Beginner Setup Instructions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
