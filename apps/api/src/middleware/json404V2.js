import{fail}from"../utils/response.js";
export const json404V2=(req,res)=>fail(res,`Route ${req.method} ${req.path} not found`,404);