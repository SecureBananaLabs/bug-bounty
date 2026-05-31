 // TODO: integrate Stripe SDK and return client secret.
 return {
   paymentId: `pay_${Date.now()}`,
   amount: payload.amount,
   currency: payload.currency ?? "usd",
   provider: "stripe"
 };
 // TODO: integrate Stripe SDK and return client secret.
 const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
 const paymentIntent = await stripe.paymentIntents.create({
   amount: payload.amount,
   currency: payload.currency ?? "usd"
 });
 return {
   paymentId: `pay_${Date/16,28/17,29/30c.ts