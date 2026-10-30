/**
 * Defensive string manipulation utilities for FreelanceFlow.
 * Handles null/undefined inputs, ReDoS-safe regex escaping, and length clamping.
 */

export interface TruncateOptions {
  suffix?: string;
}

export interface SlugifyOptions {
  lower?: boolean;
  separator?: string;
  maxLength?: number;
  strict?: boolean;
}

export interface SanitizeOptions {
  trim?: boolean;
  allowNewlines?: boolean;
  collapseWhitespace?: boolean;
  maxLength?: number;
}

/**
 * Truncates a string to a specified maximum length, appending a suffix if truncated.
 * Guarantees that the returned string never exceeds `maxLength`.
 */
export function truncate(
  input: string | null | undefined,
  maxLength: number,
  suffix: string = "..."
): string {
  if (input === null || input === undefined) {
    return "";
  }

  const str = String(input);
  const max = Math.max(0, Math.floor(Number(maxLength) || 0));

  if (max === 0) {
    return "";
  }

  if (str.length <= max) {
    return str;
  }

  const suf = String(suffix ?? "");

  if (suf.length >= max) {
    return suf.slice(0, max);
  }

  return str.slice(0, max - suf.length) + suf;
}

/**
 * Converts a string into a clean, URL-safe and filesystem-safe slug.
 * Removes diacritics/accents, replaces spaces and special characters with separators.
 */
export function slugify(
  input: string | null | undefined,
  options: SlugifyOptions = {}
): string {
  if (input === null || input === undefined) {
    return "";
  }

  const {
    lower = true,
    separator = "-",
    maxLength,
    strict = true
  } = options;

  let str = String(input).trim();
  if (!str) {
    return "";
  }

  // Normalize Unicode to decompose diacritics (NFKD) and strip combining accents
  str = str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  if (lower) {
    str = str.toLowerCase();
  }

  const sep = String(separator ?? "-");
  const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (strict) {
    str = str.replace(/[^a-zA-Z0-9]+/g, sep);
  } else {
    str = str.replace(/[\s\-_]+/g, sep);
  }

  if (sep) {
    const collapseRegex = new RegExp(`${escapedSep}+`, "g");
    str = str.replace(collapseRegex, sep);

    const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, "g");
    str = str.replace(trimRegex, "");
  }

  if (typeof maxLength === "number" && maxLength > 0) {
    const max = Math.floor(maxLength);
    if (str.length > max) {
      str = str.slice(0, max);
      if (sep) {
        const trailingRegex = new RegExp(`${escapedSep}+$`, "g");
        str = str.replace(trailingRegex, "");
      }
    }
  }

  return str;
}

/**
 * Safely escapes characters that have special meaning in Regular Expressions.
 * Prevents Regular Expression Denial of Service (ReDoS) and syntax errors.
 */
export function escapeRegex(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return "";
  }

  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitizes plain text input by stripping HTML tags, removing non-printable control
 * characters (null bytes, bell, etc.) and normalizing line breaks.
 */
export function sanitizePlainText(
  input: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  if (input === null || input === undefined) {
    return "";
  }

  const {
    trim = true,
    allowNewlines = true,
    collapseWhitespace = false,
    maxLength
  } = options;

  let str = String(input);

  // Strip null bytes and dangerous control characters (keep \t, \n, \r)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip HTML / XML tags defensively without ReDoS vulnerability
  str = str.replace(/<[^>]*>/g, "");

  // Normalize line breaks
  str = str.replace(/\r\n|\r/g, "\n");

  if (!allowNewlines) {
    str = str.replace(/\n+/g, " ");
  }

  if (collapseWhitespace) {
    str = str.replace(/[^\S\r\n]+/g, " ");
  }

  if (trim) {
    str = str.trim();
  }

  if (typeof maxLength === "number" && maxLength >= 0) {
    const max = Math.floor(maxLength);
    str = str.slice(0, max);
  }

  return str;
}
