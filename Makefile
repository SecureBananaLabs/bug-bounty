.PHONY: bench bench-smoke bench-stress bench-docker bench-report bench-clean

# ── Local Benchmarks ──────────────────────────────────────
API_URL ?= http://localhost:4000
VUS     ?= 50
DURATION ?= 60s

bench: ## Full load test
	@echo "🚀 Load test — $(VUS) VUs, $(DURATION)"
	k6 run --summary-export=benchmarks/results/summary.json \
		--out json=benchmarks/results/raw.ndjson \
		benchmarks/k6/load-test.js 2>&1 | tee benchmarks/results/console.log
	@echo "📊 Report: benchmarks/report.html?summary.json"

bench-smoke: ## Quick smoke test (1 VU, 1 iteration)
	@echo "🔍 Smoke test…"
	k6 run --quiet benchmarks/k6/smoke-test.js

bench-stress: ## Stress test to find breaking point
	@echo "💥 Stress test…"
	k6 run --summary-export=benchmarks/results/stress-summary.json \
		benchmarks/k6/stress-test.js

bench-docker: ## Run full benchmark via Docker Compose
	docker compose --profile bench up --build --abort-on-container-exit

bench-report: ## Open HTML dashboard
	@echo "Serving report at http://localhost:8080"
	cd benchmarks/results && python3 -m http.server 8080

bench-clean: ## Remove benchmark artifacts
	rm -rf benchmarks/results/*.json benchmarks/results/*.log benchmarks/results/*.ndjson
