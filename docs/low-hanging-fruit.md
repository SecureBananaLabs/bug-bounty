# Low-Hanging Fruit Issue Scanner

This repository can generate local GitHub issue drafts for small, focused follow-up work:

```bash
npm run issues:low-fruit
```

The scanner walks the repository recursively and reports signals such as:

- `TODO`, `FIXME`, and `HACK` comments
- placeholder or stub language in source files
- empty `catch` blocks
- root npm scripts that only echo placeholder text
- `node --test` scripts that target a directory instead of explicit test files
- API route files without direct smoke-test references

Each generated draft includes the limitation notice required by issue #743:

```text
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.
```

Use `--json` when another tool needs structured output:

```bash
npm run issues:low-fruit -- --json
```

Preview the issue creation payload without publishing anything:

```bash
npm run issues:low-fruit -- --create-dry-run --repo SecureBananaLabs/bug-bounty
```

Create reviewed issue drafts with the GitHub API only after explicitly providing a target repository and token:

```bash
LOW_FRUIT_GITHUB_TOKEN=github_pat_... npm run issues:low-fruit -- --create --repo SecureBananaLabs/bug-bounty
```

The scanner never publishes issues by default. In creation mode it also checks for an existing open issue with the same title before posting, which helps avoid duplicate or low-quality issue creation.

A short demo of the Markdown output, JSON output, dry-run creation preview, and submitted claim package is available at [`demos/low-hanging-fruit-demo.gif`](../demos/low-hanging-fruit-demo.gif).
