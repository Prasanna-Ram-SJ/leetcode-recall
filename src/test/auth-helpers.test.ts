import { describe, it, expect } from "vitest";
import {
  validateUsername,
  normalizeUsername,
  validatePassword,
  usernameToSyntheticEmail,
  syntheticEmailToUsername,
} from "../lib/auth-helpers";

describe("Authentication & Username Helpers", () => {
  describe("validateUsername", () => {
    it("accepts valid usernames between 3 and 24 characters", () => {
      expect(validateUsername("coder").isValid).toBe(true);
      expect(validateUsername("algo_master_99").isValid).toBe(true);
      expect(validateUsername("abc").isValid).toBe(true);
      expect(validateUsername("a".repeat(24)).isValid).toBe(true);
    });

    it("rejects usernames shorter than 3 characters", () => {
      expect(validateUsername("ab").isValid).toBe(false);
      expect(validateUsername("a").isValid).toBe(false);
      expect(validateUsername("").isValid).toBe(false);
    });

    it("rejects usernames longer than 24 characters", () => {
      expect(validateUsername("a".repeat(25)).isValid).toBe(false);
    });

    it("rejects special characters, spaces, and hyphens", () => {
      expect(validateUsername("user-name").isValid).toBe(false);
      expect(validateUsername("user name").isValid).toBe(false);
      expect(validateUsername("user@leet").isValid).toBe(false);
      expect(validateUsername("user.name").isValid).toBe(false);
    });
  });

  describe("normalizeUsername", () => {
    it("lowercases and trims username for identity/uniqueness", () => {
      expect(normalizeUsername("  LeetCoder42  ")).toBe("leetcoder42");
      expect(normalizeUsername("ALGO_KING")).toBe("algo_king");
    });
  });

  describe("validatePassword", () => {
    it("accepts passwords of 8 characters or more", () => {
      expect(validatePassword("12345678").isValid).toBe(true);
      expect(validatePassword("super-secret-password-123!").isValid).toBe(true);
    });

    it("rejects passwords under 8 characters", () => {
      expect(validatePassword("short").isValid).toBe(false);
      expect(validatePassword("1234567").isValid).toBe(false);
      expect(validatePassword("").isValid).toBe(false);
    });
  });

  describe("usernameToSyntheticEmail & syntheticEmailToUsername", () => {
    it("maps normalized username to @auth.invalid", () => {
      expect(usernameToSyntheticEmail("LeetCoder")).toBe("leetcoder@auth.invalid");
      expect(usernameToSyntheticEmail("  Coder_1  ")).toBe("coder_1@auth.invalid");
    });

    it("inverts synthetic email back to normalized username", () => {
      expect(syntheticEmailToUsername("coder_1@auth.invalid")).toBe("coder_1");
      expect(syntheticEmailToUsername("invalid@gmail.com")).toBe("");
    });
  });
});
