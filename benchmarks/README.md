    API Benchmark Suite
    
    Benchmarks all API endpoints under /api/ using autocannon.
    
    Setup
    
    \\\`bash
    cd benchmarks
    npm install
    \\\`
    
    Usage
    
    \\\`bash
    Full benchmark (30s, 10 connections)
    npm run benchmark
    
    CI smoke test (10s, 5 connections)
    npm run benchmark:ci
    \\\`
    
    Configuration
    
    Copy \.env.benchmark\ to \.env\ and adjust:
    
    | Variable              | Default               | Description                  |
    |-----------------------|-----------------------|------------------------------|
    | BENCHMARK_HOST        | http://localhost:4000 | API server URL               |
    | BENCHMARK_AUTH_TOKEN  | (empty)               | Bearer token for auth routes |
    | BENCHMARK_DURATION    | 30                    | Test duration in seconds     |
    | BENCHMARK_CONNECTIONS | 10                    | Concurrent connections       |
    
    Output
    
    Results are written to \results/\:
    - \full-results.json\ — comprehensive JSON report
    - \benchmark-report.html\ — formatted HTML report
    - Per-endpoint JSON files
    
    Endpoints Covered
    
    - GET /health
    - POST /api/auth/register, login, refresh
    - GET|POST /api/users/, /jobs/, /proposals/, /reviews/, /messages/, /notifications/
    - POST /api/payments/, /api/uploads/
    - GET /api/search/
    - GET /api/admin/metrics (auth-protected)
