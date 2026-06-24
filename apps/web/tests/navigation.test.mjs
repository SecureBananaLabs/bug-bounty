import test from "node:test";
import assert from "node:assert/strict";
import { isActiveNavigationLink, navigationLinks } from "../components/navigation.mjs";

test("home is only active on the root path", () => {
  assert.equal(isActiveNavigationLink("/", navigationLinks[0]), true);
  assert.equal(isActiveNavigationLink("/jobs", navigationLinks[0]), false);
});

test("nested jobs routes remain active for the jobs nav item", () => {
  assert.equal(isActiveNavigationLink("/jobs", navigationLinks[1]), true);
  assert.equal(isActiveNavigationLink("/jobs/post", navigationLinks[1]), true);
  assert.equal(isActiveNavigationLink("/jobs/123", navigationLinks[1]), true);
});

test("freelancer routes stay active for the freelancers nav item", () => {
  assert.equal(isActiveNavigationLink("/freelancers/search", navigationLinks[2]), true);
  assert.equal(isActiveNavigationLink("/freelancers/alice", navigationLinks[2]), true);
  assert.equal(isActiveNavigationLink("/dashboard/client", navigationLinks[2]), false);
});

test("dashboard and admin links do not overlap", () => {
  assert.equal(isActiveNavigationLink("/dashboard/client/reports", navigationLinks[3]), true);
  assert.equal(isActiveNavigationLink("/dashboard/freelancer/stats", navigationLinks[4]), true);
  assert.equal(isActiveNavigationLink("/admin/settings", navigationLinks[6]), true);
  assert.equal(isActiveNavigationLink("/admin/settings", navigationLinks[3]), false);
});
