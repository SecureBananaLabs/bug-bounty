export const toSnapshot=(record)=>record&&typeof record==="object"?{...record}:record;
export const withSnapshot=(fn)=>async(req,res,...args)=>{const result=await fn(req,res,...args);return result;};