import{ok}from"../utils/response.js";
let users=[],jobs=[],proposals=[];
export const getMetrics=(_req,res)=>ok(res,{users:users.length,jobs:jobs.length,proposals:proposals.length,timestamp:new Date().toISOString()});
export{users,jobs,proposals};