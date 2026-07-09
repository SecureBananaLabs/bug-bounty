1.  Locate `apps/api/src/routes/jobRoutes.js`.
2.  Import `authMiddleware` from its respective path (e.g., `../middleware/authMiddleware`).
3.  Modify the `jobRoutes.post("/", postJob);` line to `jobRoutes.post("/", authMiddleware, postJob);`.