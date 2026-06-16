# Low-Hanging Fruit Bug Scanner

**SBL Bounty #743** — Automated tool for detecting common, low-hanging fruit security and code-quality issues in the [SecureBananaLabs/bug-bounty](https://github.com/SecureBananaLabs/bug-bounty) codebase.

## Features

Scans for **6 categories** of issues:

| Category | Severity | Examples |
|----------|----------|---------|
| **Missing Input Validation** | High | Express controllers that accept `req.body`/`req.params` without calling `.parse()` on a Zod schema |
| **Error Handling Gaps** | Medium | Async handlers with `await` but no `try/catch`; catch blocks that swallow errors |
| **Hardcoded Secrets** | Critical/High | Default JWT secrets, inline API keys, Stripe test keys in non-test files |
| **Unsafe Patterns** | Critical/High | `eval()`, `exec()`, `.innerHTML`, `dangerouslySetInnerHTML`, `new Function()` |
| **Missing Type Checking** | Low | Exported functions in controllers/services without JSDoc `@param` annotations |
| **Unused Imports** | Low | Imported symbols never referenced in the file (JS and Python) |

## Quick Start

```bash
# Dry-run against the bug-bounty repo (default)
python3 low_hanging_fruit_scanner.py

# Scan a specific directory
python3 low_hanging_fruit_scanner.py --repo-dir /path/to/bug-bounty

# Only high-severity and above
python3 low_hanging_fruit_scanner.py --min-severity high

# Create GitHub issues for each finding
export GITHUB_TOKEN="ghp_..."
python3 low_hanging_fruit_scanner.py --create

# Limit to 10 issues
python3 low_hanging_fruit_scanner.py --create --max-issues 10
```

## Modes

### Dry-run (default)
Prints all findings to stdout with severity, category, title, and location. No external API calls.

### `--create` mode
Creates a **separate GitHub issue** for each finding in the configured repository. Each issue includes:

- The finding details (severity, file, line, description)
- A suggested fix
- **The required creator-only limitation text** (required by SBL #743):
  > *This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.*

### Authentication
The GitHub token is read from:
1. `GITHUB_TOKEN` environment variable, or
2. `~/.hermes/.env` (`GITHUB_TOKEN=ghp_...`)

## Requirements

- Python 3.10+
- Standard library only (no pip dependencies)
- Git (for local repository operations)
- GitHub token (for `--create` mode)

## Example Output

```
🔍 Scanning repository at: /home/user/bug-bounty

Scanned 75 files across the repository.
Total findings: 39
  Critical: 1
      High: 8
    Medium: 10
       Low: 20

📋 Detailed findings (showing 39 of 39 total):

[  1/39] [critical] [Hardcoded Secrets             ] Hardcoded JWT secret default value found  (apps/api/src/config/env.js:4)
[  2/39] [high    ] [Missing Input Validation      ] Controller `createPayment` accepts user input without Zod validation  (apps/api/src/controllers/paymentController.js:4)
[  3/39] [high    ] [Missing Input Validation      ] Controller `postUser` accepts user input without Zod validation  (apps/api/src/controllers/userController.js:15)
...
```

## Architecture

```
low_hanging_fruit_scanner.py
├── Finding / ScanResult       # Data model
├── BaseScanner                # Abstract scanner
├── MissingValidationScanner   # Zod schema checks
├── ErrorHandlingScanner       # try/catch & error forwarding
├── HardcodedSecretsScanner    # Secrets detection
├── UnsafePatternsScanner      # eval/innerHTML detection
├── MissingTypeCheckScanner    # JSDoc annotation checks
├── UnusedImportScanner        # Dead import detection
├── GitHubIssueCreator         # GitHub API client
└── main()                     # CLI orchestrator
```

Each scanner is independent and can be extended or disabled with minimal code changes.

## Submitting to SBL

The tool auto-creates issues with the required limitation text. When submitting a PR:

1. Include the scanner script and this README
2. Set the PR body to include `/claim #743`
3. The scanner can be run against any clone of the bug-bounty repo

## License

MIT — part of the SecureBananaLabs bug bounty program (#743).
