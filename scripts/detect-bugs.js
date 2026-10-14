// A script to automate low-hanging fruit bug detection and issue creation recursively.
const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'SecureBananaLabs';
const REPO_NAME = process.env.REPO_NAME || 'bug-bounty';

// Find FIXME and TODO tags in source code
function findLowHangingBugs(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
                findLowHangingBugs(filePath, fileList);
            }
        } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (line.includes('FIXME:') || line.includes('TODO:')) {
                    fileList.push({ file: filePath, line: index + 1, content: line.trim() });
                }
            });
        }
    }
    return fileList;
}

function createGitHubIssue(bug) {
    if (!GITHUB_TOKEN) return console.log('No GITHUB_TOKEN provided, skipping issue creation.');
    
    const issueData = JSON.stringify({
        title: `Fix Low Hanging Bug in ${path.basename(bug.file)}`,
        body: `Detected a potential low hanging bug / improvement.\n\nFile: \`${bug.file}\`\nLine: ${bug.line}\nContext: \`${bug.content}\`\n\nPlease review and fix this automatically detected issue.`
    });

    const options = {
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'Bug-Detection-Bot',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(issueData)
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Created Issue for ${bug.file} - Status: ${res.statusCode}`);
    });
    
    req.write(issueData);
    req.end();
}

console.log('Scanning repository for bugs...');
const bugs = findLowHangingBugs(path.join(__dirname, '..'));
console.log(`Found ${bugs.length} potential bugs.`);

// Create issues for the first 3 to prevent spam
bugs.slice(0, 3).forEach(bug => {
    createGitHubIssue(bug);
});
