import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { verifyEmail, resendVerification } from '../api/authApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('No verification token provided.');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error: any) {
        const message = error.response?.data?.error?.message || 'Verification failed';

        // Check if token is expired
        if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }

        setErrorMessage(message);
      }
    };

    verify();
  }, [token, navigate]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      await resendVerification();
      setResendSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Verifying your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Email Verified!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to home page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Verification Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {errorMessage}
              </p>
              <Link to="/">
                <Button variant="default">
                  Return to Home
                </Button>
              </Link>
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Mail className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Verification Link Expired
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {errorMessage}
              </p>

              {resendSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 w-full">
                  <p className="text-green-800 dark:text-green-200 text-sm text-center">
                    Verification email sent! Please check your inbox.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
                    Click below to receive a new verification email
                  </p>
                  <Button
                    variant="default"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                </div>
              )}

              <Link to="/" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Return to Home
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
