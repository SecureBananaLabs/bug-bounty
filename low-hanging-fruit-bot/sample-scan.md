# Sample Scan Result — SecureBananaLabs/bug-bounty

**Date:** 2026-05-28
**Repo:** SecureBananaLabs/bug-bounty
**Files scanned:** 247
**Total raw findings:** 83
**After deduplication:** 41
**Issues filed:** 41

---

## Findings by Category

| Category | Count |
|---|---|
| TODO/FIXME Comment | 12 |
| TypeScript `any` Usage | 9 |
| Console.log Left in Production Code | 7 |
| Missing Error Handling | 5 |
| Missing Input Validation | 3 |
| Missing Rate Limiting | 2 |
| Hardcoded Secrets | 2 |
| SQL/NoSQL Injection Risk | 1 |

## Findings by Severity

| Severity | Count |
|---|---|
| High | 3 |
| Medium | 10 |
| Low | 28 |

---

## Detailed Findings

### High Severity

#### 1. Hardcoded Secrets — `/backend/src/config/database.ts:12`

```
12|const DATABASE_URL = "postgresql://admin:P@ssw0rd123@localhost:5432/bugbounty";
```

**Issue:** Hardcoded database connection string with credentials in source code. Should be loaded from environment variables.

#### 2. Hardcoded Secrets — `/frontend/lib/api-client.ts:5`

```
 5|const API_KEY = "sk-bounty-7a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c";
```

**Issue:** Hardcoded API key in frontend source code. Frontend secrets are trivially exposed to end users.

#### 3. SQL/NoSQL Injection Risk — `/backend/src/routes/users.ts:67`

```
67|const users = await prisma.$queryRaw`SELECT * FROM users WHERE username = '${username}'`;
```

**Issue:** Prisma raw query with template literal interpolation. Should use parameterized queries (`$queryRaw` with placeholders) instead.

---

### Medium Severity

#### 4. Missing Error Handling — `/backend/src/routes/jobs.ts:34`

```
34|  async function createJob(req, res) {
```

**Issue:** Async function handling job creation contains `await prisma.job.create(...)` without any try/catch or error handling middleware. If the database is unavailable or the creation fails, the request will hang or crash.

#### 5. Missing Error Handling — `/backend/src/routes/payments.ts:89`

```
89|  async function processPayment(req, res) {
```

**Issue:** Payment processing function uses `await` for multiple operations (stripe API call + database update) with no try/catch. Failed payments could leave inconsistent state.

#### 6. Missing Error Handling — `/backend/src/middleware/auth.ts:22`

```
22|  async function verifyToken(token) {
```

**Issue:** Token verification function calls `await jwt.verify()` without try/catch. An invalid token will throw an unhandled rejection.

#### 7. Missing Error Handling — `/frontend/app/dashboard/page.tsx:45`

```
45|  async function loadDashboardData() {
```

**Issue:** Client-side data loading with multiple `await fetch()` calls and no error boundaries. Failed API calls will show unhelpful error states or crash.

#### 8. Missing Input Validation — `/backend/src/routes/auth.ts:42`

```
42|app.post('/api/login', async (req, res) => {
43|  const { email, password } = req.body;
```

**Issue:** Login route extracts `email` and `password` directly from `req.body` with no validation (no email format check, no password length check). No rate limiting on login endpoint = brute-force vulnerability.

#### 9. Missing Input Validation — `/backend/src/routes/jobs.ts:18`

```
18|app.post('/api/jobs', async (req, res) => {
19|  const { title, budget, description } = req.body;
20|  const job = await prisma.job.create({ data: { title, budget, description } });
```

**Issue:** Job creation endpoint passes user input directly to Prisma without validation. `budget` could be negative/string, `title` could be empty or excessively long, `description` could contain XSS payloads.

#### 10. Missing Rate Limiting — `/backend/src/index.ts:1`

```
 1|import express from 'express';
 2|const app = express();
```

**Issue:** Main Express server file with no rate limiting middleware. All endpoints (login, job creation, payments, etc.) are unprotected against brute-force or DoS attacks.

#### 11. Missing Rate Limiting — `/backend/src/routes/auth.ts:1`

```
 1|import { Router } from 'express';
 2|const router = Router();
```

**Issue:** Auth routes file with no rate limiting. Login endpoint is especially vulnerable to credential stuffing.

---

### Low Severity

#### 12-18. Console.log Left in Production Code

```
/backend/src/routes/jobs.ts:28    console.log('Creating job:', title);
/backend/src/routes/users.ts:45   console.log('User lookup:', email);
/backend/src/routes/payments.ts:112 console.log('Payment processed:', paymentId);
/backend/src/middleware/auth.ts:35  console.log('Token verification failed:', e);
/frontend/lib/api-client.ts:22      console.log('API Response:', data);
/frontend/app/jobs/[id]/page.tsx:67 console.log('Job data:', jobData);
/frontend/components/PaymentForm.tsx:89 console.log('Stripe session:', session);
```

**Issue:** Debug logging statements left in production code. These can leak sensitive information (user emails, payment IDs, internal API responses) to browser consoles and server logs.

#### 19-30. TODO/FIXME Comments

```
/backend/src/routes/auth.ts:15    // TODO: implement proper session management
/backend/src/routes/jobs.ts:92    // FIXME: this breaks when budget is 0
/backend/src/routes/payments.ts:55 // HACK: stripe webhook verification disabled for testing
/backend/src/routes/users.ts:101   // TODO: add email verification before allowing login
/backend/src/middleware/auth.ts:12  // TODO: implement refresh token rotation
/backend/src/services/email.ts:7    // FIXME: hardcoded SMTP settings
/backend/prisma/schema.prisma:34    // TODO: add cascade deletes
/frontend/app/checkout/page.tsx:44  // HACK: bypass payment for admin user
/frontend/lib/api-client.ts:30      // TODO: implement proper error handling
/frontend/components/JobCard.tsx:78  // FIXME: image optimization missing
/frontend/app/profile/page.tsx:23   // TODO: add 2FA setup flow
/backend/src/index.ts:45            // TODO: add CORS configuration
```

**Issue:** Unfinished work markers indicating missing security features (session management, email verification, refresh token rotation, 2FA, CORS), disabled security checks (Stripe webhook verification), payment bypass hack, and incomplete database schema design.

#### 31-39. TypeScript `any` Usage

```
/frontend/lib/api-client.ts:12     return response.json() as any;
/frontend/app/dashboard/page.tsx:18 const [data, setData] = useState<any>(null);
/frontend/components/JobCard.tsx:15  interface JobCardProps { job: any }
/frontend/lib/auth.ts:8             let user: any = null;
/frontend/app/jobs/[id]/page.tsx:22 const params: any = useParams();
/frontend/components/PaymentForm.tsx:31 const handleSubmit = async (e: any) => {
/backend/src/routes/jobs.ts:45      const filters: any = req.query;
/backend/src/middleware/auth.ts:8    export function authenticate(req: any, res: any, next: any) {
/backend/src/services/payment.ts:12  async function createCheckout(metadata: any) {
```

**Issue:** `any` type annotations defeat TypeScript's type checking. Several critical interfaces (API responses, auth state, payment metadata) are untyped, hiding potential bugs.

---

## Recommendations

1. **CRITICAL**: Move all secrets to environment variables and rotate exposed credentials immediately.
2. **HIGH**: Replace `$queryRaw` template strings with parameterized queries.
3. **HIGH**: Add input validation middleware (e.g., `zod`, `joi`) to all API routes.
4. **HIGH**: Add `express-rate-limit` to the server, especially on auth endpoints.
5. **MEDIUM**: Wrap all async route handlers with try/catch or use an async error wrapper.
6. **MEDIUM**: Remove all `console.log` statements or replace with a proper logger.
7. **LOW**: Address TODO/FIXME items, especially the disabled Stripe webhook verification and the admin payment bypass.
8. **LOW**: Replace `any` types with proper TypeScript interfaces.

---

*Generated by Low Hanging Fruit Automation Bot v1.0.0*
*See https://github.com/SecureBananaLabs/bug-bounty/issues/743 for more information.*
