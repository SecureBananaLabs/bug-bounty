import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routeSource = readFileSync(
  new URL("../routes/notificationRoutes.js", import.meta.url),
  "utf8"
);

test("notification list route requires bearer authentication", () => {
  assert.match(
    routeSource,
    /import \{ authMiddleware \} from "\.\.\/middleware\/auth\.js";/
  );
  assert.match(
    routeSource,
    /notificationRoutes\.get\("\/", authMiddleware, getNotifications\);/
  );
});

test("notification creation route remains unchanged", () => {
  assert.match(routeSource, /notificationRoutes\.post\("\/", postNotification\);/);
});
