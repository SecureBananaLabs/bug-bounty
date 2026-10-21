import { fileURLToPath } from 'node:url';
import { validateLoad } from './core.mjs';

export function readConfig(argv = process.argv.slice(2), env = process.env) {
  const flags = new Map();
  const allowed = new Set(['smoke', 'help', 'host', 'requests', 'concurrency', 'rate', 'warmup', 'timeout-ms', 'thresholds', 'output']);
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].startsWith('--') ? argv[i].slice(2) : '';
    if (!allowed.has(name) || flags.has(name)) throw new Error('Unknown or duplicate benchmark argument');
    if (name === 'smoke' || name === 'help') flags.set(name, true);
    else {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}`);
      flags.set(name, value);
    }
  }
  const smoke = flags.has('smoke');
  const value = (name, fallback) => flags.get(name) ?? env[`BENCHMARK_${name.replaceAll('-', '_').toUpperCase()}`] ?? fallback;
  const host = value('host', '127.0.0.1');
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Only loopback benchmark hosts are allowed');
  const config = {
    help: flags.has('help'), mode: smoke ? 'smoke' : 'full', host: host === 'localhost' ? '127.0.0.1' : host,
    requests: Number(value('requests', smoke ? 50 : 200)),
    concurrency: Number(value('concurrency', smoke ? 1 : 4)),
    rate: Number(value('rate', smoke ? 50 : 100)),
    warmup: Number(value('warmup', 5)), timeoutMs: Number(value('timeout-ms', 1000)),
    thresholds: value('thresholds', fileURLToPath(new URL('./thresholds.json', import.meta.url))),
    output: value('output', fileURLToPath(new URL('./results/', import.meta.url)))
  };
  validateLoad(config);
  if (!Number.isInteger(config.warmup) || config.warmup < 0 || config.warmup > 20) throw new Error('Invalid warmup count (0..20)');
  if (smoke && config.concurrency > 2) throw new Error('Smoke concurrency must be 1 or 2');
  return config;
}

export const help = `Usage: npm run benchmark -- [options]
  --smoke                Low-concurrency profile (50 samples, concurrency 1)
  --host HOST            Local bind only: 127.0.0.1, localhost or ::1
  --requests N           Measured attempts per endpoint, 1..1000 (full: 200)
  --concurrency N        1..32, or 1..2 in smoke (full: 4)
  --rate N               Scheduled requests/second, 0=unpaced (full: 100)
                         Positive rates require a schedule <=2147483647 ms
  --warmup N             Unmeasured attempts after semantic preflight, 0..20
  --timeout-ms N         Absolute request deadline, 10..10000 (default: 1000)
  --thresholds PATH      Exact per-endpoint threshold JSON
  --output DIRECTORY     Write latest.json and latest.md
  --help                 Print this help
The suite always starts its own local API children. No existing or remote service
is targeted. See benchmarks/README.md and .env.benchmark.example for configuration.
`;
