import multer from"multer";
export const safeUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
