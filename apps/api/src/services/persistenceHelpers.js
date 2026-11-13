import { getDb } from "../config/prisma.js";

const SYSTEM_CLIENT_ID = "usr_system_client";
const SYSTEM_CATEGORY_ID = "cat_general";

function nowIso(value) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : value;
}

function normalizeRole(role = "client") {
  return String(role).toUpperCase();
}

function buildPlaceholderUser(id, role = "client") {
  return {
    id,
    email: `${id}@placeholder.local`,
    passwordHash: "placeholder-hash",
    fullName: id,
    role: normalizeRole(role)
  };
}

export async function ensureUser(userId, role = "client") {
  const db = getDb();

  return db.user.upsert({
    where: { id: userId },
    update: {},
    create: buildPlaceholderUser(userId, role)
  });
}

export async function ensureCategory(categoryId = SYSTEM_CATEGORY_ID) {
  const db = getDb();

  return db.category.upsert({
    where: { id: categoryId },
    update: {},
    create: {
      id: categoryId,
      name: categoryId,
      description: `Category ${categoryId}`
    }
  });
}

export async function ensureJob(jobId) {
  const db = getDb();

  await ensureUser(SYSTEM_CLIENT_ID);
  await ensureCategory(SYSTEM_CATEGORY_ID);

  return db.job.upsert({
    where: { id: jobId },
    update: {},
    create: {
      id: jobId,
      title: "Placeholder job",
      description: "Placeholder persisted job record",
      budgetMin: 0,
      budgetMax: 0,
      status: "OPEN",
      clientId: SYSTEM_CLIENT_ID,
      categoryId: SYSTEM_CATEGORY_ID
    }
  });
}

export function nextId(prefix, existingId) {
  return existingId ?? `${prefix}_${Date.now()}`;
}

export function mapUser(record) {
  return {
    id: record.id,
    email: record.email,
    fullName: record.fullName,
    bio: record.bio ?? null,
    role: String(record.role ?? "CLIENT").toLowerCase(),
    isVerified: Boolean(record.isVerified),
    createdAt: nowIso(record.createdAt),
    updatedAt: nowIso(record.updatedAt)
  };
}

export function mapJob(record) {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    budgetMin: record.budgetMin,
    budgetMax: record.budgetMax,
    categoryId: record.categoryId,
    clientId: record.clientId,
    status: String(record.status ?? "OPEN").toLowerCase(),
    createdAt: nowIso(record.createdAt),
    updatedAt: nowIso(record.updatedAt)
  };
}

export function mapProposal(record) {
  return {
    id: record.id,
    jobId: record.jobId,
    freelancerId: record.freelancerId,
    coverLetter: record.coverLetter,
    bidAmount: record.bidAmount,
    rate: record.bidAmount,
    estDuration: record.estDuration,
    estimatedDuration: record.estDuration,
    createdAt: nowIso(record.createdAt)
  };
}

export function mapMessage(record) {
  return {
    id: record.id,
    senderId: record.senderId,
    receiverId: record.receiverId,
    body: record.body,
    content: record.body,
    message: record.body,
    sentAt: nowIso(record.createdAt)
  };
}

export function mapReview(record) {
  return {
    id: record.id,
    rating: record.rating,
    comment: record.comment,
    reviewerId: record.reviewerId,
    revieweeId: record.revieweeId,
    createdAt: nowIso(record.createdAt)
  };
}

export function mapNotification(record) {
  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    body: record.body,
    message: record.body,
    read: Boolean(record.read),
    createdAt: nowIso(record.createdAt)
  };
}
