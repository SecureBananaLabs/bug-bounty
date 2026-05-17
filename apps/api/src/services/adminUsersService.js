import { getAdminData, nextAdminId } from "./adminData.js";

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(left, right) {
  if (!left || !right) {
    return false;
  }
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function matchesSearch(user, search) {
  if (!search) {
    return true;
  }

  const needle = search.trim().toLowerCase();
  return [user.name, user.email, user.id]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(needle));
}

function enrichUser(user) {
  const data = getAdminData();
  const jobs = data.jobs.filter((job) => job.ownerId === user.id);
  const disputes = data.disputes.filter(
    (dispute) => dispute.buyerId === user.id || dispute.sellerId === user.id
  );

  return {
    ...user,
    jobsCount: jobs.length,
    disputesCount: disputes.length
  };
}

function getUserRecord(userId) {
  return getAdminData().users.find((user) => user.id === userId) ?? null;
}

function recordStatusChange(user, status, reason, adminId) {
  user.status = status;
  user.statusReason = reason ?? null;
  user.statusChangedAt = new Date().toISOString();
  user.statusChangedBy = adminId;
}

export async function listAdminUsers(filters = {}) {
  const users = getAdminData().users.filter((user) => {
    const joinedAt = toDate(user.joinedAt);
    const joinedAfter = filters.joinedAfter ? toDate(filters.joinedAfter) : null;
    const joinedBefore = filters.joinedBefore ? toDate(filters.joinedBefore) : null;
    const exactJoinDate = filters.joinDate ? toDate(filters.joinDate) : null;

    if (filters.role && user.role !== filters.role) {
      return false;
    }

    if (filters.status && user.status !== filters.status) {
      return false;
    }

    if (!matchesSearch(user, filters.search ?? "")) {
      return false;
    }

    if (exactJoinDate && !sameDay(joinedAt, exactJoinDate)) {
      return false;
    }

    if (joinedAfter && (!joinedAt || joinedAt < joinedAfter)) {
      return false;
    }

    if (joinedBefore && (!joinedAt || joinedAt > joinedBefore)) {
      return false;
    }

    return true;
  });

  return {
    users: users.map(enrichUser),
    total: users.length,
    filters: {
      role: filters.role ?? null,
      status: filters.status ?? null,
      search: filters.search ?? null,
      joinDate: filters.joinDate ?? null,
      joinedAfter: filters.joinedAfter ?? null,
      joinedBefore: filters.joinedBefore ?? null
    }
  };
}

export async function getAdminUserProfile(userId) {
  const user = getUserRecord(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const data = getAdminData();
  const jobs = data.jobs.filter((job) => job.ownerId === userId);
  const disputes = data.disputes.filter(
    (dispute) => dispute.buyerId === userId || dispute.sellerId === userId
  );
  const notifications = data.notifications.filter((notification) => notification.userId === userId);

  return {
    user: enrichUser(user),
    jobs,
    disputes,
    notifications
  };
}

export async function suspendAdminUser(userId, payload = {}, adminId = null) {
  const user = getUserRecord(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "admin" && user.id === adminId) {
    const error = new Error("Admins cannot suspend themselves");
    error.status = 400;
    throw error;
  }

  recordStatusChange(user, "suspended", payload.reason ?? "Suspended by admin", adminId);
  const notification = {
    id: nextAdminId("ntf"),
    userId: user.id,
    type: "account_status",
    message: payload.reason
      ? `Your account was suspended: ${payload.reason}`
      : "Your account was suspended by an administrator.",
    createdAt: new Date().toISOString()
  };

  getAdminData().notifications.push(notification);

  return {
    user: enrichUser(user),
    notification
  };
}

export async function reinstateAdminUser(userId, adminId = null) {
  const user = getUserRecord(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  recordStatusChange(user, "active", null, adminId);
  return {
    user: enrichUser(user)
  };
}

export async function banAdminUser(userId, payload = {}, adminId = null) {
  const user = getUserRecord(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  recordStatusChange(user, "banned", payload.reason ?? "Banned by admin", adminId);
  const notification = {
    id: nextAdminId("ntf"),
    userId: user.id,
    type: "account_status",
    message: payload.reason
      ? `Your account was banned: ${payload.reason}`
      : "Your account was banned by an administrator.",
    createdAt: new Date().toISOString()
  };

  getAdminData().notifications.push(notification);

  return {
    user: enrichUser(user),
    notification
  };
}

