"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasteProblemForm } from "@/components/PasteProblemForm";
import { SolvedProblem } from "@/types/database";
import {
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  BookOpen,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface LibraryClientProps {
  initialProblems: SolvedProblem[];
}

export function LibraryClient({ initialProblems }: LibraryClientProps) {
  const router = useRouter();
  const [problems, setProblems] = useState<SolvedProblem[]>(initialProblems);
  const [searchQuery, setSearchQuery] = useState("");

  // Title edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Deletion modal state
  const [deletingProblem, setDeletingProblem] = useState<SolvedProblem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter problems by search query
  const filteredProblems = problems.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const existingSlugs = new Set(problems.map((p) => p.slug.toLowerCase()));

  const handleStartEdit = (problem: SolvedProblem) => {
    setEditingId(problem.id);
    setEditTitleValue(problem.title);
  };

  const handleSaveTitle = async (problemId: string) => {
    if (!editTitleValue.trim()) return;
    setIsSavingTitle(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("problems")
        .update({ title: editTitleValue.trim() })
        .eq("id", problemId);

      if (error) throw error;

      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, title: editTitleValue.trim() } : p))
      );
      setEditingId(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to update title:", err);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteProblem = async () => {
    if (!deletingProblem) return;
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("problems")
        .delete()
        .eq("id", deletingProblem.id);

      if (error) throw error;

      setProblems((prev) => prev.filter((p) => p.id !== deletingProblem.id));
      setDeletingProblem(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete problem:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Problem Library
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Your private collection of solved LeetCode problems. Add problems by pasting URLs below.
        </p>
      </div>

      {/* Paste Problem Link Field */}
      <PasteProblemForm
        existingSlugs={existingSlugs}
        onProblemsAdded={() => {
          router.refresh();
        }}
      />

      {/* Library Table / List */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              Solved Problems
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-400">
              {problems.length}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {problems.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400 dark:text-zinc-600" />
            <p className="font-bold text-sm text-slate-700 dark:text-zinc-300">
              Your Problem Library is empty
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm mx-auto">
              Paste a LeetCode problem URL above to record it as solved. You can then add it to your recall lists!
            </p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-zinc-400 text-center py-6">
            No problems match &quot;{searchQuery}&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Problem Title</th>
                  <th className="pb-3 hidden sm:table-cell">Slug</th>
                  <th className="pb-3 hidden md:table-cell">Canonical Link</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredProblems.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 pl-2 max-w-xs font-semibold text-slate-900 dark:text-zinc-100">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              autoFocus
                              className="px-2 py-1 text-xs rounded border border-amber-500 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveTitle(p.id)}
                              disabled={isSavingTitle}
                              title="Save title"
                              className="p-1 rounded bg-amber-500 text-black hover:bg-amber-600 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              title="Cancel"
                              className="p-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{p.title}</span>
                            <button
                              onClick={() => handleStartEdit(p)}
                              title="Edit title"
                              className="opacity-60 hover:opacity-100 text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 hidden sm:table-cell text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                        {p.slug}
                      </td>

                      <td className="py-3 hidden md:table-cell text-slate-500 dark:text-zinc-400">
                        <a
                          href={p.canonical_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          leetcode.com/problems/{p.slug}/
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="py-3 pr-2 text-right">
                        <button
                          onClick={() => setDeletingProblem(p)}
                          title="Delete problem"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deletion Confirmation Modal */}
      {deletingProblem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Delete from Library?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">&quot;{deletingProblem.title}&quot;</strong>? This will also remove it from any recall lists and future recall batches.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProblem(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProblem}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete Problem"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
