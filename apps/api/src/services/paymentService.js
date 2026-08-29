export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
  return payment;
}

async function processManualPayout(proposalId, txHash, method = 'crypto') {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) throw new Error('Proposal not found');
  
  proposal.status = 'paid';
  proposal.paymentMethod = method;
  proposal.transactionHash = txHash;
  proposal.paidAt = new Date();
  await proposal.save();

  return proposal;
}

module.exports = {
  createAlgoraPayout,
  processManualPayout
};
