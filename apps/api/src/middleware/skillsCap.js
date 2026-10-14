import{fail}from"../utils/response.js";
const MAX_SKILLS=10;
export const skillsCap=(req,res,next)=>{if(Array.isArray(req.body?.skills)&&req.body.skills.length>MAX_SKILLS)return fail(res,`Maximum ${MAX_SKILLS} skills allowed`,400);return next();};