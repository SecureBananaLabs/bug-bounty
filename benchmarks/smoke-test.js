import { check, sleep } from "k6";
import http from "k6/http";
import { BASE_URL, ENDPOINTS } from "./config.js";

export const options = {
  vus: 2,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(99)<500", "p(95)<300"],
    http_req_failed: ["rate<0.01"],
    http_reqs: ["rate>10"],
  },
  tags: { test_type: "smoke" },
};

export default function () {
  for (const ep of ENDPOINTS) {
    const url = BASE_URL + ep.path;
    const params = {
      headers: { "Content-Type": "application/json" },
      tags: { name: ep.name, ...ep.tags },
      timeout: "10s",
    };
    if (ep.auth) {
      params.headers["Authorization"] = `Bearer ${__ENV.BENCHMARK_TOKEN || ""}`;
    }
    const payload = ep.payload ? JSON.stringify(ep.payload) : null;
    const res = http.request(ep.method, url, payload, params);
    check(res, {
      [`${ep.name} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
      [`${ep.name} response time < 500ms`]: (r) => r.timings.duration < 500,
    });
    sleep(0.5);
  }
}
