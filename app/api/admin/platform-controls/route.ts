import { NextResponse } from 'next/server';
import { adminMiddleware } from '@/middleware/adminAuth';
import { db } from '@/lib/db/client';
import { createAuditLog } from '@/lib/db/auditLog';

export async function PATCH(req: Request) {
  // Este endpoint deve ser protegido pelo middleware de admin no nível de rota
  const { setting, value, adminId } = await req.json();

  try {
    const updatedSettings = await db.platformSettings.update({
      where: { id: setting },
      data: { value },
    });

    await createAuditLog(adminId, `TOGGLE_${setting.toUpperCase()}`, { value });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
