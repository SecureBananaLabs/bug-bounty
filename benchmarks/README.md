# API Benchmark Suite

This directory contains performance benchmarks for the API endpoints.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment template:
```bash
cp .env.benchmark.template .env.benchmark
```

3. Edit `.env.benchmark` to configure your target server

## Running Benchmarks

Run all benchmarks:
```bash
npm run benchmark
```

Run specific endpoint:
```bash
npm run benchmark -- --endpoint /api/auth/login
```

## Understanding Results

Results are saved to `./results` in both JSON and markdown formats.

## Performance Thresholds

Performance thresholds for CI are defined in `thresholds.json`.