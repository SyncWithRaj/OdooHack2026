'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { KeyRound, Loader2 } from 'lucide-react';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [flow, setFlow] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // Retrieve email and flow from localStorage
    const storedEmail = localStorage.getItem('auth_email');
    const storedFlow = localStorage.getItem('auth_flow');
    
    if (!storedEmail || !storedFlow) {
      toast.error('Authentication session not found. Please try again.');
      router.push('/login');
    } else {
      setEmail(storedEmail);
      setFlow(storedFlow);
    }
  }, [router]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = flow === 'signup' ? '/auth/verify-signup-otp' : '/auth/verify-login-otp';
      const response = await api.post(endpoint, { email, otp });
      
      toast.success(response.data.message);
      
      // Clean up localStorage
      localStorage.removeItem('auth_email');
      localStorage.removeItem('auth_flow');
      
      // Update global auth context which redirects to dashboard
      login(response.data.data.user, response.data.data.token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  if (!email) return null; // Wait until useEffect loads the email

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleVerify}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Allow only numbers
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-[0.5em] sm:text-2xl"
                  placeholder="123456"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                className="font-medium text-blue-600 hover:text-blue-500 bg-transparent border-none cursor-pointer"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
