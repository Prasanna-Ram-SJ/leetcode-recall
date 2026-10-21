import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { SetupNotice } from "@/components/SetupNotice";
import { ListDetailsClient } from "@/components/ListDetailsClient";
import { getUserLocalDate, calculateNextDailyBatch, shuffleArray } from "@/lib/scheduler";
import { emailToFallbackUsername } from "@/lib/auth-helpers";

interface ListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ListDetailsPage({ params }: ListPageProps) {
  const { id } = await params;
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

  // 2. Fetch list
  const { data: list, error: listError } = await supabase
    .from("recall_lists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (listError || !list) {
    notFound();
  }

  // 3. Fetch all list problems
  const { data: rawListProblems } = await supabase
    .from("recall_list_problems")
    .select("id, problem_id, problems(*)")
    .eq("list_id", id);

  const listProblems = (rawListProblems || []).map((lp: any) => ({
    id: lp.id,
    problem: lp.problems,
  }));

  const listProblemIds = listProblems.map((lp) => lp.problem.id);

  // 4. Fetch all library problems for user
  const { data: allLibraryProblems } = await supabase
    .from("problems")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 5. Materialize or retrieve today's batch
  let batchItems: any[] = [];
  let currentCycleNumber = 1;
  let servedInCycleCount = 0;
  let totalInCycleCount = listProblemIds.length;

  // First check if stored RPC materialize_daily_batch works
  const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
    "materialize_daily_batch",
    {
      p_list_id: id,
      p_batch_date: todayDate,
    }
  );

  if (!rpcError && rpcData && rpcData.items) {
    batchItems = rpcData.items;
  } else {
    // Fallback: server-side batch generation using calculateNextDailyBatch
    const { data: existingBatch } = await supabase
      .from("daily_batches")
      .select("id, cycle_id")
      .eq("list_id", id)
      .eq("batch_date", todayDate)
      .maybeSingle();

    if (existingBatch) {
      const { data: items } = await supabase
        .from("daily_batch_items")
        .select("id, batch_id, problem_id, position, is_completed, completed_at, problems(title, slug, canonical_url)")
        .eq("batch_id", existingBatch.id)
        .order("position", { ascending: true });

      batchItems = (items || []).map((i: any) => ({
        id: i.id,
        batch_id: i.batch_id,
        problem_id: i.problem_id,
        position: i.position,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
        title: i.problems?.title || "",
        slug: i.problems?.slug || "",
        canonical_url: i.problems?.canonical_url || "",
      }));
    } else if (list.is_active && listProblemIds.length > 0) {
      // Find current active cycle
      const { data: currentCycle } = await supabase
        .from("list_cycles")
        .select("id, cycle_number, is_current")
        .eq("list_id", id)
        .eq("is_current", true)
        .order("cycle_number", { ascending: false })
        .maybeSingle();

      let cycleId = currentCycle?.id;
      let cycleNumber = currentCycle?.cycle_number || 1;

      // Fetch cycle items
      let cycleItems: any[] = [];
      if (cycleId) {
        const { data: items } = await supabase
          .from("cycle_items")
          .select("problem_id, position, is_served")
          .eq("cycle_id", cycleId);
        cycleItems = items || [];
      }

      // Run scheduling engine
      const scheduleResult = calculateNextDailyBatch({
        isActive: list.is_active,
        hasBatchForDate: false,
        currentCycle: cycleId
          ? {
              cycleNumber,
              isCurrent: true,
              items: cycleItems.map((ci) => ({
                problemId: ci.problem_id,
                position: ci.position,
                isServed: ci.is_served,
              })),
            }
          : null,
        listProblemIds,
        dailyTarget: list.daily_target,
      });

      if (scheduleResult.shouldGenerateBatch && scheduleResult.batchProblemIds.length > 0) {
        // If brand new cycle was created
        if (scheduleResult.isNewCycleCreated && scheduleResult.newCycleOrder) {
          if (cycleId) {
            await supabase
              .from("list_cycles")
              .update({ is_current: false, completed_at: new Date().toISOString() })
              .eq("id", cycleId);
            cycleNumber += 1;
          }

          const { data: newCycle } = await supabase
            .from("list_cycles")
            .insert({
              list_id: id,
              user_id: user.id,
              cycle_number: cycleNumber,
              is_current: true,
            })
            .select("id")
            .single();

          if (newCycle) {
            cycleId = newCycle.id;
            const cycleItemRows = scheduleResult.newCycleOrder.map((probId, pos) => ({
              cycle_id: cycleId,
              problem_id: probId,
              position: pos,
              is_served: false,
            }));
            await supabase.from("cycle_items").insert(cycleItemRows);
          }
        }

        if (cycleId) {
          // Insert daily batch
          const { data: newBatch } = await supabase
            .from("daily_batches")
            .insert({
              list_id: id,
              user_id: user.id,
              batch_date: todayDate,
              cycle_id: cycleId,
            })
            .select("id")
            .single();

          if (newBatch) {
            // Insert daily batch items
            const batchItemRows = scheduleResult.batchProblemIds.map((probId, pos) => ({
              batch_id: newBatch.id,
              problem_id: probId,
              position: pos,
              is_completed: false,
            }));
            await supabase.from("daily_batch_items").insert(batchItemRows);

            // Mark cycle items as served
            await supabase
              .from("cycle_items")
              .update({ is_served: true, served_batch_id: newBatch.id })
              .eq("cycle_id", cycleId)
              .in("problem_id", scheduleResult.batchProblemIds);

            if (scheduleResult.isCycleNowCompleted) {
              await supabase
                .from("list_cycles")
                .update({ is_current: false, completed_at: new Date().toISOString() })
                .eq("id", cycleId);
            }

            // Retrieve items with problem details
            const { data: items } = await supabase
              .from("daily_batch_items")
              .select("id, batch_id, problem_id, position, is_completed, completed_at, problems(title, slug, canonical_url)")
              .eq("batch_id", newBatch.id)
              .order("position", { ascending: true });

            batchItems = (items || []).map((i: any) => ({
              id: i.id,
              batch_id: i.batch_id,
              problem_id: i.problem_id,
              position: i.position,
              is_completed: i.is_completed,
              completed_at: i.completed_at,
              title: i.problems?.title || "",
              slug: i.problems?.slug || "",
              canonical_url: i.problems?.canonical_url || "",
            }));
          }
        }
      }
    }
  }

  // 6. Fetch cycle info for progress display
  const { data: latestCycle } = await supabase
    .from("list_cycles")
    .select("id, cycle_number")
    .eq("list_id", id)
    .order("cycle_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestCycle) {
    currentCycleNumber = latestCycle.cycle_number;
    const { count: served } = await supabase
      .from("cycle_items")
      .select("*", { count: "exact", head: true })
      .eq("cycle_id", latestCycle.id)
      .eq("is_served", true);
    servedInCycleCount = served || 0;

    const { count: totalInCycle } = await supabase
      .from("cycle_items")
      .select("*", { count: "exact", head: true })
      .eq("cycle_id", latestCycle.id);
    totalInCycleCount = totalInCycle || listProblems.length;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar username={username} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <SetupNotice />
        <ListDetailsClient
          list={list}
          initialBatchItems={batchItems}
          todayDate={todayDate}
          listProblems={listProblems}
          allLibraryProblems={allLibraryProblems || []}
          cycleInfo={{
            cycleNumber: currentCycleNumber,
            servedCount: servedInCycleCount,
            totalCount: totalInCycleCount,
          }}
        />
      </main>
    </div>
  );
}
