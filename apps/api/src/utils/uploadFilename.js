const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]+/g;
const PATH_SEPARATORS = /[\\/]+/g;
const MAX_FILENAME_LENGTH = 64;

export function sanitizeUploadFilename(filename) {
  if (typeof filename !== "string") {
    return null;
  }

  const finalSegment = filename.split(PATH_SEPARATORS).pop() ?? "";
  const normalized = finalSegment.replace(CONTROL_CHARACTERS, "").trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_FILENAME_LENGTH);
}
