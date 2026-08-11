import{ok}from"../utils/response.js";
export const healthCheck=(_req,res)=>ok(res,{status:"ok",timestamp:new Date().toISOString()});