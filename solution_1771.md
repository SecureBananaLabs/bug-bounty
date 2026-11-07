```js
// Assuming authMiddleware is already defined and working
uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);
```