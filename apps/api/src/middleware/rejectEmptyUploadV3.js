import{fail}from"../utils/response.js";
export const rejectEmptyUploadV3=(req,res,next)=>{if(!req.file&&!req.body?.fileUrl)return fail(res,"No file provided",400);return next();};