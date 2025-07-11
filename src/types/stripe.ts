export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
}

export interface CheckoutSession {
  id: string;
  status: string;
  payment_status: string;
  customer_email?: string;
  amount_total: number;
  currency: string;
  expires_at: number;
  created: number;
}

export interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_secret: string;
}

export interface StripeError {
  type: string;
  code?: string;
  message: string;
  decline_code?: string;
  param?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

