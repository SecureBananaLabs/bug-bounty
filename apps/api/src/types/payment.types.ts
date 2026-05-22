export interface PaymentIntentPayload {
  amount?: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentId: string;
}