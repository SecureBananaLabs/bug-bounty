 ```diff
--- a/.github/workflows/low-hanging-fruit.yml
+++ b/.github/workflows/low-hanging-fruit.yml
@@ -0,0 +1,101 @@
+name: Low Hanging Fruit Automation
+
+on:
+  schedule:
+    - cron: '0 0 * * 0'
+  workflow_dispatch:
+
+permissions:
+  issues: write
+  contents: read
+
+jobs:
+  detect-and-create-issues:
+    runs-on: ubuntu-latest
+    steps:
+      - name: Checkout repository
+        uses: actions/checkout@v4
+
+      - name: Set up Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: '20'
+
+      - name: Detect low hanging fruit and create issues
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: |
+          #!/bin/bash
+          set -e
+
+          # Function to create an issue
+          create_issue() {
+            local title="$1"
+            local body="$2"
+            local labels="$3"
+            
+            # Check if similar issue already exists
+            local existing
+            existing=$(gh issue list --repo "$GITHUB_REPOSITORY" --search "$title" --json number --jq 'length' 2>/dev/null || echo "0")
+            
+            if [ "$existing" -gt 0 ]; then
+              echo "Issue already exists for: $title"
+              return 0
+            fi
+            
+            gh issue create \
+              --repo "$GITHUB_REPOSITORY" \
+              --title "$title" \
+              --body "$body" \
+              --label "$labels"
+          }
+
+          # Detect missing documentation
+          if [ ! -f "CONTRIBUTING.md" ] || [ ! -s "CONTRIBUTING.md" ]; then
+            create_issue \
+              "Missing or empty CONTRIBUTING.md guidelines" \
+              "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.\n\nThe repository is missing comprehensive contribution guidelines. Please add a CONTRIBUTING.md file with:\n- Code style guidelines\n- Pull request process\n- Issue reporting templates\n- Development setup instructions" \
+              "bug,documentation,good first issue,help wanted,bug bounty,AI agent friendly,bounty,💎 Bounty"
+          fi
+
+          # Detect missing tests
+          if [ ! -d "apps/web/__tests__" ] && [ ! -d "apps/web/tests" ] && [ ! -d "apps/web/test" ]; then
+            create_issue \
+              "Missing frontend test suite" \
+              "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.\n\nThe Next.js frontend (apps/web) lacks a test suite. Please add:\n- Unit tests for components\n- Integration tests for API calls\n- Test configuration (Jest/Vitest)\n- Coverage reporting" \
+              "bug,good first issue,help wanted,bug bounty,AI agent friendly,bounty,💎 Bounty"
+          fi
+
+          # Detect missing API tests
+          if [ ! -d "apps/api/__tests__" ] && [ ! -d "apps/api/tests" ] && [ ! -d "apps/api/test" ]; then
+            create_issue \
+              "Missing backend API test suite" \
+              "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.\n\nThe Express.js backend (apps/api) lacks a test suite. Please add:\n- Unit tests for controllers and services\n- Integration tests for API routes\n- Mock database setup for tests\n- Test configuration (Jest/Vitest/Supertest)" \
+              "bug,good first issue,help wanted,bug bounty,AI agent friendly,bounty,💎 Bounty"
+          fi
+
+          # Detect missing environment documentation
+          if [ ! -f ".env.example" ] && [ ! -f ".env.template" ]; then
+            create_issue \
+              "Missing .env.example file for environment configuration" \
+              "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.\n\nThe repository lacks an .env.example file. Please add:\n- All required environment variables\n- Descriptions for each variable\n- Development vs production values\n- Integration-specific variables (Stripe, OAuth, etc.)" \
+              "bug,documentation,good first issue,help wanted,bug bounty,AI agent friendly,bounty,💎 Bounty"
+          fi
+
+          # Detect missing CI/CD configuration
+          if [ ! -d ".github/workflows" ] || [ -z "$(ls -A .github/workflows/*.yml 2>/dev/null)" ]; then
+            create_issue \
+              "Missing CI/CD pipeline configuration" \
+              "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.\n\nThe repository lacks CI/CD workflows. Please add:\n- Lint and format checks\n- Test execution on PR\n- Build verification\n- Dependency vulnerability scanning" \
+              "bug,documentation,good first issue,help wanted,bug bounty,AI agent friendly,bounty,💎 Bounty"
+          fi
+
+          # Detect missing pre-commit hooks
+          if [ ! -f ".husky/pre-commit" ] && [ ! -f ".pre-commit-config.yaml" ]; then
+            create_issue \
+              "Missing pre-commit hooks for code quality" \
+              "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.\n\nThe repository lacks pre-commit hooks. Please add:\n- Husky configuration\n- Lint-staged for running linters on git staged files\n- Prettier formatting checks\n- TypeScript type checking" \
+              "bug,good first issue,help wanted,