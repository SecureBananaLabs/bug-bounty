import { prisma } from '../../prisma';

export const sendMessage = async (content: string, recipientId: string) => {
  const message = await prisma.message.create({
    data: {
      content,
      recipientId,
    },
  });
  return message;
};