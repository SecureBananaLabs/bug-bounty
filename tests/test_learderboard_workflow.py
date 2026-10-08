import unittest
from pathlib import Path


class TestLeaderboardWorkflow(unittest.TestCase):
    def test_checkout_is_pinned_to_sha(self):
        """Regression: actions/checkout must be pinned to a full-length SHA, not a mutable tag."""
        workflow_path = Path(".github/workflows/update-pr-leaderboard.yml")
        content = workflow_path.read_text()

        for line in content.splitlines():
            if "uses:" in line and "actions/checkout" in line:
                self.assertNotIn("@v", line, "checkout action must not use a mutable tag like @v4")
                self.assertNotIn("@main", line, "checkout action must not use a mutable branch ref")
                # Full-length SHA is 40 hex characters
                import re
                sha_match = re.search(r"@[0-9a-f]{40}", line)
                self.assertIsNotNone(sha_match, "checkout action must be pinned to a full-length commit SHA")
                break
        else:
            self.fail("Could not find actions/checkout usage in workflow")


if __name__ == "__main__":
    unittest.main()
