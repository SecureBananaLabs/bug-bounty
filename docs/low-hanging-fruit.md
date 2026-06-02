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

The scanner does not publish issues automatically. Contributors should review the drafts before posting them to avoid duplicate or low-quality issue creation.
