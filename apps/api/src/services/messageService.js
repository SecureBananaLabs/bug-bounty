import { getDb } from "../config/prisma.js";
import { ensureUser, mapMessage, nextId } from "./persistenceHelpers.js";

export async function listMessages() {
  const db = getDb();
  const messages = await db.message.findMany({
    orderBy: { createdAt: "asc" }
  });

  return messages.map(mapMessage);
}

export async function sendMessage(payload) {
  const db = getDb();
  const id = nextId("msg", payload.id);
  const senderId = payload.senderId ?? payload.userId ?? "usr_placeholder_sender";
  const receiverId = payload.receiverId ?? payload.toUserId ?? "usr_placeholder_receiver";

  await ensureUser(senderId);
  await ensureUser(receiverId);

  const message = await db.message.create({
    data: {
      id,
      senderId,
      receiverId,
      body: payload.body ?? payload.content ?? payload.message ?? ""
    }
  });

  return mapMessage(message);
}
