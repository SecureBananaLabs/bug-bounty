import{createApp}from"./app.js";
const app=createApp();
const PORT=parseInt(process.env.PORT||"0",10);
const server=app.listen(PORT,()=>{
  const addr=server.address();
  const port=typeof addr==="object"?addr?.port:PORT;
  console.log("API listening on port "+port+(process.env.PORT?"":"(ephemeral)"));
});
import{gracefulShutdown}from"./lib/gracefulShutdown.js";
gracefulShutdown(server);
