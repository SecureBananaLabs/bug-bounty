import{fail}from"../utils/response.js";
export const uploadReqV2=(req,res,next)=>{if(!req.file)return fail(res,"A file is required for this request",400);return next();};