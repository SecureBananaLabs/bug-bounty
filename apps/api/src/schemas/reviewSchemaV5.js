import{z}from"zod";
export const reviewSchemaV5=z.object({targetId:z.string().min(1),rating:z.number().int().min(1).max(5),comment:z.string().min(10).max(1000).trim().optional()}).strip();