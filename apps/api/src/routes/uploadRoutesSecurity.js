export function applyUploadAuthProtection(router, uploadMiddleware, authMiddleware, uploadFileHandler) {
  router.post("/", authMiddleware, uploadMiddleware.single("file"), uploadFileHandler);
  return router;
}
