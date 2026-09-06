import jwt from"jsonwebtoken";import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const noAdminReg=(req,res,next)=>{if(req.body?.role&&!PUB.has(req.body.role))return fail(res,"Admin role not allowed",400);return next();};
export const validateRefresh=(req,res,next)=>{const rt=req.body?.refreshToken;if(!rt)return fail(res,"refreshToken required",400);try{req.refreshPayload=jwt.verify(rt,process.env.JWT_SECRET||"s");return next();}catch{return fail(res,"Invalid refresh token",401);}};