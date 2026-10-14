const prod=process.env.NODE_ENV==="production";
if(prod&&!process.env.JWT_SECRET){console.error("FATAL: JWT_SECRET required in production");process.exit(1);}
export const JWT_SECRET=process.env.JWT_SECRET||(prod?undefined:"dev-secret");