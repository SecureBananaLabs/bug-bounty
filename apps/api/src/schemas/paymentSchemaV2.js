import{z}from"zod";
export const paymentSchemaV2=z.object({amount:z.number().positive(),currency:z.string().length(3),description:z.string().min(1).max(200).trim().optional()});