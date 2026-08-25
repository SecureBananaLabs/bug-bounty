import{z}from"zod";
export const createMessageSchema=z.object({receiverId:z.string().min(1),content:z.string().min(1).max(2000).trim()});
