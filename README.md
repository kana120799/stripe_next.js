# Next.js + Stripe Integration

## Overview

Next.js application integrate Stripe payments with proper handling of success/failure states, session management, time limits, expired sessions, and webhook implementation.

### Testing Payments

- Test card: 4242 4242 4242 4242

### Webhook Implementation

- Secure signature verification
- Handle multiple event types:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.requires_action`
  - Subscription events

### Webhook Testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Test specific events
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
```
