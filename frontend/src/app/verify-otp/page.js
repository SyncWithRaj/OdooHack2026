'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { KeyRound, Loader2, ArrowLeft, Mail, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [flow, setFlow] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
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
      
      localStorage.removeItem('auth_email');
      localStorage.removeItem('auth_flow');
      
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

  if (!email) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider text-steel font-mono">Verifying session...</span>
        </div>
      </div>
    );
  }

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
          <div className="w-6 h-6 bg-accent rounded-[6px] flex items-center justify-center font-bold text-accent-ink shadow-md shrink-0">
            <svg className="w-4.5 h-4.5 text-accent-ink stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-base font-black tracking-wider text-white font-display uppercase">
            ASSET<span className="text-accent font-light">FLOW</span>
          </span>
        </motion.div>

        {/* Feature Mock Stamp Display */}
        <div className="my-auto flex flex-col gap-8 relative z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-start gap-4 cursor-default"
          >
            <div className="p-3 bg-white/5 border border-hairline/10 rounded">
              <Mail className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h4 className="text-base font-bold font-display uppercase tracking-wider text-white">2-Factor Authentication</h4>
              <p className="text-sm text-steel mt-1">
                Secure your hardware operations with auto-expiring one-time verification tokens sent directly to your corporate inbox.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Metadata Stamp */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
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

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <button 
                onClick={() => {
                  localStorage.removeItem('auth_email');
                  localStorage.removeItem('auth_flow');
                  router.push('/login');
                }}
                className="text-xs font-bold text-accent hover:underline mb-2 text-left bg-transparent border-none cursor-pointer flex items-center gap-1 font-mono uppercase tracking-wider focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>
              <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Verify Email</h2>
              <p className="text-xs text-steel leading-relaxed">
                We sent a 6-digit OTP authentication code to <span className="font-semibold text-ink font-mono">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-steel font-mono">
                  Verification Code
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-steel/50">
                    <KeyRound className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength="6"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="block w-full pl-11 pr-3 py-3 border border-hairline rounded-md bg-white text-ink text-center text-xl tracking-[0.6em] font-mono focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent placeholder-steel/20"
                    placeholder="000000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-md text-xs font-bold uppercase tracking-widest text-accent-ink bg-accent hover:bg-accent/90 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-accent-ink" /> : 'Confirm Authentication'}
              </button>
            </form>

            <div className="text-center border-t border-hairline pt-4 mt-2">
              <p className="text-xs text-steel">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResend}
                  className="font-bold text-accent hover:underline bg-transparent border-none cursor-pointer uppercase tracking-wider text-[10px]"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
