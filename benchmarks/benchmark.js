import { check } from 'k6';
import { fail, check } from 'k6';

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
  return {
    'summary.html': htmlReport,
  };
}