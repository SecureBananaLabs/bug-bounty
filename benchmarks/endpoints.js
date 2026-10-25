/**
 * Benchmark endpoint catalogue.
 *
 * Payloads are modelled on `packages/db/prisma/schema.prisma` and sized to
 * match production records (a full job description, a long proposal cover
 * letter, a resume-sized upload, etc.). They are static so every run sends the
 * exact same bytes and results stay comparable across builds.
 */

const VOCABULARY = [
  "platform", "freelance", "project", "delivery", "dashboard", "experience",
  "backend", "frontend", "database", "migration", "performance", "accessibility",
  "customer", "payment", "milestone", "proposal", "contract", "review",
  "notification", "integration", "analytics", "responsive", "typescript"
];

/** Deterministic filler text with a realistic word distribution. */
function text(length, seed) {
  let output = "";
  let index = seed;

  while (output.length < length) {
    output += `${VOCABULARY[index % VOCABULARY.length]} `;
    index += 7;
  }

  return output.slice(0, length).trimEnd();
}

const MULTIPART_BOUNDARY = "----FreelanceFlowBenchmarkBoundary";

function multipartFile(filename, contentType, content) {
  const head = Buffer.from(
    `--${MULTIPART_BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${MULTIPART_BOUNDARY}--\r\n`);

  return {
    body: Buffer.concat([head, content, tail]),
    headers: { "content-type": `multipart/form-data; boundary=${MULTIPART_BOUNDARY}` }
  };
}

// 128 KiB is a typical resume/portfolio PDF and stays below multer's default
// limits while still exercising multipart parsing and body buffering.
const upload = multipartFile(
  "benchmark-resume.pdf",
  "application/pdf",
  Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(128 * 1024, 0x20)])
);

const jsonHeaders = { "content-type": "application/json" };

const registerPayload = {
  email: "benchmark.client.0001@example.com",
  password: "BenchmarkPassw0rd!",
  role: "client"
};

const loginPayload = {
  email: registerPayload.email,
  password: registerPayload.password
};

const userPayload = {
  email: "benchmark.freelancer.0001@example.com",
  fullName: "Benchmark Freelancer",
  bio: text(320, 3),
  role: "freelancer",
  skills: ["TypeScript", "Node.js", "PostgreSQL", "React", "AWS"]
};

const jobPayload = {
  title: "Build a multi-tenant analytics dashboard with Next.js and PostgreSQL",
  description: text(1200, 5),
  budgetMin: 2500,
  budgetMax: 6000,
  categoryId: "cat_web_development",
  skills: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Tailwind CSS", "AWS"]
};

const proposalPayload = {
  coverLetter: text(1500, 11),
  bidAmount: 4200,
  estDuration: "4-6 weeks",
  jobId: "job_benchmark_0001",
  freelancerId: "usr_benchmark_freelancer"
};

const paymentPayload = {
  amount: 4200,
  currency: "usd",
  jobId: "job_benchmark_0001"
};

const reviewPayload = {
  rating: 5,
  comment: text(280, 13),
  reviewerId: "usr_benchmark_client",
  revieweeId: "usr_benchmark_freelancer"
};

const messagePayload = {
  body: text(450, 17),
  senderId: "usr_benchmark_client",
  receiverId: "usr_benchmark_freelancer"
};

const notificationPayload = {
  userId: "usr_benchmark_freelancer",
  title: "New proposal received",
  body: text(180, 19)
};

/**
 * @typedef {Object} BenchmarkEndpoint
 * @property {string} key            Stable "METHOD /route" identifier used by thresholds.
 * @property {string} method         HTTP method.
 * @property {string} route          Route template (no query string) used for display.
 * @property {string} path           Request target sent to the server.
 * @property {boolean} auth          Whether a benchmark bearer token is required.
 * @property {string} [body]         Static request body.
 * @property {Record<string,string>} headers
 * @property {string} schema         Production schema fields exercised by the payload.
 */

/** @type {BenchmarkEndpoint[]} */
export const endpoints = [
  {
    key: "POST /api/auth/register",
    method: "POST",
    route: "/api/auth/register",
    path: "/api/auth/register",
    auth: false,
    body: JSON.stringify(registerPayload),
    headers: jsonHeaders,
    schema: "User { email, password, role }"
  },
  {
    key: "POST /api/auth/login",
    method: "POST",
    route: "/api/auth/login",
    path: "/api/auth/login",
    auth: false,
    body: JSON.stringify(loginPayload),
    headers: jsonHeaders,
    schema: "User { email, password }"
  },
  {
    key: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    route: "/api/auth/oauth/:provider/callback",
    path: "/api/auth/oauth/github/callback?code=benchmark-auth-code&state=benchmark-state",
    auth: false,
    headers: {},
    schema: "OAuth callback { provider, code, state }"
  },
  {
    key: "POST /api/auth/refresh",
    method: "POST",
    route: "/api/auth/refresh",
    path: "/api/auth/refresh",
    auth: false,
    body: JSON.stringify({}),
    headers: jsonHeaders,
    schema: "Refresh token request"
  },
  {
    key: "GET /api/users",
    method: "GET",
    route: "/api/users",
    path: "/api/users",
    auth: false,
    headers: {},
    schema: "User list"
  },
  {
    key: "POST /api/users",
    method: "POST",
    route: "/api/users",
    path: "/api/users",
    auth: false,
    body: JSON.stringify(userPayload),
    headers: jsonHeaders,
    schema: "User { email, fullName, bio, role, skills }"
  },
  {
    key: "GET /api/jobs",
    method: "GET",
    route: "/api/jobs",
    path: "/api/jobs",
    auth: false,
    headers: {},
    schema: "Job list"
  },
  {
    key: "POST /api/jobs",
    method: "POST",
    route: "/api/jobs",
    path: "/api/jobs",
    auth: false,
    body: JSON.stringify(jobPayload),
    headers: jsonHeaders,
    schema: "Job { title, description, budgetMin, budgetMax, categoryId, skills }"
  },
  {
    key: "GET /api/proposals",
    method: "GET",
    route: "/api/proposals",
    path: "/api/proposals",
    auth: false,
    headers: {},
    schema: "Proposal list"
  },
  {
    key: "POST /api/proposals",
    method: "POST",
    route: "/api/proposals",
    path: "/api/proposals",
    auth: false,
    body: JSON.stringify(proposalPayload),
    headers: jsonHeaders,
    schema: "Proposal { coverLetter, bidAmount, estDuration, jobId, freelancerId }"
  },
  {
    key: "POST /api/payments",
    method: "POST",
    route: "/api/payments",
    path: "/api/payments",
    auth: false,
    body: JSON.stringify(paymentPayload),
    headers: jsonHeaders,
    schema: "Payment { amount, currency, jobId }"
  },
  {
    key: "GET /api/reviews",
    method: "GET",
    route: "/api/reviews",
    path: "/api/reviews",
    auth: false,
    headers: {},
    schema: "Review list"
  },
  {
    key: "POST /api/reviews",
    method: "POST",
    route: "/api/reviews",
    path: "/api/reviews",
    auth: false,
    body: JSON.stringify(reviewPayload),
    headers: jsonHeaders,
    schema: "Review { rating, comment, reviewerId, revieweeId }"
  },
  {
    key: "GET /api/messages",
    method: "GET",
    route: "/api/messages",
    path: "/api/messages",
    auth: false,
    headers: {},
    schema: "Message list"
  },
  {
    key: "POST /api/messages",
    method: "POST",
    route: "/api/messages",
    path: "/api/messages",
    auth: false,
    body: JSON.stringify(messagePayload),
    headers: jsonHeaders,
    schema: "Message { body, senderId, receiverId }"
  },
  {
    key: "GET /api/notifications",
    method: "GET",
    route: "/api/notifications",
    path: "/api/notifications",
    auth: false,
    headers: {},
    schema: "Notification list"
  },
  {
    key: "POST /api/notifications",
    method: "POST",
    route: "/api/notifications",
    path: "/api/notifications",
    auth: false,
    body: JSON.stringify(notificationPayload),
    headers: jsonHeaders,
    schema: "Notification { userId, title, body }"
  },
  {
    key: "POST /api/uploads",
    method: "POST",
    route: "/api/uploads",
    path: "/api/uploads",
    auth: false,
    body: upload.body,
    headers: upload.headers,
    schema: "File upload (multipart, 128 KiB PDF)"
  },
  {
    key: "GET /api/search",
    method: "GET",
    route: "/api/search",
    path: "/api/search?q=react%20typescript%20developer%20remote",
    auth: false,
    headers: {},
    schema: "Search { q }"
  },
  {
    key: "GET /api/admin/metrics",
    method: "GET",
    route: "/api/admin/metrics",
    path: "/api/admin/metrics",
    auth: true,
    headers: {},
    schema: "Admin metrics (auth-protected)"
  }
];

/**
 * Build the headers for one endpoint, attaching the benchmark bearer token to
 * auth-protected routes.
 *
 * @param {BenchmarkEndpoint} endpoint
 * @param {string} token
 * @returns {Record<string,string>}
 */
export function requestHeaders(endpoint, token) {
  const headers = { ...endpoint.headers };

  if (endpoint.auth) {
    if (!token) {
      throw new Error(
        `Endpoint ${endpoint.key} requires a benchmark token. ` +
          "Set BENCHMARK_TOKEN or BENCHMARK_JWT_SECRET."
      );
    }
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}
