import{z}from"zod";
export const createNotificationSchema=z.object({
  userId:z.string().min(1),
  message:z.string().min(1).max(500).trim(),
  type:z.enum(["info","warning","error","success"]),
  // id and read fields are set server-side only - not accepted from client
});
