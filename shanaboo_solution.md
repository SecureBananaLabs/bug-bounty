Looking at the issue, I need to fix the freelancer profile route to properly look up mock profiles by username instead of just showing placeholder text. The problem is in the `/freelancers/[username]` route not resolving the mock profile data.

Let me examine what files I need to modify. Based on the repository structure, this is likely a Next.js application, so the freelancer profile route would be in the app router files.

```diff
--- a/apps/web/lib/mock.ts
+++ b/apps/web/lib/mock.ts
---