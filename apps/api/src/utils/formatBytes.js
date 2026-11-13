export function formatBytes(bytes, decimals = 2) {
  if (typeof bytes !== "number" || isNaN(bytes) || bytes < 0) {
    return "0 Bytes";
  }

  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const dm = Math.max(0, Math.floor(decimals));
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
