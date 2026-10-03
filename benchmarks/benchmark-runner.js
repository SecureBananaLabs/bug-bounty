import autocannon from 'autocannon';
import fs from 'fs';

const app = 'apps/api/src/benchmark';
const autocannon = require('autocannon');

function main() {
  const benchmark = await autocannon({
    url: 'http://localhost:3000/api/benchmark',
    connections: 10,
    duration: '10 seconds',
    method: 'GET',
    body: JSON.stringify({ hello: 'world' }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  autocannon.track(benchmark, {
    render: true,
    reporter: (event) => {
      console.log('Benchmark', event);
    }
  });
}

function run() {
  const url = 'http://localhost:3000/api/benchmark';
  const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
  };
  const result = await autocannon(url, options);
  console.log('Benchmark', result);
  fs.writeFileSync('./benchmarks/results.txt', result);
}

run();