import { readFile } from 'node:fs/promises';
import { readConfig, help } from './config.mjs';
import { scenarios } from './scenarios.mjs';
import { requestOnce, runLoad, validateCoverage, evaluateEndpoint } from './core.mjs';
import { startServer, prepareScenario, checkDefaultLimiter } from './server.mjs';
import { metadata, evaluateReport, writeReports } from './report.mjs';

let activeServer;
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(signal, async () => {
    await activeServer?.stop();
    process.exit(code);
  });
}

async function run(config) {
  const report = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), mode: config.mode, passed: false,
    config: { host: config.host, requests: config.requests, concurrency: config.concurrency, rate: config.rate, warmup: config.warmup, timeoutMs: config.timeoutMs },
    controls: {}, endpoints: [], failures: []
  };
  try {
    Object.assign(report, await metadata());
    const thresholds = JSON.parse(await readFile(config.thresholds, 'utf8'));
    if (thresholds.version !== 1) throw new Error('Unsupported threshold schema version');
    activeServer = await startServer({ host: config.host });
    try {
      validateCoverage(activeServer.routes, scenarios, thresholds.endpoints);
      report.routes = activeServer.routes;
    } finally { await activeServer.stop(); activeServer = undefined; }
    report.thresholds = thresholds.endpoints;
    console.log(`Local API benchmark | ${config.mode} | ${scenarios.length} endpoints | ${config.requests} samples each | concurrency ${config.concurrency}`);
    console.log('Scope: loopback, in-memory/stub services; production performance is not measured.');
    report.controls.defaultLimiter = await checkDefaultLimiter({ host: config.host });
    activeServer = await startServer({ host: config.host });
    try {
      const sample = await requestOnce({
        url: activeServer.url, scenario: scenarios.find((scenario) => scenario.id === 'admin-metrics'),
        context: { token: 'invalid.jwt.signature' }, timeoutMs: config.timeoutMs
      });
      report.controls.invalidToken = { passed: sample.ok === false && sample.statusCode === 401, status: sample.statusCode };
      if (!report.controls.invalidToken.passed) throw new Error('Incorrect JWT control failed');
    } finally { await activeServer.stop(); activeServer = undefined; }
    console.log('Controls: default request 201 = 429; incorrect JWT = 401.');
    for (const scenario of scenarios) {
      const entry = {
        id: scenario.id, method: scenario.method, route: scenario.route,
        payloadDescription: scenario.payloadDescription, requiresAuth: scenario.requiresAuth,
        isolation: 'fresh API process', seededRecords: scenario.seedWith ? 3 : 0, samples: 0
      };
      try {
        activeServer = await startServer({ host: config.host });
        validateCoverage(activeServer.routes, scenarios, thresholds.endpoints);
        const context = await prepareScenario(activeServer, scenario, config);
        entry.preflight = 'passed';
        const body = scenario.build(context).body;
        entry.requestBytes = body === undefined ? 0 : Buffer.byteLength(body);
        Object.assign(entry, await runLoad({ ...config, url: activeServer.url, scenario, context }));
        entry.gate = evaluateEndpoint(entry, thresholds.endpoints[scenario.id], config.requests);
      } catch (error) {
        entry.gate = { passed: false, reasons: [error.message] };
      } finally {
        await activeServer?.stop();
        activeServer = undefined;
      }
      report.endpoints.push(entry);
      console.log(`${entry.gate.passed ? 'PASS' : 'FAIL'} ${scenario.method.padEnd(4)} ${scenario.route.padEnd(35)} p99=${entry.latencyMs?.p99?.toFixed(2) ?? 'N/A'} ms  RPS=${entry.rps?.sustained?.toFixed(1) ?? 'N/A'}  errors=${entry.errorRatePct ?? 'N/A'}%`);
    }
    report.passed = evaluateReport(report, scenarios.map((scenario) => scenario.id));
  } catch (error) {
    report.failures.push(error.message);
    report.passed = false;
  } finally {
    await activeServer?.stop();
    activeServer = undefined;
  }
  report.completedAt = new Date().toISOString();
  await writeReports(report, config.output);
  console.log(`\n${report.passed ? 'PASS' : 'FAIL'}: ${report.endpoints.filter((endpoint) => endpoint.gate.passed).length}/${scenarios.length} endpoints passed.`);
  console.log(`JSON: ${config.output}/latest.json\nMarkdown: ${config.output}/latest.md`);
  for (const failure of report.failures) console.error(failure);
  return report.passed ? 0 : 1;
}

let config;
try { config = readConfig(); }
catch (error) {
  console.error(`Configuration error: ${error.message}`);
  process.exitCode = 2;
}
if (config) {
  if (config.help) console.log(help);
  else {
    try { process.exitCode = await run(config); }
    catch (error) {
      console.error(`Benchmark/report failure: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
