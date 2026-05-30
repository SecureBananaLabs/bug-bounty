# Low Hanging Fruit Automation Bot

A Python CLI tool that scans any codebase for common low-hanging-fruit security and code-quality issues and automatically files them as GitHub issues.

Designed for bug bounty programs and automated security review. Originally created for issue [#743](https://github.com/SecureBananaLabs/bug-bounty/issues/743) of SecureBananaLabs/bug-bounty.

## What It Scans

| Category | Severity | Description |
|---|---|---|
| Hardcoded Secrets | High | API keys, passwords, tokens, private keys, hardcoded env vars |
| SQL/NoSQL Injection Risk | High | Raw queries with string interpolation, unparameterized queries |
| Race Condition Risk | Medium | Read-then-write sequences without transactions or locking |
| Missing Error Handling | Medium | Async functions with `await` but no try/catch |
| Missing Input Validation | Medium | Route handlers using `req.body`/`req.query` without validation |
| Missing Rate Limiting | Medium | Server entry points without rate limiting middleware |
| Console.log Left in Production | Low | Console statements that may have been left behind |
| TODO/FIXME Comments | Low | Incomplete or problematic code markers |
| TypeScript `any` Usage | Low | `any` type annotations that reduce type safety |

## Requirements

- Python 3.8+
- `requests` library

```bash
pip install requests
```

## Usage

### Basic Scan (Dry Run)

```bash
python scan.py --repo SecureBananaLabs/bug-bounty --path /path/to/repo --dry-run
```

### Create GitHub Issues

```bash
python scan.py --repo SecureBananaLabs/bug-bounty --path /path/to/repo --token-file /tmp/.gh_token
```

### With Custom Options

```bash
python scan.py \
  --repo owner/repo \
  --path /path/to/repo \
  --token-file /tmp/.gh_token \
  --max-issues 30 \
  --output findings.json
```

### Options

| Flag | Required | Default | Description |
|---|---|---|---|
| `--repo` | Yes | — | GitHub repo in `owner/repo` format |
| `--path` | Yes | — | Local path to the repository to scan |
| `--dry-run` | No | `false` | Scan only, don't create issues |
| `--token-file` | No | `/tmp/.gh_token` | Path to file containing GitHub token |
| `--max-issues` | No | `50` | Maximum number of issues to create |
| `--output` | No | — | Write findings as JSON to this file |

## GitHub Token

The token file should contain a GitHub Personal Access Token with `repo` scope (for private repos) or `public_repo` scope (for public repos).

Create one at: https://github.com/settings/tokens

```bash
echo "ghp_xxxxxxxxxxxxxxxxxxxx" > /tmp/.gh_token
chmod 600 /tmp/.gh_token
```

## Issue Format

Each created issue includes:

- The finding category, severity, file path, and line number
- A code snippet showing the issue
- A description of the problem
- The required disclaimer text for exclusive claiming

## Excluded Files

The scanner automatically skips:

- `node_modules/`, `.git/`, `.next/`, `dist/`, `build/`
- `coverage/`, `vendor/`, `__pycache__/`
- Lock files (`package-lock.json`, `yarn.lock`)
- Minified files (`*.min.js`, `*.min.css`)
- Generated files (`*.generated.*`, `*.d.ts`)
- Test files (for `console.log` checks)

## Sample Output

See [sample-scan.md](sample-scan.md) for an example scan result.

## License

MIT
