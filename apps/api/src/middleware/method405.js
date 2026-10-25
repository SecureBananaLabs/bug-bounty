import{fail}from"../utils/response.js";
export const json405=(allowed)=>(_req,res)=>{res.setHeader("Allow",allowed.join(", "));fail(res,"Method not allowed. Supported: "+allowed.join(", "),405);};