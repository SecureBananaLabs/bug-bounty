// Global in-memory mock store
export const store = {
  users: [
    { id: "usr_admin", email: "admin@freelanceflow.com", passwordHash: "hashed", fullName: "Admin User", role: "ADMIN", status: "ACTIVE", isVerified: true, createdAt: new Date("2026-01-01T00:00:00.000Z") },
    { id: "usr_free1", email: "maya@freelanceflow.com", passwordHash: "hashed", fullName: "Maya Dev", role: "FREELANCER", status: "ACTIVE", isVerified: true, createdAt: new Date("2026-02-15T00:00:00.000Z") },
    { id: "usr_free2", email: "jordan@freelanceflow.com", passwordHash: "hashed", fullName: "Jordan UX", role: "FREELANCER", status: "SUSPENDED", isVerified: true, createdAt: new Date("2026-03-20T00:00:00.000Z") },
    { id: "usr_client1", email: "client1@freelanceflow.com", passwordHash: "hashed", fullName: "Banana Client", role: "CLIENT", status: "ACTIVE", isVerified: true, createdAt: new Date("2026-04-05T00:00:00.000Z") },
    { id: "usr_client2", email: "client2@freelanceflow.com", passwordHash: "hashed", fullName: "Secure Client", role: "CLIENT", status: "BANNED", isVerified: true, createdAt: new Date("2026-05-01T00:00:00.000Z") }
  ],
  jobs: [
    { id: "job_1", title: "Build an AI customer support widget", description: "Need widget fast", budgetMin: 1000, budgetMax: 1500, status: "OPEN", clientId: "usr_client1", categoryId: "cat_1", createdAt: new Date("2026-05-10T12:00:00.000Z") },
    { id: "job_2", title: "Migrate legacy API to Node.js", description: "Old API must go", budgetMin: 2000, budgetMax: 2800, status: "FLAGGED", clientId: "usr_client1", categoryId: "cat_1", createdAt: new Date("2026-05-12T14:30:00.000Z") },
    { id: "job_3", title: "Design SaaS onboarding flows", description: "Figma files", budgetMin: 500, budgetMax: 900, status: "REJECTED", clientId: "usr_client2", categoryId: "cat_2", createdAt: new Date("2026-05-14T09:15:00.000Z") }
  ],
  disputes: [
    { id: "dis_1", jobId: "job_1", creatorId: "usr_client1", status: "OPEN", reason: "Freelancer vanished", evidence: "No commits in 2 weeks", createdAt: new Date("2026-05-15T08:00:00.000Z") },
    { id: "dis_2", jobId: "job_2", creatorId: "usr_free1", status: "UNDER_REVIEW", reason: "Client refused final payment", evidence: "Completed all milestone deliverables", createdAt: new Date("2026-05-16T11:00:00.000Z") }
  ],
  auditLogs: [
    { id: "log_1", adminId: "usr_admin", action: "SUSPEND_USER", details: "Suspended user jordan@freelanceflow.com for spam", createdAt: new Date("2026-05-18T10:00:00.000Z") },
    { id: "log_2", adminId: "usr_admin", action: "DISABLE_REGISTRATION", details: "Registration disabled temporarily", createdAt: new Date("2026-05-18T10:05:00.000Z") }
  ],
  platformSettings: {
    registrationEnabled: true,
    jobPostingEnabled: true
  },
  notifications: []
};

export const prisma = {
  user: {
    findMany: async (args) => {
      let result = [...store.users];
      if (args?.where) {
        if (args.where.role) result = result.filter(u => u.role === args.where.role);
        if (args.where.status) result = result.filter(u => u.status === args.where.status);
        if (args.where.OR) {
          const search = args.where.OR[0].email.contains.toLowerCase();
          result = result.filter(u => u.email.toLowerCase().includes(search) || u.fullName.toLowerCase().includes(search));
        }
      }
      const total = result.length;
      if (args?.skip !== undefined && args?.take !== undefined) {
        result = result.slice(args.skip, args.skip + args.take);
      }
      return result;
    },
    count: async (args) => {
      let result = [...store.users];
      if (args?.where) {
        if (args.where.role) result = result.filter(u => u.role === args.where.role);
        if (args.where.status) result = result.filter(u => u.status === args.where.status);
        if (args.where.OR) {
          const search = args.where.OR[0].email.contains.toLowerCase();
          result = result.filter(u => u.email.toLowerCase().includes(search) || u.fullName.toLowerCase().includes(search));
        }
      }
      return result.length;
    },
    findUnique: async (args) => store.users.find(u => u.id === args.where.id || u.email === args.where.email),
    update: async (args) => {
      const idx = store.users.findIndex(u => u.id === args.where.id);
      if (idx !== -1) {
        store.users[idx] = { ...store.users[idx], ...args.data };
        return store.users[idx];
      }
      throw new Error("User not found");
    }
  },
  job: {
    findMany: async (args) => {
      let result = [...store.jobs];
      if (args?.where) {
        if (args.where.status) result = result.filter(j => j.status === args.where.status);
      }
      return result;
    },
    findUnique: async (args) => store.jobs.find(j => j.id === args.where.id),
    update: async (args) => {
      const idx = store.jobs.findIndex(j => j.id === args.where.id);
      if (idx !== -1) {
        store.jobs[idx] = { ...store.jobs[idx], ...args.data };
        return store.jobs[idx];
      }
      throw new Error("Job not found");
    }
  },
  dispute: {
    findMany: async () => store.disputes,
    findUnique: async (args) => store.disputes.find(d => d.id === args.where.id),
    update: async (args) => {
      const idx = store.disputes.findIndex(d => d.id === args.where.id);
      if (idx !== -1) {
        store.disputes[idx] = { ...store.disputes[idx], ...args.data };
        return store.disputes[idx];
      }
      throw new Error("Dispute not found");
    }
  },
  auditLog: {
    findMany: async (args) => {
      let result = [...store.auditLogs];
      if (args?.where) {
        if (args.where.adminId) result = result.filter(l => l.adminId === args.where.adminId);
        if (args.where.action) result = result.filter(l => l.action === args.where.action);
        if (args.where.createdAt) {
          if (args.where.createdAt.gte) result = result.filter(l => l.createdAt >= args.where.createdAt.gte);
          if (args.where.createdAt.lte) result = result.filter(l => l.createdAt <= args.where.createdAt.lte);
        }
      }
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    create: async (args) => {
      const log = { id: `log_${Date.now()}`, ...args.data, createdAt: new Date() };
      store.auditLogs.push(log);
      return log;
    }
  },
  platformSetting: {
    findUnique: async (args) => {
      const val = store.platformSettings[args.where.key === "registration_enabled" ? "registrationEnabled" : "jobPostingEnabled"];
      return val !== undefined ? { key: args.where.key, value: String(val) } : null;
    },
    upsert: async (args) => {
      const prop = args.where.key === "registration_enabled" ? "registrationEnabled" : "jobPostingEnabled";
      store.platformSettings[prop] = args.update.value === "true";
      return { key: args.where.key, value: args.update.value };
    }
  },
  notification: {
    create: async (args) => {
      const notification = { id: `ntf_${Date.now()}`, ...args.data, read: false, createdAt: new Date() };
      store.notifications.push(notification);
      return notification;
    }
  }
};

export async function connectDb() {
  return { connected: true, driver: "mock-prisma" };
}
