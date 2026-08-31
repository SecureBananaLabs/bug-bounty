import { ok, fail } from "../utils/response.js";
import { getAdminMetrics, processManualPayout, listManualPayouts } from "../services/adminService.js";
import { z } from "zod";

const manualPayoutSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().min(1).default("USD"),
  payoutMethod: z.enum(["paypal", "crypto_evm", "crypto_solana", "bank_wire"]),
  destination: z.string().min(3, "Destination address or account is required"),
  notes: z.string().optional(),
});

export async function metrics(req, res) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: Admin access required", 403);
  }
  return ok(res, await getAdminMetrics());
}

export async function postManualPayout(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: Admin access required", 403);
  }

  try {
    const payload = manualPayoutSchema.parse(req.body);
    const result = await processManualPayout(req.user.id, payload);
    return ok(res, result, 201);
  } catch (err) {
    if (err?.name === "ZodError") {
      return fail(res, "Validation error", 400, err.flatten?.().fieldErrors);
    }
    return next(err);
  }
}

export async function getManualPayouts(req, res) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: Admin access required", 403);
  }
  return ok(res, await listManualPayouts());
}
