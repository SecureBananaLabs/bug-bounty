import { db } from './client';

export async function createAuditLog(adminId: string, action: string, details: any) {
  return await db.auditLog.create({
    data: {
      adminId,
      action,
      details: JSON.stringify(details),
      timestamp: new Date(),
    },
  });
}
