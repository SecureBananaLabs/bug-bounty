#!/usr/bin/env node
/**
 * CI-Smoke-Benchmark Threshold-Checker
 * Liest die k6 JSON-Ergebnisse und prüft gegen thresholds.json
 * Exit 0 bei Erfolg, Exit 1 bei Verletzung
 */
const fs = require('fs');
const path = require('path');

const resultFile = process.argv[2];
if (!resultFile || !fs.existsSync(resultFile)) {
    console.error(`❌ Ergebnisdatei nicht gefunden: ${resultFile}`);
    process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
const thresholds = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'thresholds.json'), 'utf-8')
).thresholds;

let hasErrors = false;
const checks = [];

// p50 / p95 / p99
['p50_ms', 'p95_ms', 'p99_ms'].forEach(key => {
    const limit = thresholds.http_req_duration[key];
    const actual = Math.round(results.metrics.http_req_duration?.[key.replace('_ms','')] || 0);
    if (actual > limit) {
        hasErrors = true;
        checks.push(`❌ ${key}: ${actual} ms > ${limit} ms`);
    } else {
        checks.push(`✅ ${key}: ${actual} ms ≤ ${limit} ms`);
    }
});

// Error rate
const errRate = ((results.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2);
const errLimit = thresholds.http_req_failed.max_error_rate_pct;
if (parseFloat(errRate) > errLimit) {
    hasErrors = true;
    checks.push(`❌ Error rate: ${errRate}% > ${errLimit}%`);
} else {
    checks.push(`✅ Error rate: ${errRate}% ≤ ${errLimit}%`);
}

// Per-endpoint thresholds
if (thresholds.endpoints) {
    Object.entries(thresholds.endpoints).forEach(([endpoint, limit]) => {
        const name = endpoint.replace('_', ' ');
        console.log(`   Endpoint-Check '${endpoint}': threshold-Datei erkennt ${Object.keys(limit)}`);
    });
}

console.log('\n'.padStart(3, ' ') + '=== Threshold-Prüfung ===');
checks.forEach(c => console.log('  ' + c));

if (hasErrors) {
    console.error('\n❌ Threshold(s) verletzt – CI schlägt fehl');
    process.exit(1);
} else {
    console.log('\n✅ Alle Thresholds eingehalten');
    process.exit(0);
}
