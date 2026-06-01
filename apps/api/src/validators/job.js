import { z } from "zod";

// 1. Definiamo i campi base in un oggetto pulito
const baseJobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

// 2. Funzione di convalida riutilizzabile per il budget invertito
// Gestisce sia numeri interi, decimali, che l'assenza di uno dei due (durante i partial update)
const validateBudgetRange = (data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
};

const budgetErrorMessage = {
  message: "budgetMax cannot be less than budgetMin",
  path: ["budgetMax"],
};

// 3. Schema di Creazione (Applica il controllo obbligatorio)
export const createJobSchema = z
  .object(baseJobFields)
  .refine(validateBudgetRange, budgetErrorMessage);

// 4. Schema di Aggiornamento (Rende i campi opzionali MA valida se entrambi vengono inviati)
export const updateJobSchema = z
  .object(baseJobFields)
  .partial()
  .refine(validateBudgetRange, budgetErrorMessage);