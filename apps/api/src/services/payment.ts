 // Initialize Stripe
 const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
 
 // Create payment intent
 const paymentIntent = await stripe.paymentIntents.create({
   amount: payload.amount,
   currency: payload.currency ?? "usd",
   automatic_payment_methods: { enabled: true }
 });
 
 return {
   clientSecret: paymentIntent.client_secret,
   paymentId: paymentIntent.id
 };