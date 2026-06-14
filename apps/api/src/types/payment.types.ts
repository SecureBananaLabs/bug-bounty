export interface PaymentIntentPayload {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string | null;
  amount: number;
  currency: string;
  provider: string;
}