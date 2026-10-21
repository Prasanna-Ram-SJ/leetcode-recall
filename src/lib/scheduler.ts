/**
 * LeetCode Recall - Cycle & Daily Scheduling Logic
 *
 * Implements:
 * - Persisted shuffled cycle without repeats.
 * - Idempotent daily batch generation per user-local calendar date.
 * - Respects IANA timezone; falls back to UTC if invalid.
 * - Daily target extraction with partial final batch (e.g. 10 items, target 3 -> 3, 3, 3, 1).
 * - Next cycle starts on following active date after partial batch.
 * - Paused lists generate no batches, but existing batches remain accessible.
 * - Dynamic list membership rules (new items join next cycle, removed items omitted).
 */

export interface CycleItem {
  problemId: string;
  position: number;
  isServed: boolean;
}

export interface CycleState {
  id?: string;
  cycleNumber: number;
  isCurrent: boolean;
  items: CycleItem[];
}

export interface NextBatchInput {
  isActive: boolean;
  hasBatchForDate: boolean;
  existingBatchProblemIds?: string[];
  currentCycle: CycleState | null;
  listProblemIds: string[];
  dailyTarget: number;
  rng?: () => number; // Optional for deterministic testing
}

export interface NextBatchResult {
  shouldGenerateBatch: boolean;
  batchProblemIds: string[];
  isNewCycleCreated: boolean;
  newCycleOrder?: string[];
  servedProblemIds: string[];
  isCycleNowCompleted: boolean;
  message?: string;
}

/**
 * Validates and gets the user's current date string (YYYY-MM-DD)
 * in the specified IANA timezone, falling back to UTC if invalid.
 */
export function getUserLocalDate(timeZone?: string, refDate: Date = new Date()): string {
  let validTz = "UTC";
  if (timeZone && typeof timeZone === "string") {
    try {
      // Test if timezone is valid
      Intl.DateTimeFormat(undefined, { timeZone }).format(refDate);
      validTz = timeZone;
    } catch {
      validTz = "UTC";
    }
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: validTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(refDate);
}

/**
 * Fisher-Yates array shuffle.
 */
export function shuffleArray<T>(array: T[], rng: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pure scheduling function to determine what daily batch should be served.
 */
export function calculateNextDailyBatch(input: NextBatchInput): NextBatchResult {
  const {
    isActive,
    hasBatchForDate,
    existingBatchProblemIds = [],
    currentCycle,
    listProblemIds,
    dailyTarget,
    rng = Math.random,
  } = input;

  // 1. If batch already exists for this date, return it idempotently
  if (hasBatchForDate) {
    return {
      shouldGenerateBatch: false,
      batchProblemIds: existingBatchProblemIds,
      isNewCycleCreated: false,
      servedProblemIds: [],
      isCycleNowCompleted: false,
      message: "Batch already generated for this date.",
    };
  }

  // 2. If list is paused, no new batch is generated
  if (!isActive) {
    return {
      shouldGenerateBatch: false,
      batchProblemIds: [],
      isNewCycleCreated: false,
      servedProblemIds: [],
      isCycleNowCompleted: false,
      message: "List is paused. No new batches are created while paused.",
    };
  }

  // 3. If list is empty, no batch is generated
  if (listProblemIds.length === 0) {
    return {
      shouldGenerateBatch: false,
      batchProblemIds: [],
      isNewCycleCreated: false,
      servedProblemIds: [],
      isCycleNowCompleted: false,
      message: "Recall list has no problems. Add problems from your library to start.",
    };
  }

  const target = Math.max(1, Math.floor(dailyTarget || 3));

  // 4. Check if we need to start a brand new cycle
  let activeCycle = currentCycle;
  let isNewCycleCreated = false;
  let newCycleOrder: string[] | undefined;

  // Check if current cycle exists and has any unserved items
  const unservedItems = activeCycle
    ? activeCycle.items
        .filter((item) => !item.isServed)
        // Also ensure problem is still in listProblemIds (membership rule)
        .filter((item) => listProblemIds.includes(item.problemId))
        .sort((a, b) => a.position - b.position)
    : [];

  if (!activeCycle || unservedItems.length === 0) {
    // Current cycle is finished or non-existent; create a new shuffled cycle
    isNewCycleCreated = true;
    newCycleOrder = shuffleArray([...listProblemIds], rng);
    activeCycle = {
      cycleNumber: (activeCycle?.cycleNumber || 0) + 1,
      isCurrent: true,
      items: newCycleOrder.map((problemId, idx) => ({
        problemId,
        position: idx,
        isServed: false,
      })),
    };
  }

  // 5. Select up to target unserved items from current cycle
  const availableUnserved = activeCycle.items
    .filter((item) => !item.isServed && listProblemIds.includes(item.problemId))
    .sort((a, b) => a.position - b.position);

  const batchCount = Math.min(target, availableUnserved.length);
  const selectedItems = availableUnserved.slice(0, batchCount);
  const batchProblemIds = selectedItems.map((item) => item.problemId);
  const servedProblemIds = [...batchProblemIds];

  // 6. Check if cycle is completed after serving these items
  const remainingAfterBatch = availableUnserved.length - batchCount;
  const isCycleNowCompleted = remainingAfterBatch === 0;

  return {
    shouldGenerateBatch: true,
    batchProblemIds,
    isNewCycleCreated,
    newCycleOrder,
    servedProblemIds,
    isCycleNowCompleted,
  };
}
