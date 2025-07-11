import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get("stripe-signature");
  console.log(body, "=>", headersList, "=>", sig);
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    console.log("event", event);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "payment_intent.requires_action":
        await handlePaymentIntentRequiresAction(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log("Webhook event processed:", {
      id: event.id,
      type: event.type,
      created: event.created,
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Checkout session completed:", session.id);

  // Here you would typically:
  // 1. Update your database with the successful payment
  // 2. Send confirmation email to customer
  // 3. Fulfill the order (send digital products, etc.)
  // 4. Update user permissions/access

  const customerEmail = session.customer_details?.email;
  const amountTotal = session.amount_total;
  const currency = session.currency;

  console.log("Payment details:", {
    sessionId: session.id,
    customerEmail,
    amount: amountTotal,
    currency,
    paymentStatus: session.payment_status,
  });

  // Example: Log to a hypothetical order fulfillment system
  await logOrderFulfillment({
    sessionId: session.id,
    customerEmail,
    amount: amountTotal,
    currency,
    status: "completed",
    metadata: session.metadata,
  });
}

async function handleCheckoutSessionExpired(session: any) {
  console.log("Checkout session expired:", session.id);

  // Here you would typically:
  // 1. Clean up any temporary data
  // 2. Send abandoned cart email (if appropriate)
  // 3. Update analytics

  await logOrderFulfillment({
    sessionId: session.id,
    status: "expired",
    expiredAt: new Date().toISOString(),
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log("Payment intent succeeded:", paymentIntent.id);

  // This event is fired when a payment is successful
  // It's more reliable than checkout.session.completed for payment confirmation

  const amount = paymentIntent.amount;
  const currency = paymentIntent.currency;
  const customerId = paymentIntent.customer;

  console.log("Payment confirmed:", {
    paymentIntentId: paymentIntent.id,
    amount,
    currency,
    customerId,
  });
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log("Payment intent failed:", paymentIntent.id);

  const lastPaymentError = paymentIntent.last_payment_error;

  // Here you would typically:
  // 1. Log the failure reason
  // 2. Send notification to customer about failed payment
  // 3. Suggest alternative payment methods

  console.log("Payment failure details:", {
    paymentIntentId: paymentIntent.id,
    errorType: lastPaymentError?.type,
    errorCode: lastPaymentError?.code,
    errorMessage: lastPaymentError?.message,
    declineCode: lastPaymentError?.decline_code,
  });
}

async function handlePaymentIntentRequiresAction(paymentIntent: any) {
  console.log("Payment intent requires action:", paymentIntent.id);

  // This typically happens with 3D Secure authentication
  // The customer needs to complete additional authentication

  console.log("Authentication required for payment:", {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    nextAction: paymentIntent.next_action?.type,
  });
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log("Invoice payment succeeded:", invoice.id);

  // Handle subscription invoice payments
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  const amountPaid = invoice.amount_paid;

  console.log("Subscription payment confirmed:", {
    invoiceId: invoice.id,
    subscriptionId,
    customerId,
    amountPaid,
  });
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log("Invoice payment failed:", invoice.id);

  // Handle failed subscription payments
  // You might want to retry payment or notify the customer

  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  const attemptCount = invoice.attempt_count;

  console.log("Subscription payment failed:", {
    invoiceId: invoice.id,
    subscriptionId,
    customerId,
    attemptCount,
  });
}

async function handleSubscriptionCreated(subscription: any) {
  console.log("Subscription created:", subscription.id);

  // Handle new subscription creation
  const customerId = subscription.customer;
  const status = subscription.status;

  console.log("New subscription:", {
    subscriptionId: subscription.id,
    customerId,
    status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log("Subscription updated:", subscription.id);

  // Handle subscription changes (plan changes, status changes, etc.)
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  console.log("Subscription update:", {
    subscriptionId: subscription.id,
    status,
    cancelAtPeriodEnd,
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log("Subscription deleted:", subscription.id);

  // Handle subscription cancellation
  const customerId = subscription.customer;
  const canceledAt = subscription.canceled_at;

  console.log("Subscription canceled:", {
    subscriptionId: subscription.id,
    customerId,
    canceledAt,
  });
}

// Mock function to simulate order fulfillment logging
async function logOrderFulfillment(orderData: any) {
  // In a real application, this would write to your database
  console.log("Order fulfillment logged:", orderData);

  // Example: Save to database
  // await db.orders.create(orderData);

  // Example: Send to external service
  // await fulfillmentService.processOrder(orderData);

  // Example: Send email notification
  // await emailService.sendOrderConfirmation(orderData);
}
