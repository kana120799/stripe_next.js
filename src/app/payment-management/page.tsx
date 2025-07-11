"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/data/products";

interface PaymentSession {
  id: string;
  status: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  expires_at: number;
  created: number;
  customer_email?: string;
}

interface PaymentStatusInfo {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export default function PaymentManagementPage() {
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [statusInfo, setStatusInfo] = useState<PaymentStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Calculate time remaining for session expiration
  useEffect(() => {
    if (!session?.expires_at) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = session.expires_at - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const checkPaymentStatus = async () => {
    if (!sessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, get session information
      const sessionResponse = await fetch(
        `/api/checkout/session?session_id=${sessionId}`
      );
      const sessionData = await sessionResponse.json();

      if (sessionData.error) {
        setError(sessionData.error);
        setSession(null);
        setStatusInfo(null);
        return;
      }

      setSession(sessionData.session);

      // Then, get detailed payment status if available
      const statusResponse = await fetch(
        `/api/payment/status?session_id=${sessionId}`
      );
      const statusData = await statusResponse.json();

      if (statusData.status_info) {
        setStatusInfo(statusData.status_info);
      }
    } catch (err) {
      setError("Failed to check payment status");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Expired";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: string, paymentStatus?: string): string => {
    if (paymentStatus === "paid") return "text-green-600";
    if (status === "expired") return "text-red-600";
    if (status === "open") return "text-blue-600";
    return "text-yellow-600";
  };

  const getStatusIcon = (type: string): string => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "❓";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Session Management
          </h1>
          <p className="text-xl text-gray-600">
            Monitor payment sessions, check expiration times, and handle
            different payment states
          </p>
        </div>

        {/* Session ID Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Check Payment Session
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter Stripe session ID (cs_...)"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={checkPaymentStatus}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              💡 <strong>Tip:</strong> Complete a purchase to get a session ID,
              or use the test session ID from the URL after checkout.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">❌</span>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Information */}
        {session && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Session Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Session ID
                  </label>
                  <p
                    className="font-mono text-sm bg-gray-100 p-2 rounded cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(session.id)}
                    title="Click to copy"
                  >
                    {session.id.slice(0, 20) + "..."}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <p
                    className={`font-semibold ${getStatusColor(
                      session.status,
                      session.payment_status
                    )}`}
                  >
                    {session.status.toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Payment Status
                  </label>
                  <p
                    className={`font-semibold ${getStatusColor(
                      session.payment_status
                    )}`}
                  >
                    {session.payment_status.toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Amount
                  </label>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(session.amount_total, session.currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Created
                  </label>
                  <p className="text-gray-400">
                    {new Date(session.created * 1000).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Expires At
                  </label>
                  <p className="text-gray-400">
                    {new Date(session.expires_at * 1000).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Time Remaining
                  </label>
                  <p
                    className={`font-bold text-lg ${
                      timeRemaining && timeRemaining > 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {timeRemaining !== null
                      ? formatTimeRemaining(timeRemaining)
                      : "Calculating..."}
                  </p>
                </div>

                {session.customer_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Customer Email
                    </label>
                    <p className="text-gray-400">{session.customer_email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Expiration Warning */}
            {timeRemaining !== null &&
              timeRemaining > 0 &&
              timeRemaining < 300 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                    <div>
                      <h3 className="text-yellow-800 font-semibold">
                        Session Expiring Soon
                      </h3>
                      <p className="text-yellow-700">
                        This session will expire in{" "}
                        {formatTimeRemaining(timeRemaining)}. The customer
                        should complete their payment soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Session Expired */}
            {timeRemaining === 0 && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-3">❌</span>
                  <div>
                    <h3 className="text-red-800 font-semibold">
                      Session Expired
                    </h3>
                    <p className="text-red-700">
                      This checkout session has expired. The customer will need
                      to start a new checkout process.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Status Information */}
        {statusInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Status Details
            </h2>

            <div
              className={`border-l-4 p-4 rounded-r-lg ${
                statusInfo.type === "success"
                  ? "border-green-500 bg-green-50"
                  : statusInfo.type === "error"
                  ? "border-red-500 bg-red-50"
                  : statusInfo.type === "warning"
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-blue-500 bg-blue-50"
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {getStatusIcon(statusInfo.type)}
                </span>
                <div>
                  <h3
                    className={`font-semibold ${
                      statusInfo.type === "success"
                        ? "text-green-800"
                        : statusInfo.type === "error"
                        ? "text-red-800"
                        : statusInfo.type === "warning"
                        ? "text-yellow-800"
                        : "text-blue-800"
                    }`}
                  >
                    Payment Status
                  </h3>
                  <p
                    className={
                      statusInfo.type === "success"
                        ? "text-green-700"
                        : statusInfo.type === "error"
                        ? "text-red-700"
                        : statusInfo.type === "warning"
                        ? "text-yellow-700"
                        : "text-blue-700"
                    }
                  >
                    {statusInfo.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Educational Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Understanding Stripe Sessions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Session States
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <strong>Open:</strong> Session is active, awaiting payment
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <strong>Complete:</strong> Payment successful
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <strong>Expired:</strong> Session timed out (30 min default)
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Payment States
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <strong>Unpaid:</strong> No payment attempt yet
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <strong>Paid:</strong> Payment completed successfully
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <strong>No Payment Required:</strong> Free or zero-amount
                  session
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
