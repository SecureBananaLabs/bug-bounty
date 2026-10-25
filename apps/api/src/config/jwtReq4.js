if(process.env.NODE_ENV==="production"&&!process.env.JWT_SECRET){console.error("FATAL: JWT_SECRET required");process.exit(1);}
export const JWT_SECRET=process.env.JWT_SECRET||"dev-only";