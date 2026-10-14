import multer from"multer";
const MB5=5*1024*1024;
export const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:MB5,files:1},fileFilter:(_,f,cb)=>cb(null,["image/jpeg","image/png","application/pdf","text/plain"].includes(f.mimetype))});
export const uploadSingle=upload.single("file");
