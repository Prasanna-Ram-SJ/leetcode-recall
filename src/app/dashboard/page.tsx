import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { SetupNotice } from "@/components/SetupNotice";
import { DashboardClient } from "@/components/DashboardClient";
import { getUserLocalDate } from "@/lib/scheduler";
import { emailToFallbackUsername } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, timezone")
    .eq("id", user.id)
    .single();

  const username =
    profile?.username ||
    user.user_metadata?.username ||
    emailToFallbackUsername(user.email || "") ||
    "User";
  const userTimezone = profile?.timezone || "UTC";
  const todayDate = getUserLocalDate(userTimezone);

  // 2. Fetch problems in library count
  const { count: problemsCount } = await supabase
    .from("problems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // 3. Fetch recall lists
  const { data: rawLists } = await supabase
    .from("recall_lists")
    .select("id, name, daily_target, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listsWithCounts = await Promise.all(
    (rawLists || []).map(async (list: {
      id: string;
      name: string;
      daily_target: number;
      is_active: boolean;
      created_at: string;
    }) => {
      // Problem count in this list
      const { count: problemCount } = await supabase
        .from("recall_list_problems")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id);

      // Check if today's batch exists
      const { data: batch } = await supabase
        .from("daily_batches")
        .select("id")
        .eq("list_id", list.id)
        .eq("batch_date", todayDate)
        .maybeSingle();

      let todayDue = 0;
      let todayCompleted = 0;

      if (batch) {
        const { data: batchItems } = await supabase
          .from("daily_batch_items")
          .select("is_completed")
          .eq("batch_id", batch.id);

        if (batchItems) {
          todayCompleted = batchItems.filter((i: { is_completed: boolean }) => i.is_completed).length;
          todayDue = batchItems.length - todayCompleted;
        }
      } else if (list.is_active && (problemCount || 0) > 0) {
        // If batch not yet opened today, the potential due is up to daily_target
        todayDue = Math.min(list.daily_target, problemCount || 0);
      }

      return {
        id: list.id,
        name: list.name,
        daily_target: list.daily_target,
        is_active: list.is_active,
        created_at: list.created_at,
        problem_count: problemCount || 0,
        today_due: todayDue,
        today_completed: todayCompleted,
      };
    })
  );

  const todayDueTotal = listsWithCounts
    .filter((l) => l.is_active)
    .reduce((sum, l) => sum + l.today_due, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar username={username} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <SetupNotice />
        <DashboardClient
          username={username}
          problemsCount={problemsCount || 0}
          initialLists={listsWithCounts}
          todayDueTotal={todayDueTotal}
          userTimezone={userTimezone}
        />
      </main>
    </div>
  );
}
