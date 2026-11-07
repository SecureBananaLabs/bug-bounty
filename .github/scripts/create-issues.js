```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const LABEL = 'low-hanging-fruit';
const RESTRICTION = 'This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.';

// 递归扫描所有非node_modules/.git的文件
function scanFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        results = results.concat(scanFiles(full));
      }
    } else {
      // 只扫描常见源码文件
      if (/\.(js|jsx|ts|tsx|yml|yaml|json|md)$/.test(file)) {
        results.push(full);
      }
    }
  }
  return results;
}

// 提取 TODO/FIXME/HACK 注释并返回 {file, line, text} 列表
function extractItems(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const items = [];
  const regex = /\b(TODO|FIXME|HACK|BUG|XXX)\b[\s:]*/i;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(regex);
    if (match) {
      items.push({
        file: filePath,
        line: i + 1,
        text: lines[i].trim().substring(0, 200)
      });
    }
  }
  return items;
}

async function main() {
  const root = process.cwd();
  const files = scanFiles(root);
  let allItems = [];
  for (const file of files) {
    const items = extractItems(file);
    allItems = allItems.concat(items);
  }

  if (allItems.length === 0) {
    console.log('No low hanging fruit found.');
    return;
  }

  // 获取现有open issues以避免重复
  const existingRes = await fetch(`https://api.github.com/repos/${REPO}/issues?state=open&labels=${LABEL}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const existing = await existingRes.json();
  const existingTitles = new Set(existing.map(i => i.title));

  for (const item of allItems) {
    const title = `Low Hanging Fruit: ${path.relative(root, item.file)}:${item.line}`;
    if (existingTitles.has(title)) {
      console.log(`Skipping existing issue: ${title}`);
      continue;
    }
    const body = `## ${item.text}\n\n**File:** \`${path.relative(root, item.file)}\`\n**Line:** ${item.line}\n\n${RESTRICTION}`;

    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        labels: [LABEL]
      })
    });
    if (res.ok) {
      const issue = await res.json();
      console.log(`Created issue #${issue.number}: ${title}`);
    } else {
      console.error(`Failed to create issue for ${title}: ${await res.text()}`);
    }
    // 防止速率限制
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);