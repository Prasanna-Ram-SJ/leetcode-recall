"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RecallList, SolvedProblem } from "@/types/database";
import {
  Play,
  Pause,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  X,
  Check,
} from "lucide-react";

interface BatchItemView {
  id: string;
  batch_id: string;
  problem_id: string;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  title: string;
  slug: string;
  canonical_url: string;
}

interface ListDetailsClientProps {
  list: RecallList;
  initialBatchItems: BatchItemView[];
  todayDate: string;
  listProblems: { id: string; problem: SolvedProblem }[];
  allLibraryProblems: SolvedProblem[];
  cycleInfo: {
    cycleNumber: number;
    servedCount: number;
    totalCount: number;
  };
}

export function ListDetailsClient({
  list: initialList,
  initialBatchItems,
  todayDate,
  listProblems: initialListProblems,
  allLibraryProblems,
  cycleInfo,
}: ListDetailsClientProps) {
  const router = useRouter();
  const [list, setList] = useState<RecallList>(initialList);
  const [batchItems, setBatchItems] = useState<BatchItemView[]>(initialBatchItems);
  const [listProblems, setListProblems] = useState(initialListProblems);

  // Edit list name / target
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editName, setEditName] = useState(list.name);
  const [editTarget, setEditTarget] = useState(list.daily_target);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add problems modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [isAddingProblems, setIsAddingProblems] = useState(false);

  // Delete list modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Problem completion toggle
  const toggleItemCompletion = async (itemId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic update
    setBatchItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              is_completed: nextStatus,
              completed_at: nextStatus ? new Date().toISOString() : null,
            }
          : item
      )
    );

    try {
      const supabase = createClient();
      await supabase
        .from("daily_batch_items")
        .update({
          is_completed: nextStatus,
          completed_at: nextStatus ? new Date().toISOString() : null,
        })
        .eq("id", itemId);
    } catch (err) {
      console.error("Failed to toggle completion:", err);
      // Revert on error
      setBatchItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_completed: currentStatus } : item
        )
      );
    }
  };

  // Toggle active/pause
  const toggleActiveStatus = async () => {
    const nextStatus = !list.is_active;
    setList((prev) => ({ ...prev, is_active: nextStatus }));

    try {
      const supabase = createClient();
      await supabase
        .from("recall_lists")
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", list.id);
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle active status:", err);
      setList((prev) => ({ ...prev, is_active: !nextStatus }));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingSettings(true);
    try {
      const supabase = createClient();
      const updatedTarget = Math.max(1, editTarget);
      const { error } = await supabase
        .from("recall_lists")
        .update({
          name: editName.trim(),
          daily_target: updatedTarget,
          updated_at: new Date().toISOString(),
        })
        .eq("id", list.id);

      if (error) throw error;

      setList((prev) => ({
        ...prev,
        name: editName.trim(),
        daily_target: updatedTarget,
      }));
      setIsEditingSettings(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Add problems to list
  const handleAddSelectedProblems = async () => {
    if (selectedToAdd.length === 0) return;
    setIsAddingProblems(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const rows = selectedToAdd.map((problemId) => ({
        list_id: list.id,
        problem_id: problemId,
        user_id: user.id,
      }));

      const { error } = await supabase.from("recall_list_problems").insert(rows);
      if (error) throw error;

      setShowAddModal(false);
      setSelectedToAdd([]);
      router.refresh();
    } catch (err) {
      console.error("Failed to add problems to list:", err);
    } finally {
      setIsAddingProblems(false);
    }
  };

  // Remove problem from list
  const handleRemoveProblem = async (membershipId: string, problemId: string) => {
    try {
      const supabase = createClient();
      // Remove from list problems
      const { error } = await supabase
        .from("recall_list_problems")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;

      // Update local state
      setListProblems((prev) => prev.filter((p) => p.id !== membershipId));

      // Remove from today's batch if present
      setBatchItems((prev) => prev.filter((item) => item.problem_id !== problemId));

      // Also remove unserved cycle items for this problem
      await supabase
        .from("cycle_items")
        .delete()
        .eq("problem_id", problemId)
        .eq("is_served", false);

      router.refresh();
    } catch (err) {
      console.error("Failed to remove problem from list:", err);
    }
  };

  // Delete list
  const handleDeleteList = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("recall_lists")
        .delete()
        .eq("id", list.id);

      if (error) throw error;

      router.push("/lists");
    } catch (err) {
      console.error("Failed to delete list:", err);
      setIsDeleting(false);
    }
  };

  // Filter library problems not already in this list
  const existingProblemIds = new Set(listProblems.map((lp) => lp.problem.id));
  const candidateLibraryProblems = allLibraryProblems.filter(
    (p) => !existingProblemIds.has(p.id)
  );

  const completedTodayCount = batchItems.filter((i) => i.is_completed).length;

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          href="/lists"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Recall Lists
        </Link>
      </div>

      {/* List Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            {isEditingSettings ? (
              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-black px-3 py-1 rounded-xl border border-amber-500 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Target:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editTarget}
                      onChange={(e) => setEditTarget(parseInt(e.target.value) || 1)}
                      className="w-16 text-sm font-bold px-2 py-1 rounded-xl border border-amber-500 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="p-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-600 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {list.name}
                </h1>
                <button
                  onClick={() => {
                    setEditName(list.name);
                    setEditTarget(list.daily_target);
                    setIsEditingSettings(true);
                  }}
                  title="Edit name and daily target"
                  className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Daily Target: <strong>{list.daily_target} problems/day</strong> &bull; Total Problems: <strong>{listProblems.length}</strong>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleActiveStatus}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                list.is_active
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-300"
              }`}
            >
              {list.is_active ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause List</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume List</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Delete list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shuffled Cycle Info Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Cycle {cycleInfo.cycleNumber || 1}:</strong> {cycleInfo.servedCount} of {cycleInfo.totalCount || listProblems.length} problems served in current rotation.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] opacity-80">
            Shuffled &bull; No repeats per cycle
          </span>
        </div>
      </div>

      {/* SECTION 1: TODAY'S DUE RECALL BATCH */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Today&apos;s Recall Batch
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Stable rotation for date <strong className="text-slate-700 dark:text-zinc-300">{todayDate}</strong>
            </p>
          </div>

          {batchItems.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                {completedTodayCount} of {batchItems.length} completed
              </span>
              <div className="w-24 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedTodayCount / batchItems.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Paused state */}
        {!list.is_active && batchItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
            <Pause className="w-8 h-8 mx-auto text-slate-400 dark:text-zinc-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              List is paused
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              No daily batches are served while this list is paused. Click &quot;Resume List&quot; when you are ready to continue your recall cycle.
            </p>
            <button
              onClick={toggleActiveStatus}
              className="btn-yellow px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm mt-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Rotation
            </button>
          </div>
        ) : listProblems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-300 dark:border-zinc-700 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-amber-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              No problems in this recall list
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Add problems from your library below to start generating daily recall batches.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-yellow px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Problems from Library
            </button>
          </div>
        ) : batchItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              All caught up for today!
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              No new problems due today. A new batch will rotate in tomorrow.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batchItems.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  item.is_completed
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-600 dark:text-zinc-400"
                    : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => toggleItemCompletion(item.id, item.is_completed)}
                    className="shrink-0 text-slate-400 hover:text-amber-500 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {item.is_completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-zinc-600 hover:text-amber-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`font-bold text-sm truncate ${
                        item.is_completed
                          ? "line-through text-slate-500 dark:text-zinc-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                      {item.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={item.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-yellow px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    Solve on LeetCode
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: LIST PROBLEMS MANAGEMENT */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Problems in this List ({listProblems.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Only problems from your private library can be added.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-yellow px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add from Library
          </button>
        </div>

        {listProblems.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-zinc-400 text-center py-6">
            No problems have been added to this list yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {listProblems.map((lp) => (
              <div
                key={lp.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-zinc-100">
                    {lp.problem.title}
                  </p>
                  <p className="text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
                    {lp.problem.slug}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={lp.problem.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Link <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleRemoveProblem(lp.id, lp.problem.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove from this recall list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Problems from Library Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Add Problems from Library
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select problems from your solved library to include in this recall list rotation:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {candidateLibraryProblems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                  All problems in your library are already in this list, or your library is empty.
                  <div className="pt-2">
                    <Link
                      href="/library"
                      className="text-amber-600 dark:text-amber-400 underline font-bold"
                    >
                      Paste new problems in your Library &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                candidateLibraryProblems.map((prob) => {
                  const isChecked = selectedToAdd.includes(prob.id);
                  return (
                    <label
                      key={prob.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white"
                          : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedToAdd((prev) => [...prev, prob.id]);
                          } else {
                            setSelectedToAdd((prev) => prev.filter((id) => id !== prob.id));
                          }
                        }}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{prob.title}</p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                          {prob.slug}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                {selectedToAdd.length} problem{selectedToAdd.length === 1 ? "" : "s"} selected
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedProblems}
                  disabled={isAddingProblems || selectedToAdd.length === 0}
                  className="btn-yellow px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isAddingProblems ? "Adding..." : "Add to List"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete List Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Delete Recall List?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">&quot;{list.name}&quot;</strong>? This cannot be undone. Problems will stay safe in your library.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete List"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
