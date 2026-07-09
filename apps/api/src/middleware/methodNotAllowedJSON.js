import{fail}from"../utils/response.js";
export const methodNotAllowed=(allowed)=>(_req,res)=>{res.setHeader("Allow",allowed.join(", "));fail(res,"Method not allowed",405);};