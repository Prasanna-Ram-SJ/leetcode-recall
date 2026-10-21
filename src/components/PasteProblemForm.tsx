"use client";

import { useState } from "react";
import { parseMultiLinkInput, ParsedProblem } from "@/lib/url-parser";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, Plus, Loader2, ExternalLink } from "lucide-react";

interface PasteProblemFormProps {
  onProblemsAdded?: () => void;
  existingSlugs?: Set<string>;
}

export function PasteProblemForm({ onProblemsAdded, existingSlugs = new Set() }: PasteProblemFormProps) {
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
    details?: string[];
    recentlyAdded?: { title: string; canonicalUrl: string; slug: string }[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Local browser-only link parsing and deduplication
      const parseSummary = parseMultiLinkInput(inputText);

      if (parseSummary.summary.total === 0) {
        setStatusMessage({
          type: "error",
          text: "Please paste at least one LeetCode problem link.",
        });
        setIsSubmitting(false);
        return;
      }

      if (parseSummary.valid.length === 0 && parseSummary.invalid.length > 0) {
        setStatusMessage({
          type: "error",
          text: parseSummary.invalid[0].error,
          details: parseSummary.invalid.map((inv) => `${inv.input}: ${inv.error}`),
        });
        setIsSubmitting(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatusMessage({
          type: "error",
          text: "You must be signed in to add problems to your library.",
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Fetch existing slugs for this user to detect duplicates
      const { data: userExistingProblems, error: fetchErr } = await supabase
        .from("problems")
        .select("slug")
        .eq("user_id", user.id);

      if (fetchErr) {
        setStatusMessage({
          type: "error",
          text: `Database error: ${fetchErr.message}`,
        });
        setIsSubmitting(false);
        return;
      }

      const userDbSlugs = new Set(
        (userExistingProblems || []).map((p: { slug: string }) => p.slug.toLowerCase())
      );
      // Merge with passed prop if available
      existingSlugs.forEach((s) => userDbSlugs.add(s.toLowerCase()));

      const toInsert: ParsedProblem[] = [];
      const alreadyInLibrarySlugs: string[] = [];

      for (const validItem of parseSummary.valid) {
        if (userDbSlugs.has(validItem.slug)) {
          alreadyInLibrarySlugs.push(validItem.slug);
        } else {
          toInsert.push(validItem);
          userDbSlugs.add(validItem.slug); // Prevent duplicate inside batch
        }
      }

      // Single item paste duplicate handling
      if (parseSummary.summary.total === 1 && toInsert.length === 0 && alreadyInLibrarySlugs.length > 0) {
        setStatusMessage({
          type: "warning",
          text: "Already in your library.",
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Insert valid new problems into Supabase
      if (toInsert.length > 0) {
        const rows = toInsert.map((item) => ({
          user_id: user.id,
          slug: item.slug,
          canonical_url: item.canonicalUrl,
          title: item.derivedTitle,
        }));

        const { error: insertErr } = await supabase.from("problems").insert(rows);

        if (insertErr) {
          setStatusMessage({
            type: "error",
            text: `Failed to save problem: ${insertErr.message}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 4. Multi-link paste summary
      const addedCount = toInsert.length;
      const alreadyCount = alreadyInLibrarySlugs.length + parseSummary.duplicatesInInput.length;
      const invalidCount = parseSummary.invalid.length;

      let msgText = "";
      if (parseSummary.summary.total === 1 && addedCount === 1) {
        msgText = `Added "${toInsert[0].derivedTitle}" to your solved-problem library!`;
      } else {
        msgText = `Batch summary: ${addedCount} added, ${alreadyCount} already present, ${invalidCount} invalid.`;
      }

      const detailList: string[] = [];
      if (invalidCount > 0) {
        parseSummary.invalid.forEach((inv) => detailList.push(`Invalid: ${inv.input} (${inv.error})`));
      }
      if (alreadyCount > 0) {
        alreadyInLibrarySlugs.forEach((s) => detailList.push(`Already present: ${s}`));
      }

      setStatusMessage({
        type: addedCount > 0 ? "success" : "warning",
        text: msgText,
        details: detailList.length > 0 ? detailList : undefined,
        recentlyAdded: toInsert.map((item) => ({
          title: item.derivedTitle,
          canonicalUrl: item.canonicalUrl,
          slug: item.slug,
        })),
      });

      // Clear input only on successful addition
      if (addedCount > 0) {
        setInputText("");
      }

      if (onProblemsAdded) {
        onProblemsAdded();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setStatusMessage({
        type: "error",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="problem-link-input"
            className="block text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1.5"
          >
            Paste a LeetCode problem link
          </label>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">
            Paste links with or without <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">https://</code>. Multiple links can be separated by newlines or commas.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="problem-link-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. https://leetcode.com/problems/two-sum/"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim()}
              className="btn-yellow px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Library
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-sm transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : statusMessage.type === "warning"
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
              : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  statusMessage.type === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{statusMessage.text}</p>
              {statusMessage.details && (
                <ul className="text-xs list-disc pl-4 space-y-0.5 opacity-90">
                  {statusMessage.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              {statusMessage.recentlyAdded && statusMessage.recentlyAdded.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-2">
                  {statusMessage.recentlyAdded.map((p, i) => (
                    <a
                      key={i}
                      href={p.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-black/5 dark:bg-white/10 hover:underline"
                    >
                      {p.title}
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
