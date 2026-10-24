import type { CreateMessageInput } from "../schemas/messageSchema";

export interface Message extends CreateMessageInput {
  id: string;
  createdAt: string;
}

const messages: Message[] = [];

export function sendMessage(input: CreateMessageInput): Message {
  const message: Message = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  messages.push(message);
  return message;
}

export function clearMessagesForTests(): void {
  messages.length = 0;
}
