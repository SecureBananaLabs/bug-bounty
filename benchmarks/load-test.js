import { check, sleep, group } from "k6";
import http from "k6/http";
import { Trend, Rate } from "k6/metrics";
import { BASE_URL, ENDPOINTS, DEFAULT_THRESHOLDS } from "./config.js";

const endpointDurations = {};
const endpointTTFB = {};
const endpointErrors = {};

for (const ep of ENDPOINTS) {
  const key = ep.name.replace(/[^a-zA-Z0-9]/g, "_");
  endpointDurations[key] = new Trend(`${key}_duration`);
  endpointTTFB[key] = new Trend(`${key}_ttfb`);
  endpointErrors[key] = new Rate(`${key}_errors`);
}

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 25 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<2000", "p(95)<1000", "p(50)<300"],
    http_req_failed: ["rate<0.05"],
    http_reqs: ["rate>50"],
  },
  summaryTrendStats: ["min", "med", "avg", "p(50)", "p(90)", "p(95)", "p(99)", "max"],
};

export default function () {
  for (const ep of ENDPOINTS) {
    group(ep.name, () => {
      const url = BASE_URL + ep.path;
      const params = {
        headers: { "Content-Type": "application/json" },
        tags: { name: ep.name, endpoint: ep.path, ...ep.tags },
        timeout: "30s",
      };
      if (ep.auth) {
        params.headers["Authorization"] = `Bearer ${__ENV.BENCHMARK_TOKEN || ""}`;
      }
      const payload = ep.payload ? JSON.stringify(ep.payload) : null;
      const res = http.request(ep.method, url, payload, params);
      const key = ep.name.replace(/[^a-zA-Z0-9]/g, "_");
      endpointDurations[key].add(res.timings.duration);
      endpointTTFB[key].add(res.timings.waiting);
      endpointErrors[key].add(res.status >= 400);
      check(res, {
        [`${ep.name} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
      });
      sleep(0.2);
    });
  }
}
