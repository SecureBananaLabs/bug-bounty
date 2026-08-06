import subprocess
import json
import re
from collections import namedtuple

Issue = namedtuple('Issue', ['repo', 'number', 'title', 'labels', 'bounty'])

def run_command(cmd):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command {cmd}: {e.stderr}")
        return ""

def extract_bounty(text):
    # Search for patterns like $100, 100$, 100 USD, 100 RTC
    match = re.search(r'(\$?\d+(?:\.\d+)?\s*(?:USD|RTC|\$))', text)
    return match.group(1) if match else "Not specified"

def is_claimed(repo, number):
    # Check the last 5 comments for "claiming" keywords
    cmd = f"gh issue view {repo}#{number} --json comments"
    output = run_command(cmd)
    if not output: return False
    
    try:
        data = json.loads(output)
        comments = data.get('comments', [])
        keywords = ['claim', 'working on', 'started', 'taking this', 'assign me']
        for comment in comments[-5:]:
            body = comment.get('body', '').lower()
            if any(kw in body for kw in keywords):
                return True
    except json.JSONDecodeError:
        pass
    return False

def scout_bounties():
    queries = [
        'label:bounty state:open',
        'label:"bug bounty" state:open',
        ' "bounty $" state:open',
        ' "reward $" state:open'
    ]
    
    found_issues = []
    seen = set()

    print("🚀 Scouting for Low Hanging Fruit bounties...")

    for q in queries:
        print(f"Searching query: {q}")
        # Use gh search issues with JSON output for reliable parsing
        cmd = f"gh search issues '{q}' --json repository,number,title,labels --limit 50"
        output = run_command(cmd)
        if not output: continue
        
        try:
            issues_data = json.loads(output)
            for item in issues_data:
                # Use the correct field for the repository full name
                repo = item.get('repository', {}).get('fullName') if isinstance(item.get('repository'), dict) else item.get('repository', 'unknown')
                num = item['number']
                key = f"{repo}#{num}"
                if key in seen: continue
                
                title = item['title']
                labels = [l['name'] for l in item['labels']]
                bounty = extract_bounty(title)
                
                if not is_claimed(repo, num):
                    found_issues.append(Issue(repo, num, title, labels, bounty))
                
                seen.add(key)
        except json.JSONDecodeError:
            continue

    return found_issues

def generate_report(issues):
    if not issues:
        return "No unclaimed LHF bounties found."

    report = "# 🎯 LHF Bounty Opportunities Report\n\n"
    report += "| Repository | Issue | Bounty | Title |\n"
    report += "|---|---|---|---|\n"
    
    # Sort by bounty amount if possible (simple heuristic)
    for iss in issues:
        report += f"| {iss.repo} | #{iss.number} | {iss.bounty} | {iss.title} |\n"
    
    return report

if __name__ == "__main__":
    bounties = scout_bounties()
    report = generate_report(bounties)
    with open("OPPORTUNITIES.md", "w") as f:
        f.write(report)
    print(f"✅ Found {len(bounties)} unclaimed opportunities. Report saved to OPPORTUNITIES.md")
