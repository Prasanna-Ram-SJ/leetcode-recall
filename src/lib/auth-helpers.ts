/**
 * LeetCode Recall - Authentication & Validation Helpers
 * 
 * Rules:
 * - Email: Valid email format from any provider (RFC 5322 pattern).
 * - Username: 3–24 ASCII letters, numbers, or underscores.
 * - Normalized username: lowercased for uniqueness.
 * - Password: minimum 8 characters.
 * - Supabase Auth handles password hashing and authentication.
 */

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SYNTHETIC_DOMAIN = "auth.invalid";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address. Accepts any valid domain (Gmail, Outlook, custom, etc.).
 */
export function validateEmail(rawEmail: string): ValidationResult {
  if (!rawEmail || typeof rawEmail !== "string") {
    return { isValid: false, error: "Email address is required." };
  }
  const trimmed = rawEmail.trim();
  if (trimmed.length < 5 || trimmed.length > 254) {
    return { isValid: false, error: "Please enter a valid email address." };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address format (e.g., user@example.com)." };
  }
  return { isValid: true };
}

/**
 * Validates a raw username according to the guidelines:
 * 3-24 characters, ASCII alphanumeric and underscore only.
 */
export function validateUsername(rawUsername: string): ValidationResult {
  if (!rawUsername || typeof rawUsername !== "string") {
    return { isValid: false, error: "Username is required." };
  }
  const trimmed = rawUsername.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters." };
  }
  if (trimmed.length > 24) {
    return { isValid: false, error: "Username must be at most 24 characters." };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: "Username may only contain letters, numbers, and underscores.",
    };
  }
  return { isValid: true };
}

/**
 * Normalizes a username for unique identification (lowercased).
 */
export function normalizeUsername(rawUsername: string): string {
  return rawUsername.trim().toLowerCase();
}

/**
 * Validates password strength (minimum 8 characters).
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }
  return { isValid: true };
}

/**
 * Maps a normalized username to synthetic email (kept for backward compatibility).
 */
export function usernameToSyntheticEmail(rawUsername: string): string {
  const normalized = normalizeUsername(rawUsername);
  return `${normalized}@${SYNTHETIC_DOMAIN}`;
}

/**
 * Extracts normalized username from synthetic email (kept for backward compatibility).
 */
export function syntheticEmailToUsername(email: string): string {
  if (!email || !email.endsWith(`@${SYNTHETIC_DOMAIN}`)) {
    return "";
  }
  return email.slice(0, -(SYNTHETIC_DOMAIN.length + 1));
}

/**
 * Fallback helper to derive display name from email if username is missing.
 */
export function emailToFallbackUsername(email: string): string {
  if (!email) return "User";
  const namePart = email.split("@")[0] || "User";
  return namePart.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || "User";
}
