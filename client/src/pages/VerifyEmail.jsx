import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setError('No verification token provided. Please use the link from your email.');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (data.success) {
          setVerified(true);
          setError(null);
          toast.success(data.message || 'Email verified successfully!');
          // Redirect to sign-in after 3 seconds
          setTimeout(() => {
            navigate('/sign-in');
          }, 3000);
        } else {
          setError(data.message || 'Failed to verify email. Please try again or request a new verification link.');
          toast.error(data.message || 'Verification failed');
        }
      } catch (err) {
        setError('Network error. Please check your connection and try again.');
        toast.error('Network error');
        console.error('Email verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="flex justify-center mb-6">
              <Loader className="animate-spin text-blue-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        ) : verified ? (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-4">
              Your email has been verified successfully. You can now sign in to your account.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to sign in... (or <button onClick={() => navigate('/sign-in')} className="text-blue-600 font-semibold hover:underline">click here</button> if you're not redirected)
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <AlertCircle className="text-red-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">
              {error || 'We could not verify your email. The link may have expired or is invalid.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/sign-up')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Sign Up
              </button>
              <p className="text-sm text-gray-600">
                You can request a new verification email during the sign-up process.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
