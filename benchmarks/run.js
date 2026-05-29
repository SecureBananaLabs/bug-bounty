#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLTo0Path(import.meta.url));

// Import the benchmark module
import { runAllBenchmarks, saveResults } from './benchmark.js';

(async () => {
  try {
    const results = await runAllBenchmarks();
    saveResults(results);
    console.log('Benchmarks completed and results saved.');
  } catch (err) {
    console.error('Benchmark failed:', err);
  }
})();