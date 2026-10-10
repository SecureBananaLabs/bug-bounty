let logs = [];
let nextId = 1;

export const auditLog = {
  append(entry) {
    const record = {
      id: nextId++,
      ...entry,
      timestamp: new Date().toISOString()
    };
    logs.push(record);
    return record;
  },
  list(filters = {}) {
    let result = [...logs];
    if (filters.adminId) result = result.filter((r) => r.adminId === filters.adminId);
    if (filters.action) result = result.filter((r) => r.action === filters.action);
    if (filters.from) result = result.filter((r) => new Date(r.timestamp) >= new Date(filters.from));
    if (filters.to) result = result.filter((r) => new Date(r.timestamp) <= new Date(filters.to));
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
};
