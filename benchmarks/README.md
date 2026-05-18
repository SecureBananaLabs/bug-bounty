# Express API Benchmarking Suite

An automated, high-fidelity load testing suite constructed using `autocannon` to baseline, profile, and bottleneck-test all Freelance Platform REST endpoints.

## Setup & Onboarding

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```
2. Configure the testing environment by copying the benchmark example env configuration:
   ```bash
   cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
   ```
3. Edit `benchmarks/.env.benchmark` with the target testing server host and authorization token to access secure routes.

## Executing Benchmarks

Run the benchmark suite against the active server:
```bash
npm run benchmark
```
