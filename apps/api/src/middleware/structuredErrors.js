import{fail}from"../utils/response.js";
export function structuredErrors(err,req,res,next){if(err?.name==="ZodError"||err?.issues)return res.status(400).json({success:false,message:"Validation failed",errors:err.issues?.map(i=>({field:i.path.join("."),message:i.message}))||[]});
return next(err);}