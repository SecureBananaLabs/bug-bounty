import{z}from"zod";
export const createJobSchema=z.object({
  title:z.string().min(4).trim(),
  description:z.string().min(10).trim(),
  categoryId:z.string().min(1).trim(),
  budget:z.object({min:z.number().min(0),max:z.number().min(0)}).refine(b=>b.max>b.min,{message:"budget.max must be greater than budget.min"}),
  skills:z.array(z.string().min(1).trim()).min(1),
  status:z.enum(["OPEN","CLOSED"]).default("OPEN"),
});
