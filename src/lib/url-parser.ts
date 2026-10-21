/**
 * LeetCode Recall - URL Parser & Slug Normalizer
 *
 * Strict Rules:
 * - Accept links with or without https:// or http:// prefix.
 * - Accept hostnames leetcode.com and www.leetcode.com ONLY.
 * - Path must contain /problems/{slug}.
 * - Trailing path segments (e.g. /description, /solution) allowed and ignored.
 * - Query strings and fragments allowed and ignored.
 * - Slug must match ^[a-z0-9-]+$ after lowercasing.
 * - Canonical link: https://leetcode.com/problems/{slug}/
 * - Reject discuss, profile, contest, submission, explore, etc.
 * - No LeetCode API, fetching, scraping, or external network requests.
 */

export interface ParsedProblem {
  slug: string;
  canonicalUrl: string;
  derivedTitle: string;
  originalInput: string;
}

export interface ParseResult {
  success: boolean;
  problem?: ParsedProblem;
  error?: string;
  originalInput: string;
}

export interface MultiParseResult {
  valid: ParsedProblem[];
  duplicatesInInput: string[];
  invalid: { input: string; error: string }[];
  summary: {
    total: number;
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
  };
}

const ALLOWED_HOSTS = new Set(["leetcode.com", "www.leetcode.com"]);
const SLUG_REGEX = /^[a-z0-9-]+$/;

// Words commonly kept uppercase in problem titles
const ROMAN_NUMERALS = new Set(["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]);

/**
 * Derives a human-readable title from a problem slug.
 * e.g., "two-sum" -> "Two Sum"
 * "median-of-two-sorted-arrays" -> "Median of Two Sorted Arrays"
 * "3sum-closest" -> "3Sum Closest"
 */
export function slugToTitle(slug: string): string {
  if (!slug) return "";

  const words = slug.split("-").filter(Boolean);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();

      // Check roman numerals
      if (ROMAN_NUMERALS.has(lower)) {
        return lower.toUpperCase();
      }

      // Check patterns like 3sum -> 3Sum
      if (/^\d+[a-z]+$/i.test(word)) {
        const numPart = word.match(/^\d+/)?.[0] || "";
        const letterPart = word.slice(numPart.length);
        return numPart + letterPart.charAt(0).toUpperCase() + letterPart.slice(1).toLowerCase();
      }

      // Keep minor words lowercase unless first or last
      const minorWords = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in"]);
      if (index > 0 && index < words.length - 1 && minorWords.has(lower)) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Parses a single LeetCode URL string and returns the parsed result.
 */
export function parseLeetCodeUrl(rawInput: string): ParseResult {
  const originalInput = (rawInput || "").trim();

  if (!originalInput) {
    return {
      success: false,
      error: "Please enter a LeetCode problem link.",
      originalInput,
    };
  }

  // Ensure an URL prefix for URL parser
  let normalizedInput = originalInput;
  if (!/^https?:\/\//i.test(normalizedInput)) {
    normalizedInput = "https://" + normalizedInput;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedInput);
  } catch {
    return {
      success: false,
      error: "Invalid URL format. Expected a link like https://leetcode.com/problems/two-sum/",
      originalInput,
    };
  }

  // Validate hostname
  const host = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      success: false,
      error: `Only leetcode.com links are supported. Got "${host}".`,
      originalInput,
    };
  }

  // Path validation
  // e.g. /problems/two-sum or /problems/two-sum/description
  const pathSegments = parsedUrl.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (pathSegments.length === 0 || pathSegments[0].toLowerCase() !== "problems") {
    return {
      success: false,
      error: "Only problem links are accepted (must contain /problems/{slug}). Discuss, profile, and contest links are not supported.",
      originalInput,
    };
  }

  if (pathSegments.length < 2 || !pathSegments[1]) {
    return {
      success: false,
      error: "Missing problem slug in URL. Expected /problems/{slug}/.",
      originalInput,
    };
  }

  const rawSlug = pathSegments[1].toLowerCase();

  if (!SLUG_REGEX.test(rawSlug)) {
    return {
      success: false,
      error: `Invalid problem slug "${rawSlug}". Slugs may only contain letters, numbers, and hyphens.`,
      originalInput,
    };
  }

  const slug = rawSlug;
  const canonicalUrl = `https://leetcode.com/problems/${slug}/`;
  const derivedTitle = slugToTitle(slug);

  return {
    success: true,
    problem: {
      slug,
      canonicalUrl,
      derivedTitle,
      originalInput,
    },
    originalInput,
  };
}

/**
 * Splits multi-link text (separated by newlines or commas),
 * parses each, deduplicates within the paste, and categorizes results.
 */
export function parseMultiLinkInput(rawText: string): MultiParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      valid: [],
      duplicatesInInput: [],
      invalid: [],
      summary: { total: 0, validCount: 0, duplicateCount: 0, invalidCount: 0 },
    };
  }

  // Split by newlines or commas
  const tokens = rawText
    .split(/[\n\r,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const seenSlugs = new Set<string>();
  const valid: ParsedProblem[] = [];
  const duplicatesInInput: string[] = [];
  const invalid: { input: string; error: string }[] = [];

  for (const token of tokens) {
    const result = parseLeetCodeUrl(token);
    if (!result.success || !result.problem) {
      invalid.push({ input: token, error: result.error || "Invalid link" });
    } else {
      const slug = result.problem.slug;
      if (seenSlugs.has(slug)) {
        duplicatesInInput.push(token);
      } else {
        seenSlugs.add(slug);
        valid.push(result.problem);
      }
    }
  }

  return {
    valid,
    duplicatesInInput,
    invalid,
    summary: {
      total: tokens.length,
      validCount: valid.length,
      duplicateCount: duplicatesInInput.length,
      invalidCount: invalid.length,
    },
  };
}
