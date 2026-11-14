```js
import authMiddleware from './authMiddleware';

uploadRoutes.post("/", upload.single("file"), authMiddleware, uploadFile);
```