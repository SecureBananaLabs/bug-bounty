export function slugify(str, options = {}) {
  if (typeof str !== "string") {
    return "";
  }

  const { maxLength = 100, lowercase = true } = options;

  let result = str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/[\s_-]+/g, "-") // Collapse whitespace and hyphens
    .replace(/^-+|-+$/g, ""); // Trim boundary hyphens

  if (lowercase) {
    result = result.toLowerCase();
  }

  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength).replace(/-+$/, "");
  }

  return result;
}
