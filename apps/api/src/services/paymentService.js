/**
 * Stripe PaymentIntent 服务
 *
 * 环境变量:
 *   STRIPE_SECRET_KEY - Stripe 密钥（测试时可 mock）
 */

let stripeInstance = null;

/** 内部初始化（测试可通过此函数注入 mock） */
export function __setStripeInstance(mock) {
  stripeInstance = mock;
}

/**
 * Stripe 错误 → 用户友好的错误消息
 */
function extractStripeMessage(error) {
  if (error.type === "card_error") return `Card error: ${error.message}`;
  if (error.type === "invalid_request_error") return `Invalid request: ${error.message}`;
  if (error.type === "authentication_error") return "Authentication failed. Check STRIPE_SECRET_KEY.";
  if (error.type === "rate_limit_error") return "Too many requests. Please try again later.";
  if (error.type === "api_error") return `Stripe API error: ${error.message}`;
  return `Payment processing error: ${error.message}`;
}

/**
 * 创建 Stripe PaymentIntent
 *
 * @param {object} payload
 * @param {number} payload.amount    - 金额（最小货币单位，如美分）
 * @param {string} [payload.currency] - 货币代码，默认 "usd"
 * @returns {Promise<{paymentId, clientSecret, amount, currency}>}
 */
export async function createPaymentIntent(payload) {
  // ── 验证 ──
  if (!payload || payload.amount == null) {
    throw Object.assign(new Error("amount is required and must be a positive integer"), {
      statusCode: 400,
    });
  }

  const amount = Number(payload.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw Object.assign(
      new Error("amount must be a positive integer (in smallest currency unit, e.g. cents)"),
      { statusCode: 400 },
    );
  }

  const currency = (payload.currency || "usd").toLowerCase();

  // ── 获取 Stripe 实例 ──
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    const { default: Stripe } = await import("stripe");
    stripeInstance = new Stripe(key, { apiVersion: "2025-03-31.basil" });
  }

  // ── 调用 Stripe API ──
  try {
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount,
      currency,
      metadata: payload.metadata ?? {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    // Stripe 错误
    if (error.type) {
      const msg = extractStripeMessage(error);
      const thrown = new Error(msg);
      thrown.statusCode = error.statusCode || 502;
      throw thrown;
    }
    // 未知错误
    throw error;
  }
}
