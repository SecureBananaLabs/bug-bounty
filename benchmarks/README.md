# Benchmarks

API-Leistungsbenchmarks für die FreelanceFlow-Plattform mit [k6](https://k6.io/).

## Setup

```bash
# k6 installieren (macOS / Linux)
brew install k6    # macOS
sudo apt install k6  # Debian/Ubuntu

# Konfiguration kopieren
cp .env.benchmark.example .env.benchmark
# → BASE_URL, BENCHMARK_EMAIL etc. anpassen

# Test-User registrieren (erstmalig)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@test.com","password":"benchmark123!","role":"client"}'

# Benchmark ausführen
npm run benchmark
```

## Skripte

| Skript | Zweck |
|--------|-------|
| `api_benchmark.js` | Haupt-Benchmark (alle Endpunkte 30s) |
| `check_thresholds.js` | Threshold-Prüfung (wird von CI aufgerufen) |

## Metriken

- **Latency**: p50, p95, p99 in ms
- **Throughput**: Requests pro Sekunde
- **TTFB**: Time to First Byte
- **Error Rate**: Fehlerhafte Requests in %

## CI

Smoke-Benchmark läuft automatisch bei jedem Push/PR (`VUS=2, 10s`). Vollständiger Benchmark: `npm run benchmark`.

## Thresholds

Siehe `thresholds.json`. Bei Verletzung schlägt die CI fehl.
