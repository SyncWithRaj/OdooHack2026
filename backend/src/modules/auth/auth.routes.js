import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  verifySignupOtp,
  verifyLoginOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  updateProfile,
} from './auth.controller.js';
import {
  signupValidators,
  loginValidators,
  otpValidators,
  emailOnlyValidators,
  resetPasswordValidators,
} from './auth.validators.js';
import validate from '../../middleware/validate.js';
import protect from '../../middleware/auth.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// ── SIGNUP FLOW ──────────────────────────────────────────────

// Step 1: Enter details → sends OTP (no token)
router.post('/signup', signupValidators, validate, signup);

// Step 2: Enter OTP → account activated → JWT returned
router.post('/verify-signup-otp', otpValidators, validate, verifySignupOtp);

// Resend signup OTP
router.post('/resend-otp', emailOnlyValidators, validate, resendOtp);

// ── LOGIN FLOW ───────────────────────────────────────────────

// Step 1: Enter email+password → sends OTP (no token)
router.post('/login', loginValidators, validate, login);

// Step 2: Enter OTP → JWT returned
router.post('/verify-login-otp', otpValidators, validate, verifyLoginOtp);

// ── PROFILE ──────────────────────────────────────────────────

// Get current user (requires JWT from verify-*-otp)
router.get('/me', protect, getMe);

// Update profile (name)
router.patch('/update-profile', protect, updateProfile);

// Change password (requires current password)
router.patch('/change-password', protect, changePassword);

// ── FORGOT PASSWORD FLOW ─────────────────────────────────────

// Step 1: Enter email → sends reset OTP
router.post('/forgot-password', emailOnlyValidators, validate, forgotPassword);

// Step 2: Verify the reset OTP
router.post('/verify-reset-otp', otpValidators, validate, verifyResetOtp);

// Step 3: Enter new password with OTP
router.post('/reset-password', resetPasswordValidators, validate, resetPassword);

export default router;
