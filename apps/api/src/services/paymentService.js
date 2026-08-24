export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
  const user = await userService.getUserById(userId);
  const bounty = await db.bounties.findUnique({ where: { id: bountyId } });

  if (user.alternativePayoutMethod && ['DRC', 'CU', 'IR', 'KP', 'SY'].includes(user.country)) {
    const manualPayout = await db.payouts.create({
      data: {
        bountyId,
        userId,
        amount: bounty.amount,
        method: user.alternativePayoutMethod,
        details: user.alternativePayoutDetails,
        status: 'PENDING_MANUAL_REVIEW'
      }
    });
    return manualPayout;
  }

  const payout = await algora.createPayout(user.algoraId, bounty.amount);
  return payout;
};
