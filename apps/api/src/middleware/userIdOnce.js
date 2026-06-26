export const generateUserId=()=>crypto.randomUUID();
export const withSingleId=(handler)=>async(req,res,next)=>{req._userId=req._userId||generateUserId();return handler(req,res,next);};