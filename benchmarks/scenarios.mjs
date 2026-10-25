import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

const authEmail = "benchmark.client@example.invalid";
const clientId = "benchmark_client_001";
const freelancerId = "benchmark_freelancer_001";
const jobId = "benchmark_job_001";

const user = {
  fullName: "Avery Benchmark",
  role: "FREELANCER",
  bio: "Synthetic product engineer focused on accessible interfaces, reliable integrations, and clear project handoffs.",
  isVerified: false,
  skills: [
    { id: "benchmark_skill_typescript", name: "TypeScript" },
    { id: "benchmark_skill_accessibility", name: "Accessibility" }
  ]
};

const job = {
  title: "Accessible client reporting dashboard",
  description: [
    "Build an accessible reporting dashboard for a small distributed client team. The workspace should summarize active projects, milestone delivery, invoice totals, and unread conversations. Use synthetic records throughout development and provide a clear loading, empty, and error state for each panel.",
    "The first milestone covers navigation, responsive page structure, and a reusable project table with filtering and sorting. The second milestone adds a project detail view, milestone progress, and an export preview. Support keyboard navigation and readable contrast across desktop and mobile layouts.",
    "Implement reusable TypeScript components with documented props and straightforward state management. Include representative fixtures for a freelancer, a client, and a project with several milestones. Keep network access behind a small service interface so an API implementation can replace the fixtures.",
    "Acceptance includes a working dashboard, component examples, focused interaction tests, and a concise handoff document. Demonstrate the main workflow with a screen reader and keyboard. Deliver the source, setup instructions, and known limitations within three weeks, with a review at each milestone."
  ].join("\n\n"),
  budgetMin: 3500,
  budgetMax: 6500,
  categoryId: "benchmark_category_web",
  skills: ["TypeScript", "React", "Accessibility"]
};

const proposal = {
  jobId,
  freelancerId,
  bidAmount: 4250,
  estDuration: "3 weeks",
  coverLetter: [
    "I can deliver the reporting dashboard in three milestones with a reviewable result at the end of each week. My approach starts with the client workflow: find a project, understand delivery progress, check outstanding invoices, and open the relevant conversation without losing the current context.",
    "During the first week I will prepare the navigation, responsive layout, and accessible project table using representative synthetic fixtures. I will confirm the information hierarchy with you before adding detail views. Keyboard focus, headings, contrast, and table semantics are part of this initial work.",
    "The second week adds milestone detail, invoice summaries, and export previews. I will keep the service boundary small and document the expected request and response shapes so the eventual backend can be connected without changing the interface. Focused tests will cover filtering, navigation, and error recovery.",
    "The final week is reserved for integration feedback, accessibility review, and handoff. You will receive source code, setup instructions, component examples, test commands, and a short list of known limitations. The bid includes two review rounds and an annotated walkthrough of the delivered workflow."
  ].join("\n\n")
};

const payment = { jobId, amount: 4250, currency: "usd" };
const review = {
  reviewerId: clientId,
  revieweeId: freelancerId,
  rating: 5,
  comment: "The dashboard milestones arrived on schedule with clear review notes. Keyboard navigation and responsive layouts were carefully checked, and the handoff made the integration work straightforward."
};
const message = {
  senderId: clientId,
  receiverId: freelancerId,
  body: "Thanks for the dashboard preview. Please include keyboard navigation notes and a sample invoice export in Friday's handoff. The project table and milestone summary look ready for review; I will send consolidated feedback after the client walkthrough tomorrow."
};
const notification = {
  userId: freelancerId,
  title: "Dashboard milestone ready for review",
  body: "The client has reviewed the project table and requested the accessibility notes and sample invoice export for the next milestone handoff."
};
const document = readFileSync(new URL("./fixtures/document.txt", import.meta.url));
const multipartBoundary = "securebanana-api-benchmark-document";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function matchesFields(value, expected) {
  return isRecord(value) && Object.entries(expected).every(([key, field]) => isDeepStrictEqual(value[key], field));
}

function hasId(value, prefix) {
  return isRecord(value) && typeof value.id === "string" && new RegExp(`^${prefix}_[0-9]+$`).test(value.id);
}

function hasClientToken(value, subject = "usr_existing") {
  if (typeof value !== "string") return false;
  const parts = value.split(".");
  if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return matchesFields(header, { alg: "HS256", typ: "JWT" })
      && isRecord(claims)
      && claims.role === "client"
      && (subject === null ? /^usr_[0-9]+$/.test(claims.sub) : claims.sub === subject)
      && Number.isSafeInteger(claims.iat) && claims.iat > 0
      && Number.isSafeInteger(claims.exp) && claims.exp > claims.iat;
  } catch {
    return false;
  }
}

function isTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function jsonBuild(payload) {
  return (context) => ({
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(typeof payload === "function" ? payload(context) : payload)
  });
}

function readBuild() {
  return { headers: { accept: "application/json" }, body: undefined };
}

const validateUser = (data) => hasId(data, "usr") && matchesFields(data, user)
  && typeof data.email === "string" && /^benchmark\.freelancer\.[0-9]+@example\.invalid$/.test(data.email);
const validateJob = (data) => hasId(data, "job") && matchesFields(data, { ...job, status: "open" });
const validateProposal = (data) => hasId(data, "prp") && matchesFields(data, proposal);
const validateReview = (data) => hasId(data, "rev") && matchesFields(data, review);
const validateMessage = (data) => hasId(data, "msg") && matchesFields(data, message) && isTimestamp(data.sentAt);
const validateNotification = (data) => hasId(data, "ntf") && matchesFields(data, { ...notification, read: false });

function collection(name, payload, validate, payloadDescription) {
  return [
    {
      id: `${name}-list`, method: "GET", route: `/api/${name}`, path: `/api/${name}`,
      expectedStatus: 200, requiresAuth: false, seedWith: `${name}-create`,
      payloadDescription: "No request body; read the collection after three synthetic create requests.",
      build: readBuild,
      validate: (data) => Array.isArray(data) && data.length > 0 && data.every(validate)
    },
    {
      id: `${name}-create`, method: "POST", route: `/api/${name}`, path: `/api/${name}`,
      expectedStatus: 201, requiresAuth: false, payloadDescription,
      build: jsonBuild(payload), validate
    }
  ];
}

// The runner checks HTTP status and envelope.success before passing envelope.data here.
// Credential material is supplied per run, stays in memory, and is never exported.
export const scenarios = [
  {
    id: "auth-register", method: "POST", route: "/api/auth/register", path: "/api/auth/register",
    expectedStatus: 201, requiresAuth: false,
    payloadDescription: "Synthetic example.invalid client email, ephemeral password, and lowercase client role.",
    build: jsonBuild(({ password }) => ({ email: authEmail, password, role: "client" })),
    validate: (data) => hasId(data, "usr") && matchesFields(data, { email: authEmail, role: "client" })
      && hasClientToken(data.token, null)
  },
  {
    id: "auth-login", method: "POST", route: "/api/auth/login", path: "/api/auth/login",
    expectedStatus: 200, requiresAuth: false,
    payloadDescription: "Synthetic example.invalid client email and the same ephemeral run password.",
    build: jsonBuild(({ password }) => ({ email: authEmail, password })),
    validate: (data) => matchesFields(data, { email: authEmail }) && hasClientToken(data.token)
  },
  {
    id: "auth-oauth", method: "GET", route: "/api/auth/oauth/:provider/callback",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
    expectedStatus: 200, requiresAuth: false,
    payloadDescription: "GitHub callback path with synthetic code and state query values; no external OAuth exchange.",
    build: readBuild,
    validate: (data) => matchesFields(data, { provider: "github", status: "callback-received" })
  },
  {
    id: "auth-refresh", method: "POST", route: "/api/auth/refresh", path: "/api/auth/refresh",
    expectedStatus: 200, requiresAuth: false,
    payloadDescription: "Empty JSON object, matching the current refresh stub that does not consume a refresh token.",
    build: jsonBuild({}),
    validate: (data) => isRecord(data) && hasClientToken(data.token)
  },
  ...collection("users", ({ sequence }) => ({ ...user, email: `benchmark.freelancer.${sequence}@example.invalid` }), validateUser,
    "Synthetic freelancer profile with sequence-specific example.invalid email, uppercase role, bio, and two skills."),
  ...collection("jobs", job, validateJob,
    "Accessible dashboard job with approximately 1 KiB description, budget range, category reference, and three skills."),
  ...collection("proposals", proposal, validateProposal,
    "Proposal with approximately 1 KiB cover letter, 4250 bid, three-week estimate, and synthetic job/freelancer references."),
  {
    id: "payments-create", method: "POST", route: "/api/payments", path: "/api/payments",
    expectedStatus: 201, requiresAuth: false,
    payloadDescription: "Synthetic job reference, numeric amount 4250, and lowercase usd currency; no live charge is made.",
    build: jsonBuild(payment),
    validate: (data) => matchesFields(data, { amount: payment.amount, currency: payment.currency, provider: "stripe" })
      && typeof data.paymentId === "string" && /^pay_[0-9]+$/.test(data.paymentId)
  },
  ...collection("reviews", review, validateReview,
    "Five-star review with substantive project feedback and distinct synthetic reviewer/reviewee references."),
  ...collection("messages", message, validateMessage,
    "Approximately 256-byte handoff message between distinct synthetic client and freelancer references."),
  ...collection("notifications", notification, validateNotification,
    "Milestone review notification with a synthetic recipient, descriptive title, and substantive body."),
  {
    id: "uploads-create", method: "POST", route: "/api/uploads", path: "/api/uploads",
    expectedStatus: 201, requiresAuth: false,
    payloadDescription: "Real multipart file field containing the approximately 8 KiB document.txt synthetic project brief.",
    build: () => ({
      headers: { accept: "application/json", "content-type": `multipart/form-data; boundary=${multipartBoundary}` },
      body: Buffer.concat([
        Buffer.from(`--${multipartBoundary}\r\nContent-Disposition: form-data; name="file"; filename="document.txt"\r\nContent-Type: text/plain\r\n\r\n`),
        document,
        Buffer.from(`\r\n--${multipartBoundary}--\r\n`)
      ])
    }),
    validate: (data) => matchesFields(data, { status: "uploaded", filename: "document.txt" })
  },
  {
    id: "search", method: "GET", route: "/api/search", path: "/api/search?q=accessibility%20dashboard",
    expectedStatus: 200, requiresAuth: false,
    payloadDescription: "Two-word accessibility dashboard query; current search stub returns three empty result arrays.",
    build: readBuild,
    validate: (data) => matchesFields(data, { query: "accessibility dashboard", users: [], jobs: [], freelancers: [] })
  },
  {
    id: "admin-metrics", method: "GET", route: "/api/admin/metrics", path: "/api/admin/metrics",
    expectedStatus: 200, requiresAuth: true,
    payloadDescription: "No request body; dedicated run JWT in Authorization header, with current static metric values checked.",
    build: ({ token }) => ({ headers: { accept: "application/json", authorization: `Bearer ${token}` }, body: undefined }),
    validate: (data) => matchesFields(data, { openJobs: 42, activeFreelancers: 185, flaggedAccounts: 3, monthlyVolume: 128900 })
  }
];
