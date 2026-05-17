import { getAdminData } from "./adminData.js";

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveRange(query = {}) {
  if (query.from || query.to) {
    const from = parseDate(query.from);
    const to = parseDate(query.to);

    if (!from || !to) {
      const error = new Error("Both from and to must be valid dates");
      error.status = 400;
      throw error;
    }

    return { label: "custom", from, to };
  }

  const range = query.range ?? "30d";
  const end = new Date();
  const presets = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "12m": 365,
    all: null
  };

  if (!(range in presets)) {
    const error = new Error("Unsupported metrics range");
    error.status = 400;
    throw error;
  }

  if (range === "all") {
    return { label: "all", from: null, to: null };
  }

  const from = new Date(end.getTime() - presets[range] * 24 * 60 * 60 * 1000);
  return { label: range, from, to: end };
}

function isWithinRange(value, range) {
  if (!range.from || !range.to) {
    return true;
  }

  const date = parseDate(value);
  if (!date) {
    return false;
  }

  return date >= range.from && date <= range.to;
}

export async function getPlatformMetrics(query = {}) {
  const data = getAdminData();
  const range = resolveRange(query);

  const registeredUsers = data.users.filter((user) => isWithinRange(user.joinedAt, range));
  const activeJobs = data.jobs.filter(
    (job) => job.status === "active" && isWithinRange(job.createdAt, range)
  );
  const disputes = data.disputes.filter((dispute) => isWithinRange(dispute.openedAt, range));
  const revenue = data.disputes
    .flatMap((dispute) => dispute.transactions ?? [])
    .filter(
      (transaction) =>
        transaction.type === "platform_fee" && isWithinRange(transaction.createdAt, range)
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    range: {
      label: range.label,
      from: range.from ? range.from.toISOString() : null,
      to: range.to ? range.to.toISOString() : null
    },
    metrics: {
      registeredUsers: registeredUsers.length,
      activeJobs: activeJobs.length,
      revenue,
      disputes: disputes.length
    }
  };
}

