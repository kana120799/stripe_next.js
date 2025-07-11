#### 1. Checkout Sessions

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "Premium Course",
        },
        unit_amount: 4999, // $49.99 in cents
      },
      quantity: 1,
    },
  ],
  success_url: "https://yoursite.com/success",
  cancel_url: "https://yoursite.com/cancel",
});
```

**Key Points:**

- Sessions expire after 24 hours by default (customizable to 30 minutes - 24 hours)
- Prices are always in the smallest currency unit (cents for USD)
- Sessions are one-time use only

#### 2. Payment Intents

Payment Intents represent your intent to collect payment from a customer. It track the payment lifecycle and handle complex payment flows.

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 4999,
  currency: "usd",
  metadata: {
    order_id: "12345",
  },
});
```

#### 3. Webhooks

Webhooks are HTTP callbacks that Stripe sends to your application when events occur.

```typescript
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

## Payment Flow Architecture

### 1. Client-Side Flow

```mermaid
graph TD
    A[User clicks "Buy Now"] --> B[Frontend calls /api/checkout]
    B --> C[Create Checkout Session]
    C --> D[Redirect to Stripe Checkout]
    D --> E[User completes payment]
    E --> F[Redirect to success/cancel page]
```

### 2. Server-Side Flow

```typescript
// 1. Create checkout session
export async function POST(request: NextRequest) {
  const { productId, quantity } = await request.json();

  const session = await stripe.checkout.sessions.create({
    // ... session configuration
  });

  return NextResponse.json({ url: session.url });
}

// 2. Handle webhook events
export async function POST(request: NextRequest) {
  const event = stripe.webhooks.constructEvent(body, sig, secret);

  switch (event.type) {
    case "checkout.session.completed":
      // Handle successful payment
      break;
    case "payment_intent.payment_failed":
      // Handle failed payment
      break;
  }
}
```

## Session Management

#### Implementation

```typescript
// Set custom expiration (30 minutes)
const session = await stripe.checkout.sessions.create({
  expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  // ... other options
});

// Check expiration client-side
useEffect(() => {
  const checkExpiration = () => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = session.expires_at - now;
    setTimeRemaining(remaining > 0 ? remaining : 0);
  };

  const interval = setInterval(checkExpiration, 1000);
  return () => clearInterval(interval);
}, [session]);
```

## Error Handling Strategies

### Common Payment Errors

#### 1. Card Declined

```typescript
const errorMessages = {
  card_declined: "Your card was declined",
  expired_card: "Your card has expired",
  incorrect_cvc: "Your card's security code is incorrect",
  processing_error: "An error occurred while processing your card",
  incorrect_number: "Your card number is incorrect",
};
```

#### 2. Session Expired

```typescript
if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
  return NextResponse.json(
    {
      error: "Session has expired",
      expired_at: new Date(session.expires_at * 1000).toISOString(),
    },
    { status: 410 }
  );
}
```

## Webhook Implementation

### Why Webhooks Are Critical

- **Reliability**: Events are delivered even if user's browser crashes
- **Security**: Server-to-server communication
- **Completeness**: Capture all payment events, not just success
- **Real-time**: Process events as they happen

### Webhook Security

```typescript
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = headers().get("stripe-signature");

  let event;
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Process verified event
  await processWebhookEvent(event);

  return NextResponse.json({ received: true });
}
```

### Event Processing Patterns

#### 1. Idempotent Processing

```typescript
const processedEvents = new Set();

async function processWebhookEvent(event) {
  if (processedEvents.has(event.id)) {
    console.log("Event already processed:", event.id);
    return;
  }

  // Process event
  await handleEvent(event);

  // Mark as processed
  processedEvents.add(event.id);
}
```

#### 2. Async Processing

```typescript
async function handleCheckoutSessionCompleted(session) {
  // Queue background job for order fulfillment
  await orderQueue.add("fulfill-order", {
    sessionId: session.id,
    customerEmail: session.customer_details?.email,
    amount: session.amount_total,
  });
}
```

### Critical Webhook Events

#### Payment Events

- `checkout.session.completed`: Customer completed checkout
- `payment_intent.succeeded`: Payment confirmed (most reliable)
- `payment_intent.payment_failed`: Payment failed
- `checkout.session.expired`: Session timed out

#### Subscription Events

- `customer.subscription.created`: New subscription
- `invoice.payment_succeeded`: Subscription payment successful
- `invoice.payment_failed`: Subscription payment failed
- `customer.subscription.deleted`: Subscription cancelled

### Integration Testing

```typescript
// Test checkout session creation
describe("Checkout API", () => {
  it("should create checkout session", async () => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "prod_1",
        quantity: 1,
      }),
    });

    const data = await response.json();
    expect(data.url).toContain("checkout.stripe.com");
  });
});
```
