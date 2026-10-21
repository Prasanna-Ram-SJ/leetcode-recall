import { describe, it, expect } from "vitest";
import {
  parseLeetCodeUrl,
  slugToTitle,
  parseMultiLinkInput,
} from "../lib/url-parser";

describe("LeetCode URL Parser", () => {
  describe("slugToTitle", () => {
    it("converts hyphenated slug to title case", () => {
      expect(slugToTitle("two-sum")).toBe("Two Sum");
      expect(slugToTitle("add-two-numbers")).toBe("Add Two Numbers");
      expect(slugToTitle("median-of-two-sorted-arrays")).toBe("Median of Two Sorted Arrays");
    });

    it("handles roman numerals and alphanumeric tokens", () => {
      expect(slugToTitle("3sum")).toBe("3Sum");
      expect(slugToTitle("3sum-closest")).toBe("3Sum Closest");
      expect(slugToTitle("trapping-rain-water-ii")).toBe("Trapping Rain Water II");
    });
  });

  describe("parseLeetCodeUrl", () => {
    it("parses canonical HTTPS URL", () => {
      const res = parseLeetCodeUrl("https://leetcode.com/problems/two-sum/");
      expect(res.success).toBe(true);
      expect(res.problem?.slug).toBe("two-sum");
      expect(res.problem?.canonicalUrl).toBe("https://leetcode.com/problems/two-sum/");
      expect(res.problem?.derivedTitle).toBe("Two Sum");
    });

    it("parses URL without https:// prefix", () => {
      const res = parseLeetCodeUrl("leetcode.com/problems/two-sum");
      expect(res.success).toBe(true);
      expect(res.problem?.slug).toBe("two-sum");
      expect(res.problem?.canonicalUrl).toBe("https://leetcode.com/problems/two-sum/");
    });

    it("parses www.leetcode.com hostname", () => {
      const res = parseLeetCodeUrl("https://www.leetcode.com/problems/valid-parentheses/");
      expect(res.success).toBe(true);
      expect(res.problem?.slug).toBe("valid-parentheses");
    });

    it("ignores trailing path segments such as /description or /solution", () => {
      const res = parseLeetCodeUrl(
        "https://leetcode.com/problems/merge-k-sorted-lists/description/"
      );
      expect(res.success).toBe(true);
      expect(res.problem?.slug).toBe("merge-k-sorted-lists");
      expect(res.problem?.canonicalUrl).toBe(
        "https://leetcode.com/problems/merge-k-sorted-lists/"
      );
    });

    it("ignores query parameters and URL fragments", () => {
      const res = parseLeetCodeUrl(
        "https://leetcode.com/problems/climbing-stairs?envType=daily-question&envId=2026-10-21#solution"
      );
      expect(res.success).toBe(true);
      expect(res.problem?.slug).toBe("climbing-stairs");
      expect(res.problem?.canonicalUrl).toBe(
        "https://leetcode.com/problems/climbing-stairs/"
      );
    });

    it("rejects non-problem URLs (discuss, profile, contest, submission)", () => {
      expect(parseLeetCodeUrl("https://leetcode.com/discuss/general-discussion").success).toBe(false);
      expect(parseLeetCodeUrl("https://leetcode.com/u/someuser/").success).toBe(false);
      expect(parseLeetCodeUrl("https://leetcode.com/contest/weekly-contest-400").success).toBe(false);
      expect(parseLeetCodeUrl("https://leetcode.com/submissions/detail/123/").success).toBe(false);
    });

    it("rejects URLs from other domains", () => {
      expect(parseLeetCodeUrl("https://hackerrank.com/problems/two-sum").success).toBe(false);
      expect(parseLeetCodeUrl("https://not-leetcode.com/problems/two-sum").success).toBe(false);
    });

    it("rejects empty problem slugs or invalid slug characters", () => {
      expect(parseLeetCodeUrl("https://leetcode.com/problems/").success).toBe(false);
      expect(parseLeetCodeUrl("https://leetcode.com/problems/invalid_slug$").success).toBe(false);
    });
  });

  describe("parseMultiLinkInput", () => {
    it("parses and deduplicates multi-line / comma-separated input", () => {
      const input = `
        https://leetcode.com/problems/two-sum
        https://leetcode.com/problems/add-two-numbers/
        leetcode.com/problems/two-sum
        https://leetcode.com/discuss/invalid-post
        https://leetcode.com/problems/3sum
      `;
      const res = parseMultiLinkInput(input);
      expect(res.summary.total).toBe(5);
      expect(res.summary.validCount).toBe(3); // two-sum, add-two-numbers, 3sum
      expect(res.summary.duplicateCount).toBe(1); // duplicate two-sum
      expect(res.summary.invalidCount).toBe(1); // discuss link

      expect(res.valid.map((p) => p.slug)).toEqual(["two-sum", "add-two-numbers", "3sum"]);
    });
  });
});
