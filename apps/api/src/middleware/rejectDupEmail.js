import{fail}from"../utils/response.js";
const emails=new Set();
export const rejectDuplicateEmail=(req,res,next)=>{const e=(req.body?.email||"").toLowerCase().trim();if(emails.has(e))return fail(res,"Email already registered",409);return next();};