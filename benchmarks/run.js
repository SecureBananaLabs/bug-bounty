#!/usr/bin/env node
import os from "os";
import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET_URL || 'http://localhost:4000';
const RESULTS_DIR = path.join(__dirname, 'results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const C = { reset: '\x1b[0m', grn: '\x1b[32m', yel: '\x1b[33m', cyn: '\x1b[36m', bld: '\x1b[1m' };

async function bench(label, opts = {}) {
  const d = { url: TARGET, connections: 10, duration: 10, pipelining: 1, timeout: 5, ...opts };
  console.log(`\n  ${C.yel}${C.reset} ${C.bld}${label}${C.reset}  (${d.method||'GET'} ${d.path||d.url.replace(TARGET,'')})`);
  const r = await autocannon(d);
  const o = { label, url: `${d.method||'GET'} ${d.path||d.url.replace(TARGET,'')}`, duration: r.duration, connections: r.connections,
    latency: { p50: r.latency.p50, p95: r.latency.p90 ?? r.latency.p97_5 ?? 0, p99: r.latency.p99, avg: r.latency.average, max: r.latency.max },
    requestsPerSecond: { avg: r.requests.average, total: r.requests.total, sent: r.requests.sent },
    throughput: { avg: r.throughput.average, total: r.throughput.total },
    errors: r.errors, timeouts: r.timeouts, non2xx: r.non2xx, statusCodes: r.statusCodes };
  o.errorRatePct = parseFloat((((r.errors||0)+(r.timeouts||0)+(r.non2xx||0))/((r.requests?.total)||1)*100).toFixed(2));
  fs.writeFileSync(path.join(RESULTS_DIR, label.replace(/[^a-zA-Z0-9_-]/g,'_').toLowerCase()+'.json'), JSON.stringify(o,null,2));
  const errs = (r.errors||0)+(r.timeouts||0)+(r.non2xx||0);
  console.log(`     p50=${o.latency.p50.toFixed(1)}ms p95=${o.latency.p95.toFixed(1)}ms p99=${o.latency.p99.toFixed(1)}ms req/s=${o.requestsPerSecond.avg.toFixed(0)} KB/s=${(o.throughput.avg/1024).toFixed(1)} errors=${errs}`);
  return o;
}

async function main() {
  console.log(`\nFreelanceFlow API Benchmark Suite`);
  console.log(`Target: ${TARGET}\n`);
  
  const uid = Date.now();
  const testEmail = `bm_${uid}@t.local`;
  const adminEmail = `adm_${uid}@t.local`;
  
  let res = await fetch(`${TARGET}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:testEmail,password:'benchmark99',role:'freelancer'}) });
  let data = await res.json();
  if (!data?.data?.token) { console.error('Register failed:', JSON.stringify(data)); process.exit(1); }
  const token = data.data.token;
  
  res = await fetch(`${TARGET}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:adminEmail,password:'adminBench99',role:'admin'}) });
  data = await res.json();
  const adminToken = data?.data?.token;
  
  const ah = {'Content-Type':'application/json','Authorization':`Bearer ${token}`};
  await fetch(`${TARGET}/api/jobs`, { method:'POST', headers:ah, body:JSON.stringify({title:'Bench job',description:'API benchmark job',budgetMin:100,budgetMax:1000,categoryId:'cat-b',skills:['bench']}) });
  await fetch(`${TARGET}/api/messages`, { method:'POST', headers:ah, body:JSON.stringify({body:'Hello',senderId:'u1',receiverId:'u2'}) });
  await fetch(`${TARGET}/api/notifications`, { method:'POST', headers:ah, body:JSON.stringify({title:'Test',body:'Test notification'}) });
  await fetch(`${TARGET}/api/proposals`, { method:'POST', headers:ah, body:JSON.stringify({jobTitle:'Bench job',coverLetter:'Exp',proposedRate:150}) });
  await fetch(`${TARGET}/api/reviews`, { method:'POST', headers:ah, body:JSON.stringify({reviewer:'u1',reviewee:'u2',rating:5,comment:'Great'}) });
  console.log('Seeded test data OK');
  
  const smoke = [];
  smoke.push(await bench('Health', {path:'/health',method:'GET'}));
  smoke.push(await bench('Login', {path:'/api/auth/login',method:'POST',body:JSON.stringify({email:testEmail,password:'benchmark99'}),headers:{'Content-Type':'application/json'}}));
  smoke.push(await bench('Register', {path:'/api/auth/register',method:'POST',body:JSON.stringify({email:`b2_${Date.now()}@t.local`,password:'password1234',role:'client'}),headers:{'Content-Type':'application/json'}}));
  smoke.push(await bench('List Jobs', {path:'/api/jobs',method:'GET'}));
  smoke.push(await bench('Search', {path:'/api/search?q=test',method:'GET'}));
  const ah2 = {'Content-Type':'application/json','Authorization':`Bearer ${token}`};
  smoke.push(await bench('Create Job', {path:'/api/jobs',method:'POST',body:JSON.stringify({title:'Load test',description:'Load testing',budgetMin:200,budgetMax:500,categoryId:'cat-2',skills:['load']}),headers:ah2}));
  smoke.push(await bench('List Users', {path:'/api/users',method:'GET',headers:{'Authorization':`Bearer ${token}`}}));
  smoke.push(await bench('Proposals', {path:'/api/proposals',method:'GET',headers:{'Authorization':`Bearer ${token}`}}));
  smoke.push(await bench('Messages', {path:'/api/messages',method:'GET',headers:{'Authorization':`Bearer ${token}`}}));
  smoke.push(await bench('Notifications', {path:'/api/notifications',method:'GET',headers:{'Authorization':`Bearer ${token}`}}));
  smoke.push(await bench('Reviews', {path:'/api/reviews',method:'GET',headers:{'Authorization':`Bearer ${token}`}}));
  smoke.push(await bench('Admin Metrics', {path:'/api/admin/metrics',method:'GET',headers:{'Authorization':`Bearer ${adminToken}`}}));
  
  const load = [];
  load.push(await bench('Load Health', {url:TARGET+'/health',method:'GET',connections:50,duration:20,pipelining:2}));
  load.push(await bench('Load Jobs', {url:TARGET+'/api/jobs',method:'GET',connections:50,duration:20,pipelining:2}));
  
  const ts = new Date().toISOString().replace('T',' ').substring(0,19);
  let md = `# API Benchmark Results\n\n**Date:** ${ts} UTC\n**Target:** ${TARGET}\n**Tool:** autocannon\n**Node:** ${process.version}\n\n`;
  md += `## Smoke Test (10conn × 10s × 1pipe)\n\n`;
  md += `| Endpoint | p50 | p95 | p99 | Req/s | Throughput | Errors | Err% |\n|----------|----:|----:|----:|-----:|----------:|------:|----:|\n`;
  for (const s of smoke) md += `| ${s.label} | ${s.latency.p50.toFixed(2)}ms | ${s.latency.p95?.toFixed(2)}ms | ${s.latency.p99.toFixed(2)}ms | ${s.requestsPerSecond.avg.toFixed(0)} | ${(s.throughput.avg/1024).toFixed(1)}KB/s | ${(s.errors||0)+(s.timeouts||0)+(s.non2xx||0)} | ${s.errorRatePct}% |\n`;
  md += `\n## Moderate Load (50conn × 20s × 2pipe)\n\n`;
  md += `| Endpoint | p50 | p95 | p99 | Req/s | Throughput | Errors |\n|----------|----:|----:|----:|-----:|----------:|------:|\n`;
  for (const l of load) md += `| ${l.label} | ${l.latency.p50.toFixed(2)}ms | ${l.latency.p95.toFixed(2)}ms | ${l.latency.p99.toFixed(2)}ms | ${l.requestsPerSecond.avg.toFixed(0)} | ${(l.throughput.avg/1024).toFixed(1)}KB/s | ${(l.errors||0)+(l.timeouts||0)+(l.non2xx||0)} |\n`;
  md += `\n## Env\nCPU: ${os.cpus().length} cores | RAM: ${(os.totalmem()/1024/1024/1024).toFixed(1)}GB\nIn-memory store. All endpoints tested with mock data.\n`;
  fs.writeFileSync(path.join(RESULTS_DIR, 'summary.md'), md);
  console.log(`\nBenchmark complete. Results in ${RESULTS_DIR}\n`);
}
main().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});