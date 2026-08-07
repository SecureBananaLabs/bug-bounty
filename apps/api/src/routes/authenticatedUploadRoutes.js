export function registerAuthenticatedUploadRoute(router, authMiddleware, uploadMiddleware, uploadFileController) {
  router.post("/", authMiddleware, uploadMiddleware.single("file"), uploadFileController);
  return router;
}
