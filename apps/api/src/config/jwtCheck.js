if(process.env.NODE_ENV!=="development"&&!process.env.JWT_SECRET){console.error("FATAL: JWT_SECRET must be set");process.exit(1);}
export const JWT_SECRET=process.env.JWT_SECRET||"dev-secret";