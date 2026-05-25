import { runAllBenchmarks } from './benchmark.js';

async function main() {
  try {
    const results = await runAllBenchmarks();
    console.log('Benchmark completed. Results:', results);
    // Process and output results
    console.log('Benchmarking complete');
  } catch (error) {
    console.error('Benchmark failed', error);
  }
}

main();