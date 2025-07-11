import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');
    const sessionId = searchParams.get('session_id');

    if (!paymentIntentId && !sessionId) {
      return NextResponse.json(
        { error: 'Payment Intent ID or Session ID is required' },
        { status: 400 }
      );
    }

    let paymentIntent;
    let session;

    if (paymentIntentId) {
      // Direct payment intent lookup
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } else if (sessionId) {
      // Get payment intent from session
      session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_intent && typeof session.payment_intent === 'string') {
        paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      }
    }

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment Intent not found' },
        { status: 404 }
      );
    }

    // Determine payment status and provide detailed information
    const statusInfo = getPaymentStatusInfo(paymentIntent.status, paymentIntent.last_payment_error);

    const response = {
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        client_secret: paymentIntent.client_secret,
      },
      session: session ? {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        expires_at: session.expires_at,
      } : null,
      status_info: statusInfo,
      last_payment_error: paymentIntent.last_payment_error ? {
        type: paymentIntent.last_payment_error.type,
        code: paymentIntent.last_payment_error.code,
        message: paymentIntent.last_payment_error.message,
        decline_code: paymentIntent.last_payment_error.decline_code,
      } : null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Payment status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function getPaymentStatusInfo(status: string, lastError?: any) {
  const statusMap: Record<string, { message: string; type: 'success' | 'error' | 'warning' | 'info' }> = {
    succeeded: {
      message: 'Payment completed successfully',
      type: 'success'
    },
    processing: {
      message: 'Payment is being processed',
      type: 'info'
    },
    requires_payment_method: {
      message: 'Payment failed - please try a different payment method',
      type: 'error'
    },
    requires_confirmation: {
      message: 'Payment requires additional confirmation',
      type: 'warning'
    },
    requires_action: {
      message: 'Payment requires additional authentication (3D Secure)',
      type: 'warning'
    },
    canceled: {
      message: 'Payment was canceled',
      type: 'error'
    },
    requires_capture: {
      message: 'Payment authorized, awaiting capture',
      type: 'info'
    },
  };

  const info = statusMap[status] || {
    message: `Unknown payment status: ${status}`,
    type: 'warning' as const
  };

  // Add specific error information if available
  if (lastError && status === 'requires_payment_method') {
    const errorMessages: Record<string, string> = {
      card_declined: 'Your card was declined',
      expired_card: 'Your card has expired',
      incorrect_cvc: 'Your card\'s security code is incorrect',
      processing_error: 'An error occurred while processing your card',
      incorrect_number: 'Your card number is incorrect',
    };

    if (lastError.decline_code && errorMessages[lastError.decline_code]) {
      info.message = errorMessages[lastError.decline_code];
    }
  }

  return info;
}

