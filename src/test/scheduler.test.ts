import { describe, it, expect } from "vitest";
import {
  getUserLocalDate,
  calculateNextDailyBatch,
  CycleState,
} from "../lib/scheduler";

describe("Recall Scheduling Engine", () => {
  describe("getUserLocalDate", () => {
    it("formats calendar date correctly for IANA timezones", () => {
      // 2026-10-21 23:30 UTC is 2026-10-22 in Tokyo (UTC+9)
      const refDate = new Date("2026-10-21T23:30:00Z");
      expect(getUserLocalDate("Asia/Tokyo", refDate)).toBe("2026-10-22");
      expect(getUserLocalDate("America/New_York", refDate)).toBe("2026-10-21");
    });

    it("falls back safely to UTC if invalid timezone is supplied", () => {
      const refDate = new Date("2026-10-21T12:00:00Z");
      expect(getUserLocalDate("Invalid/Timezone_Name", refDate)).toBe("2026-10-21");
    });
  });

  describe("calculateNextDailyBatch", () => {
    // Deterministic mock RNG (no shuffle reordering in test, preserves identity)
    const mockRng = () => 0.999999;

    it("handles 10-problem list with target 3 yielding 3, 3, 3, then 1, and rolling to next cycle", () => {
      const problemIds = Array.from({ length: 10 }, (_, i) => `p${i + 1}`);
      const dailyTarget = 3;

      // Day 1: Brand new cycle
      const day1 = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: null,
        listProblemIds: problemIds,
        dailyTarget,
        rng: mockRng,
      });

      expect(day1.shouldGenerateBatch).toBe(true);
      expect(day1.batchProblemIds.length).toBe(3);
      expect(day1.isNewCycleCreated).toBe(true);
      expect(day1.isCycleNowCompleted).toBe(false);

      // Construct cycle state after Day 1
      const cycleDay1: CycleState = {
        cycleNumber: 1,
        isCurrent: true,
        items: problemIds.map((id, idx) => ({
          problemId: id,
          position: idx,
          isServed: day1.servedProblemIds.includes(id),
        })),
      };

      // Day 2: Next 3 problems
      const day2 = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: cycleDay1,
        listProblemIds: problemIds,
        dailyTarget,
        rng: mockRng,
      });

      expect(day2.shouldGenerateBatch).toBe(true);
      expect(day2.batchProblemIds.length).toBe(3);
      expect(day2.isNewCycleCreated).toBe(false);
      expect(day2.isCycleNowCompleted).toBe(false);
      // No repeat from Day 1
      for (const id of day2.batchProblemIds) {
        expect(day1.batchProblemIds).not.toContain(id);
      }

      // Construct cycle state after Day 2
      const cycleDay2: CycleState = {
        cycleNumber: 1,
        isCurrent: true,
        items: cycleDay1.items.map((item) => ({
          ...item,
          isServed: item.isServed || day2.servedProblemIds.includes(item.problemId),
        })),
      };

      // Day 3: Next 3 problems (now 9 served in total)
      const day3 = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: cycleDay2,
        listProblemIds: problemIds,
        dailyTarget,
        rng: mockRng,
      });

      expect(day3.shouldGenerateBatch).toBe(true);
      expect(day3.batchProblemIds.length).toBe(3);
      expect(day3.isCycleNowCompleted).toBe(false);

      // Construct cycle state after Day 3 (9 items served, 1 remains)
      const cycleDay3: CycleState = {
        cycleNumber: 1,
        isCurrent: true,
        items: cycleDay2.items.map((item) => ({
          ...item,
          isServed: item.isServed || day3.servedProblemIds.includes(item.problemId),
        })),
      };

      // Day 4: Exactly 1 remaining item! Partial final batch requirement:
      // Must serve ONLY the 1 remaining item, not start cycle 2 on this same day.
      const day4 = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: cycleDay3,
        listProblemIds: problemIds,
        dailyTarget,
        rng: mockRng,
      });

      expect(day4.shouldGenerateBatch).toBe(true);
      expect(day4.batchProblemIds.length).toBe(1); // Exactly 1 problem!
      expect(day4.isCycleNowCompleted).toBe(true); // Cycle 1 is now completed!

      // Construct cycle state after Day 4 (all 10 served)
      const cycleDay4: CycleState = {
        cycleNumber: 1,
        isCurrent: false,
        items: cycleDay3.items.map((item) => ({
          ...item,
          isServed: true,
        })),
      };

      // Day 5: Next active date -> Starts fresh cycle 2 with 3 problems!
      const day5 = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: cycleDay4,
        listProblemIds: problemIds,
        dailyTarget,
        rng: mockRng,
      });

      expect(day5.shouldGenerateBatch).toBe(true);
      expect(day5.batchProblemIds.length).toBe(3);
      expect(day5.isNewCycleCreated).toBe(true);
      expect(day5.isCycleNowCompleted).toBe(false);
    });

    it("is strictly idempotent when a batch for the date already exists", () => {
      const res = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: true,
        existingBatchProblemIds: ["p1", "p2", "p3"],
        currentCycle: null,
        listProblemIds: ["p1", "p2", "p3", "p4"],
        dailyTarget: 3,
      });

      expect(res.shouldGenerateBatch).toBe(false);
      expect(res.batchProblemIds).toEqual(["p1", "p2", "p3"]);
      expect(res.isNewCycleCreated).toBe(false);
      expect(res.servedProblemIds).toEqual([]);
    });

    it("creates no batches while list is paused", () => {
      const res = calculateNextDailyBatch({
        isActive: false,
        hasBatchForDate: false,
        currentCycle: null,
        listProblemIds: ["p1", "p2"],
        dailyTarget: 3,
      });

      expect(res.shouldGenerateBatch).toBe(false);
      expect(res.batchProblemIds).toEqual([]);
    });

    it("returns existing batch even if list is paused", () => {
      const res = calculateNextDailyBatch({
        isActive: false,
        hasBatchForDate: true,
        existingBatchProblemIds: ["p1", "p2"],
        currentCycle: null,
        listProblemIds: ["p1", "p2"],
        dailyTarget: 3,
      });

      expect(res.shouldGenerateBatch).toBe(false);
      expect(res.batchProblemIds).toEqual(["p1", "p2"]);
    });

    it("creates no batch if list has no problems", () => {
      const res = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: null,
        listProblemIds: [],
        dailyTarget: 3,
      });

      expect(res.shouldGenerateBatch).toBe(false);
      expect(res.batchProblemIds).toEqual([]);
      expect(res.message).toContain("no problems");
    });

    it("handles list with fewer problems than target (e.g. 2 problems, target 3)", () => {
      const problemIds = ["p1", "p2"];
      const res = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle: null,
        listProblemIds: problemIds,
        dailyTarget: 3,
        rng: mockRng,
      });

      expect(res.shouldGenerateBatch).toBe(true);
      expect(res.batchProblemIds.length).toBe(2);
      expect(res.isCycleNowCompleted).toBe(true);
    });

    it("omits removed problems from active cycle batch", () => {
      const currentCycle: CycleState = {
        cycleNumber: 1,
        isCurrent: true,
        items: [
          { problemId: "p1", position: 0, isServed: false },
          { problemId: "p2", position: 1, isServed: false },
          { problemId: "p3", position: 2, isServed: false },
        ],
      };

      // p2 was removed from the list!
      const activeListProblemIds = ["p1", "p3"];

      const res = calculateNextDailyBatch({
        isActive: true,
        hasBatchForDate: false,
        currentCycle,
        listProblemIds: activeListProblemIds,
        dailyTarget: 2,
        rng: mockRng,
      });

      expect(res.batchProblemIds).toEqual(["p1", "p3"]);
      expect(res.batchProblemIds).not.toContain("p2");
    });
  });
});
