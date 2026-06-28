import{ok}from"../utils/response.js";
export const healthV2=(_req,res)=>ok(res,{status:"healthy",uptime:process.uptime(),timestamp:Date.now()});