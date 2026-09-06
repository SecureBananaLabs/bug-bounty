import multer from"multer";
export const uploadWithLimit=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
export const uploadSingle=uploadWithLimit.single("file");