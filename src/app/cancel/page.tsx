'use client';

import { useEffect, useState } from 'react';

export default function CancelPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">What happened?</h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• You clicked the back button during checkout</li>
              <li>• You closed the payment window</li>
              <li>• The payment session timed out</li>
              <li>• You chose to cancel the transaction</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Automatically redirecting to home page in{' '}
              <span className="font-bold text-blue-600">{countdown}</span> seconds...
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Return to Shop
            </a>
            <a
              href="/support"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Need Help?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

