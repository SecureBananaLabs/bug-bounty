import{createApp}from"./app.js";
const app=createApp();
const server=app.listen(parseInt(process.env.PORT||"0",10),()=>{
  const a=server.address();
  const port=typeof a==="object"?a?.port:process.env.PORT;
  console.log("API listening on port "+port);
});
import{gracefulShutdown}from"./lib/gracefulShutdown.js";
gracefulShutdown(server);
