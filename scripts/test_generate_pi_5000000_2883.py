import hashlib
import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("generate_pi_5000000_2883.py")


def load_module():
    spec = importlib.util.spec_from_file_location("generate_pi_5000000_2883", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Pi5000000ArtifactTests(unittest.TestCase):
    def test_script_exists_for_issue_2883(self):
        self.assertTrue(SCRIPT_PATH.exists(), "Expected generator/verifier script to exist")

    def test_markdown_round_trips_grouped_pi_content(self):
        module = load_module()
        compact_content = "3" + module.ISSUE_SEED + "123456789012345678901"

        markdown = module.format_markdown(
            compact_content,
            decimal_places=len(compact_content) - 1,
            generated_at="2026-06-11T00:00:00Z",
        )

        self.assertIn("<!-- BEGIN_PI_5000000 -->", markdown)
        self.assertIn("<!-- END_PI_5000000 -->", markdown)
        self.assertIn("issue #2883", markdown)
        self.assertIn("3.", markdown)
        self.assertIn("1415926535 8979323846", markdown)
        self.assertEqual(module.extract_compact_content(markdown), compact_content)

    def test_verify_markdown_rejects_wrong_seed(self):
        module = load_module()
        compact_content = "3" + ("0" * len(module.ISSUE_SEED))
        markdown = (
            f"{module.BEGIN_MARKER}\n"
            "```text\n"
            f"3.\n{compact_content[1:]}\n"
            "```\n"
            f"{module.END_MARKER}\n"
        )

        with self.assertRaisesRegex(ValueError, "issue seed"):
            module.verify_markdown(markdown, decimal_places=len(compact_content) - 1)

    def test_verify_markdown_reports_length_and_sha(self):
        module = load_module()
        compact_content = "3" + module.ISSUE_SEED + "1234567890"
        expected_sha = hashlib.sha256(("3." + compact_content[1:]).encode()).hexdigest()
        markdown = module.format_markdown(
            compact_content,
            decimal_places=len(compact_content) - 1,
            generated_at="2026-06-11T00:00:00Z",
        )

        report = module.verify_markdown(markdown, decimal_places=len(compact_content) - 1)

        self.assertEqual(report["decimal_places"], len(compact_content) - 1)
        self.assertEqual(report["sha256"], expected_sha)
        self.assertEqual(report["first_100_decimals"], module.ISSUE_SEED)

    def test_parallel_download_keeps_chunk_order(self):
        module = load_module()
        compact_content = "3" + module.ISSUE_SEED + "1234567890"

        def fake_fetch(start, number_of_digits):
            return compact_content[start : start + number_of_digits]

        downloaded = module.download_pi_content(
            decimal_places=len(compact_content) - 1,
            chunk_size=17,
            workers=4,
            fetcher=fake_fetch,
        )

        self.assertEqual(downloaded, compact_content)

    def test_download_retries_transient_chunk_failures(self):
        module = load_module()
        compact_content = "3" + module.ISSUE_SEED + "1234567890"
        attempts_by_start = {}

        def flaky_fetch(start, number_of_digits):
            attempts_by_start[start] = attempts_by_start.get(start, 0) + 1
            if start == 17 and attempts_by_start[start] == 1:
                raise RuntimeError("temporary network failure")
            return compact_content[start : start + number_of_digits]

        downloaded = module.download_pi_content(
            decimal_places=len(compact_content) - 1,
            chunk_size=17,
            workers=2,
            fetcher=flaky_fetch,
            retries=2,
        )

        self.assertEqual(downloaded, compact_content)
        self.assertEqual(attempts_by_start[17], 2)


if __name__ == "__main__":
    unittest.main()
