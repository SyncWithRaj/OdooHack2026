'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert, KeyRound, QrCode } from 'lucide-react';
import FormField from '../../components/shared/FormField';
import Button from '../../components/shared/Button';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password State Flow: 'login' | 'forgot' | 'verify' | 'reset'
  const [authView, setAuthView] = useState('login'); 
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store email temporarily for the OTP step
      localStorage.setItem('auth_email', response.data.data.email);
      localStorage.setItem('auth_flow', 'login');
      
      toast.success(response.data.message);
      router.push('/verify-otp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      toast.success('Password reset OTP sent to your email');
      setAuthView('verify');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-otp', { email: resetEmail, otp: resetOtp });
      toast.success('OTP verified. Please set your new password.');
      setAuthView('reset');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: resetEmail, otp: resetOtp, newPassword });
      toast.success('Password reset successfully. Please log in.');
      setAuthView('login');
      setEmail(resetEmail);
      setPassword('');
      setResetEmail('');
      setResetOtp('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row overflow-hidden">
      
      {/* Left panel: Brand details (desktop only) */}
      <div className="hidden md:flex md:w-1/2 bg-ink text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative Tag Stamp Corner Background */}
        <motion.div 
          initial={{ rotate: 0, opacity: 0.1 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute right-[-40px] top-[-40px] w-48 h-48 rounded-full border border-hairline/10 flex items-center justify-center opacity-40"
        >
          <div className="w-32 h-32 rounded-full border border-hairline/10" />
        </motion.div>
        
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 relative z-10"
        >
          <div className="w-6 h-6 bg-accent rounded-[4px] flex items-center justify-center font-bold text-accent-ink text-xs font-mono">
            A
          </div>
          <span className="text-xl font-bold font-display tracking-widest uppercase">
            Asset<span className="text-accent font-light">Flow</span>
          </span>
        </motion.div>

        {/* Feature Mock Stamp Display */}
        <div className="my-auto flex flex-col gap-8 relative z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ x: 6 }}
            className="flex items-start gap-4 cursor-default transition-all"
          >
            <div className="p-3 bg-white/5 border border-hairline/10 rounded group-hover:border-accent/40">
              <QrCode className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h4 className="text-base font-bold font-display uppercase tracking-wider text-white">Statically Tagged Lifecycle</h4>
              <p className="text-sm text-steel mt-1">
                Every physical resource maps back to a unique, stamped tracking code and barcode. Check histories in real time.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ x: 6 }}
            className="flex items-start gap-4 cursor-default transition-all"
          >
            <div className="p-3 bg-white/5 border border-hairline/10 rounded">
              <ArrowRight className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h4 className="text-base font-bold font-display uppercase tracking-wider text-white">Interactive Allocation Flow</h4>
              <p className="text-sm text-steel mt-1">
                Allocate hardware to departments, handle return check-ins, or request ownership transfers with validation.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Metadata Stamp */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between text-[10px] text-steel font-mono tracking-wider uppercase border-t border-hairline/10 pt-6 relative z-10"
        >
          <span>Enterprise Asset ERP Module</span>
          <span>v1.2.0</span>
        </motion.div>
      </div>

      {/* Right panel: Form views */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md bg-white border border-hairline rounded-lg p-8 shadow-sm relative overflow-hidden"
        >
          
          {/* Accent Notched Corner Details */}
          <div className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-bl-[4px]" />
          <div className="absolute top-[3px] right-[3px] w-1.5 h-1.5 rounded-full bg-white" />

          <AnimatePresence mode="wait">
            {/* VIEW: Login Form */}
            {authView === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Sign In</h2>
                  <p className="text-xs text-steel">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-semibold text-accent hover:underline">
                      Register employee account
                    </Link>
                  </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <FormField
                    label="Email Address"
                    id="email"
                    type="email"
                    required
                    placeholder="yourname@assetflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase tracking-wider text-steel">Password</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setAuthView('forgot');
                        }}
                        className="text-xs font-semibold text-accent hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <FormField
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={loading}
                    className="w-full mt-2 font-semibold uppercase tracking-wider"
                  >
                    Authenticate
                  </Button>
                </form>
              </motion.div>
            )}

            {/* VIEW: Forgot Password Email */}
            {authView === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => setAuthView('login')}
                    className="text-xs font-bold text-accent hover:underline mb-1 text-left bg-transparent border-none cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                  <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Reset Password</h2>
                  <p className="text-xs text-steel">
                    Provide your email to receive a password reset OTP verification code.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <FormField
                    label="Registered Email"
                    id="reset-email"
                    type="email"
                    required
                    placeholder="name@assetflow.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />

                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={loading}
                    className="w-full mt-2 font-semibold uppercase tracking-wider"
                  >
                    Send OTP Code
                  </Button>
                </form>
              </motion.div>
            )}

            {/* VIEW: Verify Reset OTP */}
            {authView === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => setAuthView('forgot')}
                    className="text-xs font-bold text-accent hover:underline mb-1 text-left bg-transparent border-none cursor-pointer"
                  >
                    ← Back
                  </button>
                  <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Verify Code</h2>
                  <p className="text-xs text-steel">
                    Enter the 6-digit OTP verification code sent to <span className="font-semibold text-ink">{resetEmail}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyResetOtp} className="flex flex-col gap-4">
                  <FormField
                    label="OTP Code"
                    id="reset-otp"
                    type="text"
                    maxLength="6"
                    required
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-center font-mono text-lg tracking-[0.5em] pr-0"
                  />

                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={loading}
                    className="w-full mt-2 font-semibold uppercase tracking-wider"
                  >
                    Verify Code
                  </Button>
                </form>
              </motion.div>
            )}

            {/* VIEW: Set New Password */}
            {authView === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">New Password</h2>
                  <p className="text-xs text-steel">
                    Create a secure, new password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <FormField
                    label="New Password"
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={loading}
                    className="w-full mt-2 font-semibold uppercase tracking-wider"
                  >
                    Update Password
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>

    </div>
  );
}
