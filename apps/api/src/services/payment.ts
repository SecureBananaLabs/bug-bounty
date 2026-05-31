

 // Validate payload
 if (!payload.amount || payload.amount <= 0 || !Number.isInteger(payload.amount) || payload.amount <= 0) {
   throw new Error('Invalid amount. Must be a positive integer');
 }
 
 try {
   const paymentIntent = await stripe.paymentIntents.create({
     amount: payload.amount,
     currency: payload.currency || 'usd',
     metadata: { integration_check: true }
   });
   return {
     clientSecret: paymentIntent.client_secret,
     paymentId: paymentIntent.id
   };
 } catch (error) {
   throw new Error('Stripe API error: ' + error.message);
 }