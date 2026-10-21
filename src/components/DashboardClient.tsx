"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasteProblemForm } from "@/components/PasteProblemForm";
import {
  BookOpen,
  Calendar,
  Play,
  Pause,
  Plus,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface DashboardProps {
  username: string;
  problemsCount: number;
  initialLists: {
    id: string;
    name: string;
    daily_target: number;
    is_active: boolean;
    created_at: string;
    problem_count: number;
    today_due: number;
    today_completed: number;
  }[];
  todayDueTotal: number;
  userTimezone: string;
}

export function DashboardClient({
  username,
  problemsCount: initialProblemsCount,
  initialLists,
  todayDueTotal: initialTodayDueTotal,
  userTimezone,
}: DashboardProps) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [problemsCount, setProblemsCount] = useState(initialProblemsCount);
  const [todayDueTotal, setTodayDueTotal] = useState(initialTodayDueTotal);

  // New list modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListTarget, setNewListTarget] = useState(3);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Toggle active/pause for a list
  const toggleListActive = async (listId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const supabase = createClient();
      const { error } = await supabase
        .from("recall_lists")
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", listId);

      if (error) throw error;

      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, is_active: nextStatus } : l))
      );
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to toggle list:", err);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsCreatingList(true);
    setCreateError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("recall_lists")
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          daily_target: Math.max(1, newListTarget),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewListName("");
      setNewListTarget(3);
      if (data) {
        router.push(`/lists/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create list.");
    } finally {
      setIsCreatingList(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Logged in as <strong className="text-slate-800 dark:text-zinc-200">@{username}</strong> &bull; Timezone: {userTimezone}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-yellow px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Recall List
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1: Problems in library */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Problems in library</span>
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {problemsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Links you&apos;ve added as solved. (Not verified against LeetCode)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Manage library <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Today's due count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Due Today</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {todayDueTotal}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Uncompleted recall problems across active lists for today.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Calendar batch for {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Lists */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recall Lists</span>
            <RotateCcw className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {lists.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {lists.filter((l) => l.is_active).length} active, {lists.filter((l) => !l.is_active).length} paused
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            <Link
              href="/lists"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              View all lists <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Paste Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Quick Add Solved Problem
        </h2>
        <PasteProblemForm
          onProblemsAdded={() => {
            setProblemsCount((prev) => prev + 1);
            router.refresh();
          }}
        />
      </div>

      {/* Recall Lists Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Your Recall Lists
          </h2>
          {lists.length > 0 && (
            <Link
              href="/lists"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Manage Lists
            </Link>
          )}
        </div>

        {lists.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">No recall lists yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Create your first recall list to start receiving stable, shuffled daily batches of problems to review.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-yellow px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create your first list
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/lists/${list.id}`}
                      className="font-black text-base text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 line-clamp-1"
                    >
                      {list.name}
                    </Link>
                    <button
                      onClick={() => toggleListActive(list.id, list.is_active)}
                      title={list.is_active ? "Pause list" : "Resume list"}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors ${
                        list.is_active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-300"
                      }`}
                    >
                      {list.is_active ? (
                        <>
                          <Play className="w-3 h-3 fill-current" /> Active
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 fill-current" /> Paused
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 dark:text-zinc-400 mt-2">
                    <p>
                      <strong>{list.problem_count}</strong> problems in list &bull; Target:{" "}
                      <strong>{list.daily_target}</strong>/day
                    </p>
                    <p>
                      Today:{" "}
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {list.today_completed} completed, {list.today_due} remaining
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <Link
                    href={`/lists/${list.id}`}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Open list <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Create New Recall List
            </h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Dynamic Programming, Blind 75"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Daily Target (Problems per day)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newListTarget}
                  onChange={(e) => setNewListTarget(parseInt(e.target.value) || 3)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Default is 3. Determines how many problems rotate into your daily batch.
                </p>
              </div>

              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{createError}</p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingList || !newListName.trim()}
                  className="btn-yellow px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isCreatingList ? "Creating..." : "Create List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
