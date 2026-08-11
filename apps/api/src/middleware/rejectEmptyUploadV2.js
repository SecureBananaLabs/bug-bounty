import{fail}from"../utils/response.js";
export const rejectEmptyUploadV2=(req,res,next)=>{if(!req.file)return fail(res,"Upload requires a file",400);return next();};