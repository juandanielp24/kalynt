'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

type VerificationState = 'verifying' | 'success' | 'error' | 'waiting';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [state, setState] = useState<VerificationState>(token ? 'verifying' : 'waiting');
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await apiClient.post('/auth/verify-email', {
        token: verificationToken,
      });

      setState('success');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setState('error');
      setError(err.response?.data?.message || 'Failed to verify email. The token may be invalid or expired.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required to resend verification');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);
    setError(null);

    try {
      await apiClient.post('/auth/resend-verification', {
        email,
      });

      setResendSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (state === 'verifying') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verifying your email...</h2>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-gray-600">
            Your email has been successfully verified. You can now log in to your account.
          </p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-primary hover:underline"
          >
            Go to login now
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verification Failed</h2>
          <p className="text-gray-600">{error}</p>

          {email && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600">
                You can request a new verification email below.
              </p>

              {resendSuccess && (
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                  Verification email sent! Please check your inbox.
                </div>
              )}

              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-primary hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Waiting state (no token, just email)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <Mail className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-600">
          We've sent a verification link to{' '}
          <span className="font-medium text-gray-900">{email || 'your email address'}</span>
        </p>
        <p className="text-sm text-gray-500">
          Click the link in the email to verify your account. The link will expire in 24 hours.
        </p>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-600">Didn't receive the email?</p>

          {resendSuccess && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              Verification email sent! Please check your inbox.
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            onClick={handleResendVerification}
            disabled={isResending || !email}
            className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-primary hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
