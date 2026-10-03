// In-memory admin data store.
// Mirrors the simple in-memory pattern used by userService.js / jobService.js.
// In a production build these would back a Prisma DB, but the shape here is the
// single source of truth for the admin domain so tests and the panel share it.

export const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
};

export const auditLog = [];

export const trustScoreDistribution = {
  "0-20": 0,
  "21-40": 0,
  "41-60": 0,
  "61-80": 0,
  "81-100": 0,
};

const now = () => new Date().toISOString();

export const users = [
  { id: "usr_1", email: "alice@example.com", fullName: "Alice Client", role: "CLIENT", status: "ACTIVE", trustScore: 88, joinedAt: "2024-01-12T10:00:00Z", activeJobs: 3, disputes: 0 },
  { id: "usr_2", email: "bob@example.com", fullName: "Bob Freelancer", role: "FREELANCER", status: "ACTIVE", trustScore: 72, joinedAt: "2024-02-18T11:30:00Z", activeJobs: 5, disputes: 1 },
  { id: "usr_3", email: "carol@example.com", fullName: "Carol Client", role: "CLIENT", status: "SUSPENDED", trustScore: 45, joinedAt: "2024-03-01T09:15:00Z", activeJobs: 0, disputes: 2 },
  { id: "usr_4", email: "dave@example.com", fullName: "Dave Admin", role: "ADMIN", status: "ACTIVE", trustScore: 95, joinedAt: "2023-12-01T08:00:00Z", activeJobs: 0, disputes: 0 },
  { id: "usr_5", email: "eve@example.com", fullName: "Eve Freelancer", role: "FREELANCER", status: "BANNED", trustScore: 12, joinedAt: "2024-04-10T14:20:00Z", activeJobs: 0, disputes: 3 },
  { id: "usr_6", email: "frank@example.com", fullName: "Frank Client", role: "CLIENT", status: "ACTIVE", trustScore: 67, joinedAt: "2024-05-22T16:45:00Z", activeJobs: 2, disputes: 0 },
];

export const jobs = [
  { id: "job_1", title: "Build landing page", status: "OPEN", clientId: "usr_1", postedAt: "2024-06-01T10:00:00Z", flagged: false },
  { id: "job_2", title: "Fix payment integration", status: "IN_PROGRESS", clientId: "usr_1", postedAt: "2024-06-05T10:00:00Z", flagged: true, flagReason: "Duplicate listing" },
  { id: "job_3", title: "API migration", status: "OPEN", clientId: "usr_3", postedAt: "2024-06-10T10:00:00Z", flagged: true, flagReason: "Suspicious client" },
  { id: "job_4", title: "Mobile app design", status: "COMPLETED", clientId: "usr_6", postedAt: "2024-05-15T10:00:00Z", flagged: false },
  { id: "job_5", title: "Content writing", status: "OPEN", clientId: "usr_3", postedAt: "2024-06-12T10:00:00Z", flagged: true, flagReason: "User report" },
];

export const disputes = [
  {
    id: "dis_1",
    jobId: "job_2",
    freelancerId: "usr_2",
    clientId: "usr_1",
    status: "open",
    amount: 1500,
    createdAt: "2024-06-06T12:00:00Z",
    thread: [
      { authorId: "usr_2", body: "I delivered the work but the client is disputing the milestone completion.", createdAt: "2024-06-06T12:05:00Z" },
      { authorId: "usr_1", body: "The work does not match the spec and is late.", createdAt: "2024-06-06T13:10:00Z" },
    ],
    evidence: [{ type: "image", url: "/evidence/dis_1_1.png", label: "screenshots" }],
  },
  {
    id: "dis_2",
    jobId: "job_3",
    freelancerId: "usr_2",
    clientId: "usr_3",
    status: "under_review",
    amount: 2800,
    createdAt: "2024-06-11T09:00:00Z",
    thread: [{ authorId: "usr_3", body: "Freelancer stopped responding mid-project.", createdAt: "2024-06-11T09:30:00Z" }],
    evidence: [],
  },
];

export function logAction(adminId, action, target = null, meta = null) {
  const entry = { id: `aud_${auditLog.length + 1}`, adminId, action, target, meta, createdAt: now() };
  auditLog.push(entry);
  return entry;
}

export function resetStore() {
  users.length = 0;
  users.push(
    { id: "usr_1", email: "alice@example.com", fullName: "Alice Client", role: "CLIENT", status: "ACTIVE", trustScore: 88, joinedAt: "2024-01-12T10:00:00Z", activeJobs: 3, disputes: 0 },
    { id: "usr_2", email: "bob@example.com", fullName: "Bob Freelancer", role: "FREELANCER", status: "ACTIVE", trustScore: 72, joinedAt: "2024-02-18T11:30:00Z", activeJobs: 5, disputes: 1 },
    { id: "usr_3", email: "carol@example.com", fullName: "Carol Client", role: "CLIENT", status: "SUSPENDED", trustScore: 45, joinedAt: "2024-03-01T09:15:00Z", activeJobs: 0, disputes: 2 },
    { id: "usr_4", email: "dave@example.com", fullName: "Dave Admin", role: "ADMIN", status: "ACTIVE", trustScore: 95, joinedAt: "2023-12-01T08:00:00Z", activeJobs: 0, disputes: 0 },
    { id: "usr_5", email: "eve@example.com", fullName: "Eve Freelancer", role: "FREELANCER", status: "BANNED", trustScore: 12, joinedAt: "2024-04-10T14:20:00Z", activeJobs: 0, disputes: 3 },
    { id: "usr_6", email: "frank@example.com", fullName: "Frank Client", role: "CLIENT", status: "ACTIVE", trustScore: 67, joinedAt: "2024-05-22T16:45:00Z", activeJobs: 2, disputes: 0 }
  );
  jobs.length = 0;
  jobs.push(
    { id: "job_1", title: "Build landing page", status: "OPEN", clientId: "usr_1", postedAt: "2024-06-01T10:00:00Z", flagged: false },
    { id: "job_2", title: "Fix payment integration", status: "IN_PROGRESS", clientId: "usr_1", postedAt: "2024-06-05T10:00:00Z", flagged: true, flagReason: "Duplicate listing" },
    { id: "job_3", title: "API migration", status: "OPEN", clientId: "usr_3", postedAt: "2024-06-10T10:00:00Z", flagged: true, flagReason: "Suspicious client" },
    { id: "job_4", title: "Mobile app design", status: "COMPLETED", clientId: "usr_6", postedAt: "2024-05-15T10:00:00Z", flagged: false },
    { id: "job_5", title: "Content writing", status: "OPEN", clientId: "usr_3", postedAt: "2024-06-12T10:00:00Z", flagged: true, flagReason: "User report" }
  );
  disputes.length = 0;
  disputes.push(
    { id: "dis_1", jobId: "job_2", freelancerId: "usr_2", clientId: "usr_1", status: "open", amount: 1500, createdAt: "2024-06-06T12:00:00Z", thread: [{ authorId: "usr_2", body: "I delivered the work but the client is disputing the milestone completion.", createdAt: "2024-06-06T12:05:00Z" }, { authorId: "usr_1", body: "The work does not match the spec and is late.", createdAt: "2024-06-06T13:10:00Z" }], evidence: [{ type: "image", url: "/evidence/dis_1_1.png", label: "screenshots" }] },
    { id: "dis_2", jobId: "job_3", freelancerId: "usr_2", clientId: "usr_3", status: "under_review", amount: 2800, createdAt: "2024-06-11T09:00:00Z", thread: [{ authorId: "usr_3", body: "Freelancer stopped responding mid-project.", createdAt: "2024-06-11T09:30:00Z" }], evidence: [] }
  );
  auditLog.length = 0;
  platformControls.registrationsEnabled = true;
  platformControls.jobPostingsEnabled = true;
  for (const k of Object.keys(trustScoreDistribution)) trustScoreDistribution[k] = 0;
}

export function recomputeTrustDistribution() {
  for (const k of Object.keys(trustScoreDistribution)) trustScoreDistribution[k] = 0;
  for (const u of users) {
    const score = u.trustScore ?? 0;
    if (score <= 20) trustScoreDistribution["0-20"] += 1;
    else if (score <= 40) trustScoreDistribution["21-40"] += 1;
    else if (score <= 60) trustScoreDistribution["41-60"] += 1;
    else if (score <= 80) trustScoreDistribution["61-80"] += 1;
    else trustScoreDistribution["81-100"] += 1;
  }
  return trustScoreDistribution;
}
