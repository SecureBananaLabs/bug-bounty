import { randomUUID } from "node:crypto";

function jsonRequest(body) {
  return {
    headers: {
      "content-type": "application/json"
    },
    body: Buffer.from(JSON.stringify(body))
  };
}

function multipartRequest(fields, file) {
  const boundary = `----freelanceflow-${randomUUID().replace(/-/g, "")}`;
  const chunks = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(`--${boundary}\r\n`);
    chunks.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n`);
    chunks.push(`${value}\r\n`);
  }

  if (file) {
    chunks.push(`--${boundary}\r\n`);
    chunks.push(
      `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\n`
    );
    chunks.push(`Content-Type: ${file.contentType}\r\n\r\n`);
    chunks.push(file.content);
    chunks.push("\r\n");
  }

  chunks.push(`--${boundary}--\r\n`);

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    },
    body: Buffer.from(chunks.join(""))
  };
}

function authHeader(context) {
  return {
    authorization: `Bearer ${context.benchmarkToken}`
  };
}

function mergeHeaders(...sets) {
  return Object.assign({}, ...sets);
}

export const benchmarkRoutes = [
  {
    label: "GET /health",
    method: "GET",
    path: "/health",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        email: "benchmark.freelancer@example.com",
        password: "benchmark-secret-123",
        role: "freelancer"
      });
    }
  },
  {
    label: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        email: "benchmark.freelancer@example.com",
        password: "benchmark-secret-123"
      });
    }
  },
  {
    label: "GET /api/auth/oauth/github/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({ refreshToken: "benchmark-refresh-token" });
    }
  },
  {
    label: "GET /api/users",
    method: "GET",
    path: "/api/users",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/users",
    method: "POST",
    path: "/api/users",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        name: "Benchmark User",
        email: "benchmark.user@example.com",
        role: "freelancer",
        headline: "Senior product engineer for performance-sensitive web apps"
      });
    }
  },
  {
    label: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        title: "Benchmark responsive dashboard rebuild",
        description:
          "Rebuild the hiring dashboard with improved search, pagination, and workspace filters.",
        budgetMin: 1200,
        budgetMax: 2500,
        categoryId: "cat_frontend",
        skills: ["nextjs", "react", "tailwind", "accessibility"]
      });
    }
  },
  {
    label: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        jobId: "job_benchmark_001",
        freelancerId: "usr_benchmark",
        coverLetter:
          "I can land this quickly with a test-backed implementation and minimal surface area."
      });
    }
  },
  {
    label: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        amount: 750,
        currency: "usd",
        jobId: "job_benchmark_001",
        provider: "stripe"
      });
    }
  },
  {
    label: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        jobId: "job_benchmark_001",
        rating: 5,
        comment: "Reliable delivery, strong communication, and clean implementation."
      });
    }
  },
  {
    label: "GET /api/messages",
    method: "GET",
    path: "/api/messages",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        threadId: "thread_benchmark_001",
        content:
          "The deliverable is on track. I am validating the acceptance criteria and will follow up with results."
      });
    }
  },
  {
    label: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    requiresAuth: false,
    buildRequest() {
      return jsonRequest({
        userId: "usr_benchmark",
        type: "payment",
        message: "Your payout is ready for review."
      });
    }
  },
  {
    label: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    requiresAuth: false,
    buildRequest() {
      return multipartRequest(
        {
          purpose: "benchmark-evidence",
          note: "Small realistic attachment used to exercise multipart handling."
        },
        {
          fieldName: "file",
          filename: "benchmark-proof.txt",
          contentType: "text/plain",
          content: "benchmark payload"
        }
      );
    }
  },
  {
    label: "GET /api/search",
    method: "GET",
    path: "/api/search?q=enterprise%20performance%20audit",
    requiresAuth: false,
    buildRequest() {
      return {};
    }
  },
  {
    label: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    requiresAuth: true,
    buildRequest(context) {
      return {
        headers: mergeHeaders(authHeader(context))
      };
    }
  }
];
