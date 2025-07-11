import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    // Check if session exists
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return NextResponse.json(
        { 
          error: 'Session has expired',
          expired_at: new Date(session.expires_at * 1000).toISOString()
        },
        { status: 410 }
      );
    }

    // Return session information
    const sessionInfo = {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      expires_at: session.expires_at,
      created: session.created,
      metadata: session.metadata,
      line_items: session.line_items?.data.map(item => ({
        description: item.description,
        quantity: item.quantity,
        amount_total: item.amount_total,
      })),
    };

    return NextResponse.json({ session: sessionInfo });
  } catch (error: any) {
    console.error('Session retrieval failed:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to retrieve session',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

