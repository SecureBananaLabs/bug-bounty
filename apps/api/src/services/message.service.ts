import { v4 as uuidv4 } from 'uuid';
import { Message } from '@prisma/client';

// ...

export const sendMessage = async (payload: any) => {
  const id = uuidv4(); // Generate a unique id
  const message: Message = {
    id,
    ...payload, // Spread the payload fields, ignoring any id field
    sentAt: new Date(),
  };

  // Save the message to the database
  const savedMessage = await prisma.message.create({ data: message });

  return savedMessage;
};