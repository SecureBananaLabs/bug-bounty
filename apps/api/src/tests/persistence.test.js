import test from "node:test";
import assert from "node:assert/strict";
import {
  resetDbClientForTests,
  setDbClientForTests
} from "../config/prisma.js";
import { connectDb } from "../config/db.js";

function createFakeDb() {
  const state = {
    users: new Map(),
    categories: new Map(),
    jobs: new Map(),
    proposals: new Map(),
    messages: new Map(),
    reviews: new Map(),
    notifications: new Map()
  };

  const clone = (value) => structuredClone(value);
  const timestamped = (data, includeUpdatedAt = false) => {
    const record = { ...data };
    record.createdAt ??= new Date();
    if (includeUpdatedAt) {
      record.updatedAt ??= new Date();
    }
    return record;
  };

  return {
    connected: false,
    async $connect() {
      this.connected = true;
    },
    user: {
      async findMany() {
        return Array.from(state.users.values()).map(clone);
      },
      async create({ data }) {
        const record = timestamped(
          {
            bio: null,
            isVerified: false,
            ...data
          },
          true
        );
        state.users.set(record.id, record);
        return clone(record);
      },
      async upsert({ where, update, create }) {
        const existing = state.users.get(where.id);
        if (existing) {
          const next = { ...existing, ...update, updatedAt: new Date() };
          state.users.set(where.id, next);
          return clone(next);
        }
        return this.create({ data: create });
      }
    },
    category: {
      async upsert({ where, update, create }) {
        const existing = state.categories.get(where.id);
        if (existing) {
          const next = { ...existing, ...update };
          state.categories.set(where.id, next);
          return clone(next);
        }
        state.categories.set(create.id, create);
        return clone(create);
      }
    },
    job: {
      async findMany() {
        return Array.from(state.jobs.values()).map(clone);
      },
      async create({ data }) {
        const record = timestamped(data, true);
        state.jobs.set(record.id, record);
        return clone(record);
      },
      async upsert({ where, update, create }) {
        const existing = state.jobs.get(where.id);
        if (existing) {
          const next = { ...existing, ...update, updatedAt: new Date() };
          state.jobs.set(where.id, next);
          return clone(next);
        }
        return this.create({ data: create });
      }
    },
    proposal: {
      async findMany() {
        return Array.from(state.proposals.values()).map(clone);
      },
      async create({ data }) {
        const record = timestamped(data);
        state.proposals.set(record.id, record);
        return clone(record);
      }
    },
    message: {
      async findMany() {
        return Array.from(state.messages.values()).map(clone);
      },
      async create({ data }) {
        const record = timestamped(data);
        state.messages.set(record.id, record);
        return clone(record);
      }
    },
    review: {
      async findMany() {
        return Array.from(state.reviews.values()).map(clone);
      },
      async create({ data }) {
        const record = timestamped(data);
        state.reviews.set(record.id, record);
        return clone(record);
      }
    },
    notification: {
      async findMany() {
        return Array.from(state.notifications.values()).map(clone);
      },
      async create({ data }) {
        const record = timestamped(data);
        state.notifications.set(record.id, record);
        return clone(record);
      }
    }
  };
}

async function importFresh(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return import(`${url.href}?t=${Date.now()}-${Math.random()}`);
}

test("connectDb uses the Prisma-backed db client", async () => {
  const fakeDb = createFakeDb();
  setDbClientForTests(fakeDb);

  await assert.doesNotReject(() => connectDb());
  assert.equal(fakeDb.connected, true);

  resetDbClientForTests();
});

test("persisted service records survive service module reloads", async () => {
  const fakeDb = createFakeDb();
  setDbClientForTests(fakeDb);

  const { createUser } = await importFresh("../services/userService.js");
  const { createJob } = await importFresh("../services/jobService.js");
  const { createProposal } = await importFresh("../services/proposalService.js");
  const { sendMessage } = await importFresh("../services/messageService.js");
  const { createReview } = await importFresh("../services/reviewService.js");
  const { createNotification } = await importFresh("../services/notificationService.js");

  const user = await createUser({
    email: "maya@example.com",
    fullName: "Maya Dev",
    role: "freelancer"
  });
  const job = await createJob({
    title: "Build search",
    description: "Implement a persisted search index",
    budgetMin: 100,
    budgetMax: 300,
    categoryId: "cat_search",
    clientId: "usr_client_1"
  });
  const proposal = await createProposal({
    jobId: job.id,
    freelancerId: user.id,
    coverLetter: "I can ship this quickly.",
    bidAmount: 180,
    estDuration: "3 days"
  });
  const message = await sendMessage({
    senderId: user.id,
    receiverId: "usr_client_1",
    content: "Proposal submitted."
  });
  const review = await createReview({
    reviewerId: "usr_client_1",
    revieweeId: user.id,
    rating: 5,
    comment: "Great work"
  });
  const notification = await createNotification({
    userId: user.id,
    type: "proposal_update",
    message: "Your proposal was viewed."
  });

  assert.match(user.id, /^usr_/);
  assert.match(job.id, /^job_/);
  assert.match(proposal.id, /^prp_/);
  assert.match(message.id, /^msg_/);
  assert.match(review.id, /^rev_/);
  assert.match(notification.id, /^ntf_/);

  const { listUsers } = await importFresh("../services/userService.js");
  const { listJobs } = await importFresh("../services/jobService.js");
  const { listProposals } = await importFresh("../services/proposalService.js");
  const { listMessages } = await importFresh("../services/messageService.js");
  const { listReviews } = await importFresh("../services/reviewService.js");
  const { listNotifications } = await importFresh("../services/notificationService.js");

  assert.equal((await listUsers()).length, 3);
  assert.equal((await listJobs()).length, 1);
  assert.equal((await listProposals()).length, 1);
  assert.equal((await listMessages()).length, 1);
  assert.equal((await listReviews()).length, 1);
  assert.equal((await listNotifications()).length, 1);

  const [storedMessage] = await listMessages();
  const [storedNotification] = await listNotifications();

  assert.equal(storedMessage.content, "Proposal submitted.");
  assert.equal(storedNotification.message, "Your proposal was viewed.");
  assert.equal(storedNotification.read, false);

  resetDbClientForTests();
});
