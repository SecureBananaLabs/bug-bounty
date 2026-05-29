import http from 'k6/http';
import { check, fail } from 'k6';
import { htmlReport } from 'https://jslib.k6.io';

export const options = {
  vus: 10,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500']
  }
};

export default function () {
  const res = http.get('http://test.k6.io');
  check(res, {
    'status was 200': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
  };
}