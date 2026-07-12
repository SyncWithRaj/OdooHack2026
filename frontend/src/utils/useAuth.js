'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        if (window.location.pathname !== '/' && window.location.pathname !== '/style-guide') {
          router.push('/');
        }
        return;
      }
      
      const profile = await api.get('/auth/me');
      setUser(profile);
    } catch (err) {
      console.error('Session verification failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Step 1: Request Login
      const res = await api.post('/auth/login', { email, password });
      return res; // Indicates OTP needs to be verified
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const verifyLoginOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-login-otp', { email, otp });
      localStorage.setItem('token', res.token);
      setUser(res.user);
      router.push('/dashboard');
      return res;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      return res; // OTP verification required
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const verifySignupOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-signup-otp', { email, otp });
      localStorage.setItem('token', res.token);
      setUser(res.user);
      router.push('/dashboard');
      return res;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  return {
    user,
    loading,
    login,
    verifyLoginOtp,
    signup,
    verifySignupOtp,
    logout,
    refreshProfile: fetchProfile,
  };
}
