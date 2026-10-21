import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { SetupNotice } from "@/components/SetupNotice";
import { LibraryClient } from "@/components/LibraryClient";
import { emailToFallbackUsername } from "@/lib/auth-helpers";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username =
    profile?.username ||
    user.user_metadata?.username ||
    emailToFallbackUsername(user.email || "") ||
    "User";

  const { data: problems } = await supabase
    .from("problems")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar username={username} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <SetupNotice />
        <LibraryClient initialProblems={problems || []} />
      </main>
    </div>
  );
}
