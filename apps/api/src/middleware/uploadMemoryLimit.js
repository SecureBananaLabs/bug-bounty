import multer from"multer";
export const uploadLimited=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:10}});
export const uploadSingle=uploadLimited.single("file");