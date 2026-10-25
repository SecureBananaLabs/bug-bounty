import{z}from"zod";
export const notificationSchemaV4=z.object({userId:z.string().min(1),message:z.string().min(1).max(500).trim(),type:z.enum(["info","warning","error","success"])});