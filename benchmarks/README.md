# API Benchmarks

This suite runs reproducible API benchmarks with `autocannon` and writes both JSON and Markdown reports to `benchmarks/results/`.

## Setup

1. Start the API locally:

```sh
npm run start -w apps/api
```

2. Optional: copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and adjust the target, request amount, or auth token.

3. Run the full local suite:

```sh
npm run benchmark
```

4. Run the low-volume smoke gate used by CI:

```sh
npm run benchmark:smoke
```

The default full benchmark covers every endpoint listed in `benchmarks/endpoints.json`. The CI smoke benchmark runs the entries marked with `"smoke": true` so pull requests get a fast regression gate without turning every endpoint benchmark into a required CI load test. Increase `BENCHMARK_AMOUNT` and `BENCHMARK_CONNECTIONS` for stronger load tests against a target configured for benchmarking.
