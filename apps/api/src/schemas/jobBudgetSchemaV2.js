import{z}from"zod";
export const jobBudgetSchema=z.object({min:z.number().nonnegative(),max:z.number().positive()}).refine(b=>b.max>b.min,{message:"max must be greater than min"});