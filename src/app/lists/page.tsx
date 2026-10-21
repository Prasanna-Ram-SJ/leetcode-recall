import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { SetupNotice } from "@/components/SetupNotice";
import { ListsOverviewClient } from "@/components/ListsOverviewClient";
import { emailToFallbackUsername } from "@/lib/auth-helpers";

export default async function ListsPage() {
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

  const { data: lists } = await supabase
    .from("recall_lists")
    .select("id, name, daily_target, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listsWithCounts = await Promise.all(
    (lists || []).map(async (list: {
      id: string;
      name: string;
      daily_target: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }) => {
      const { count } = await supabase
        .from("recall_list_problems")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id);

      return {
        ...list,
        problem_count: count || 0,
      };
    })
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar username={username} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <SetupNotice />
        <ListsOverviewClient initialLists={listsWithCounts} />
      </main>
    </div>
  );
}
