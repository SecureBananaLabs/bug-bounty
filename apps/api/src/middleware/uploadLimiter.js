import multer from"multer";
const MAX_FILE_SIZE_BYTES=5*1024*1024; // 5 MB
export const upload=multer({
  storage:multer.memoryStorage(),
  limits:{fileSize:MAX_FILE_SIZE_BYTES,files:1},
  fileFilter:(_req,file,cb)=>{
    const allowed=["image/jpeg","image/png","application/pdf","text/plain"];
    cb(null,allowed.includes(file.mimetype));
  },
});
