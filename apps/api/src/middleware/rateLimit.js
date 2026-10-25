import rateLimit from"express-rate-limit";
export function createApiLimiter(){
  return rateLimit({
    windowMs:15*60*1000,
    max:100,
    standardHeaders:true,
    legacyHeaders:false,
    message:{success:false,message:"Too many requests, please try again later"},
  });
}
// Legacy export for existing usage
export const apiLimiter=createApiLimiter();
