export const config={
  port:parseInt(process.env.PORT||"4000",10),
  jwtSecret:process.env.JWT_SECRET,
  nodeEnv:process.env.NODE_ENV||"development",
};
if(config.nodeEnv==="production"&&!config.jwtSecret){
  console.error("FATAL: JWT_SECRET must be set in production");
  process.exit(1);
}
