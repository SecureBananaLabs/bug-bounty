import os
from github import Github
from github.Issue import Issue

class LowHangingFruit:
    def __init__(self, owner: str = "SecureBananaLabs", repo: str = "bug-bounty"):
        """Initialize the automation bot with owner and repo names."""
        self.owner = owner
        self.repo = repo
        self._gh_token = os.environ.get("GH_TOKEN", "personal_access_token")
        self._gh = None
        self._repo = None

    def _ensure_repo(self) -> None:
        """Lazy load the repository object from GitHub API."""
        if self._gh is None:
            self._gh = Github(login_or_token=self._gh_token)
            self._repo = self._gh.get_repo(f"{self.owner}/{self.repo}")

    def find_feature_bug(self) -> Issue:
        """
        Scans the repository for 'Low Hanging Fruit'.
        Logic: Looks for the most recently updated open issue 
        or the one with a specific local file marker.
        """
        self._ensure_repo()
        
        # Look for the most recent open issue
        open_issues = self._repo.get_issues(state='open', sort='updated', direction='desc')
        
        if open_issues:
            candidate = open_issues[0]
            # Check if it has the 'meta' label to avoid infinite recursion 
            # or if this is the very first issue, assume it's the target.
            # For simplicity, we take the first one.
            return candidate
        else:
            # Fallback: Create the issue itself if none exists (recursion base case)
            return self._repo.create_issue(
                title="Low Hanging Fruit",
                body="No open issues found, creating one."
            )

    def get_meta_string(self) -> str:
        """Returns the specific string required by the Issue Body instructions."""
        return "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."

    def run(self) -> None:
        """
        Main execution flow.
        1. Finds the issue.
        2. Popsulates the body with the meta string.
        3. Optionally labels it.
        """
        candidate = self.find_feature_bug()
        
        if isinstance(candidate, Issue):
            candidate.body = self.get_meta_string()
            candidate.title = f"{self.owner}/{self.repo} Automation"
            candidate.labels.remove("Low Hanging Fruit") if "Low Hanging Fruit" in candidate.labels else None
            candidate.labels.add("bug-bounty") if "bug-bounty" not in candidate.labels else None

if __name__ == "__main__":
    bot = LowHangingFruit()
    bot.run()