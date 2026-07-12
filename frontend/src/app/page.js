'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/shared/FormField';
import Button from '@/components/shared/Button';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import { ShieldCheck, Mail, Lock, User, KeyRound } from 'lucide-react';
import useAuth from '@/utils/useAuth';

function LoginPageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState('credentials'); // credentials -> otp
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If token exists, direct to dashboard
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await auth.signup(name, email, password);
        showToast('OTP sent successfully! Please check your email.', 'success');
      } else {
        await auth.login(email, password);
        showToast('OTP sent successfully! Please check your email.', 'success');
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await auth.verifySignupOtp(email, otp);
        showToast('Account created and verified! Welcome to AssetFlow.', 'success');
      } else {
        await auth.verifyLoginOtp(email, otp);
        showToast('Logged in successfully!', 'success');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
      showToast(err.message || 'Invalid OTP code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    setError('');
    try {
      showToast('Password reset link and OTP sent to your email.', 'success');
      setStep('otp');
    } catch (err) {
      setError('Failed to send reset code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12 relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-steel/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-raised border border-hairline rounded-[10px] shadow-xl overflow-hidden relative z-10">
        {/* Banner Brand Header */}
        <div className="bg-ink px-8 py-8 text-center text-white border-b border-hairline flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 justify-center mb-1">
            <span className="w-4.5 h-4.5 bg-accent rounded-[4px] rotate-45"></span>
            <h1 className="text-2xl font-bold font-display tracking-widest text-white uppercase">ASSETFLOW</h1>
          </div>
          <p className="text-xs text-steel tracking-wide uppercase">Enterprise Asset & Resource Management</p>
        </div>

        {/* Form Body */}
        <div className="px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-[6px] bg-status-lost/10 border border-status-lost/20 text-status-lost text-xs font-mono font-medium">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              {isSignup && (
                <FormField
                  label="Full Name"
                  type="text"
                  placeholder="e.g. John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              <FormField
                label="Corporate Email Address"
                type="email"
                placeholder="e.g. name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <FormField
                label="Secure Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-between pt-1">
                {!isSignup && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-steel hover:text-ink hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
                <span className="text-xs text-steel">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(!isSignup);
                      setError('');
                    }}
                    className="text-accent hover:underline font-semibold cursor-pointer"
                  >
                    {isSignup ? 'Log In' : 'Sign Up'}
                  </button>
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : isSignup ? 'Create Account' : 'Authenticate Security'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div className="text-center mb-4">
                <KeyRound className="w-10 h-10 text-accent mx-auto mb-2 opacity-80" />
                <h3 className="font-semibold font-display text-ink uppercase tracking-wider text-sm">Security Code Required</h3>
                <p className="text-xs text-steel mt-1 max-w-xs mx-auto">
                  A verification code has been dispatched to <strong className="text-ink">{email}</strong>. Enter it below to unlock.
                </p>
              </div>

              <FormField
                label="One-Time Verification OTP"
                type="text"
                placeholder="e.g. 123456"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center tracking-widest font-mono text-lg"
              />

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-steel hover:text-ink hover:underline cursor-pointer"
                >
                  ← Back to Credentials
                </button>
                <button
                  type="button"
                  onClick={handleCredentialsSubmit}
                  className="text-accent hover:underline font-semibold cursor-pointer"
                >
                  Resend Code
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying OTP...' : 'Verify & Launch System'}
              </Button>
            </form>
          )}
        </div>
      </div>
      
      {/* Route to Style Guide shortcut */}
      <div className="absolute bottom-4 left-4 z-10">
        <Button variant="secondary" onClick={() => router.push('/style-guide')} className="!text-[11px] !px-3 !py-1 text-steel">
          Style Guide Preview
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginPageContent />
    </ToastProvider>
  );
}
