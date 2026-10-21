"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  RotateCcw,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Loader2,
  Layers,
} from "lucide-react";

interface ListCardData {
  id: string;
  name: string;
  daily_target: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  problem_count: number;
}

interface ListsOverviewClientProps {
  initialLists: ListCardData[];
}

export function ListsOverviewClient({ initialLists }: ListsOverviewClientProps) {
  const router = useRouter();
  const [lists, setLists] = useState<ListCardData[]>(initialLists);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListTarget, setNewListTarget] = useState(3);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Modal
  const [deletingList, setDeletingList] = useState<ListCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsCreating(true);
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
      setIsCreating(false);
    }
  };

  const handleDeleteList = async () => {
    if (!deletingList) return;
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("recall_lists")
        .delete()
        .eq("id", deletingList.id);

      if (error) throw error;

      setLists((prev) => prev.filter((l) => l.id !== deletingList.id));
      setDeletingList(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete list:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Recall Lists
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Organize problems into rotating spaced repetition lists with custom daily targets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-yellow px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New List
        </button>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              No recall lists created
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Create your first list (e.g. &quot;Blind 75&quot; or &quot;Arrays &amp; Hashing&quot;) to start receiving scheduled daily batches.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-yellow px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Recall List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((list) => (
            <div
              key={list.id}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Link
                    href={`/lists/${list.id}`}
                    className="font-black text-lg text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 line-clamp-1"
                  >
                    {list.name}
                  </Link>

                  <button
                    onClick={() => toggleListActive(list.id, list.is_active)}
                    title={list.is_active ? "Pause rotation" : "Resume rotation"}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0 transition-colors ${
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

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  <p>
                    <strong>{list.problem_count}</strong> problems assigned
                  </p>
                  <p>
                    Target: <strong>{list.daily_target}</strong> problem{list.daily_target === 1 ? "" : "s"} per day
                  </p>
                  <p className="text-slate-400 dark:text-zinc-500 text-[11px]">
                    Created {new Date(list.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <Link
                  href={`/lists/${list.id}`}
                  className="btn-yellow px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  Open &amp; Review <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setDeletingList(list)}
                  title="Delete list"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  disabled={isCreating || !newListName.trim()}
                  className="btn-yellow px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingList && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Delete Recall List?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">&quot;{deletingList.name}&quot;</strong>? This will permanently delete this recall list, its cycle order, and its daily history. (Problems will remain in your library).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingList(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
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
