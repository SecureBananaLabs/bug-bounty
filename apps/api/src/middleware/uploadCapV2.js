import multer from"multer";
export const uploadCapV2=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
export const capUpload=uploadCapV2.single("file");