// Smoke test: low-concurrency quick check for CI
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  vus: 2,
  duration: "5s",
  thresholds: {
    http_req_duration: ["p(99)<5000"],
    http_req_failed: ["rate<0.1"],
  },
};

export default function () {
  // Health check (always available, no auth)
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    "health returns 200": (r) => r.status === 200,
    "health payload valid": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.ok === true;
      } catch {
        return false;
      }
    },
  });

  // Quick check of a few key endpoints
  const jobs = http.get(`${BASE_URL}/api/jobs`);
  check(jobs, { "jobs responds": (r) => r.status < 500 });

  const reviews = http.get(`${BASE_URL}/api/reviews`);
  check(reviews, { "reviews responds": (r) => r.status < 500 });

  const search = http.get(`${BASE_URL}/api/search?q=test`);
  check(search, { "search responds": (r) => r.status < 500 });
}
