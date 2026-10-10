import fs from "node:fs";
import path from "node:path";

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function exportIssues(issues, exportDir) {
  fs.mkdirSync(exportDir, { recursive: true });
  const manifest = [];

  issues.forEach((issue, index) => {
    const slug = slugify(issue.title);
    const filename = `${String(index + 1).padStart(2, "0")}-${slug}.md`;
    const absolutePath = path.join(exportDir, filename);
    const content = [`# ${issue.title}`, "", issue.body].join("\n");
    fs.writeFileSync(absolutePath, content, "utf8");
    manifest.push({ filename, title: issue.title, labels: issue.labels });
  });

  fs.writeFileSync(
    path.join(exportDir, "manifest.json"),
    JSON.stringify({ count: manifest.length, issues: manifest }, null, 2),
    "utf8"
  );

  return manifest;
}
