const a=require('autocannon'),fs=require('fs'),pa=require('path');
const T=process.env.BENCHMARK_URL||'http://localhost:3000',TOK=process.env.BENCHMARK_TOKEN||'';
const D=pa.join(__dirname,'results');if(!fs.existsSync(D))fs.mkdirSync(D);
const E=[
  {p:'/api/health',t:'Health'},{p:'/api/users',t:'Users'},
  {p:'/api/users/self',t:'UserSelf',a:true},{p:'/api/projects',t:'Projects'},
  {p:'/api/tasks',t:'Tasks'},{p:'/api/reports/summary',t:'Report',a:true},
  {p:'/api/webhooks/config',t:'Webhooks',a:true},{p:'/api/analytics/overview',t:'Analytics'},
  {p:'/api/deployments/status',t:'Deploys'},{p:'/api/notifications',t:'Notifs',a:true},
];
(async()=>{for(const e of E){
  const h={'Content-Type':'application/json'};if(e.a&&TOK)h['Authorization']='Bearer '+TOK;
  await new Promise(r=>{a({url:T+e.p,method:'GET',headers:h,connections:10,duration:30},(err,res)=>{
    if(err){console.error('FAIL',e.t);r();return}
    const o={endpoint:e.p,title:e.t,latency:{p50:res.latency.p50,p95:res.latency.p95,p99:res.latency.p99},requests:{avg:res.requests.average},errors:res.errors};
    fs.writeFileSync(pa.join(D,(e.p.replace(/\//g,'_')||'root')+'.json'),JSON.stringify(o,null,2));
    console.log('OK',e.t,'p99='+res.latency.p99.toFixed(2));r();
  })})
}console.log('Done')})();
