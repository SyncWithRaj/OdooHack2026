import catchAsync from '../../utils/catchAsync.js';
import * as authService from './auth.service.js';

/**
 * POST /api/v1/auth/signup — Public
 * Creates unverified account + sends 6-digit OTP. NO token returned.
 * Frontend should redirect to OTP verification page.
 */
export const signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.signup({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'OTP sent to your email. Please verify to complete signup.',
    data: { email: result.email },
  });
});

/**
 * POST /api/v1/auth/verify-signup-otp — Public
 * Verifies signup OTP → activates account → returns JWT.
 */
export const verifySignupOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const { user, token } = await authService.verifySignupOtp(email, otp);

  res.status(200).json({
    success: true,
    message: 'Email verified. Account activated.',
    data: { user, token },
  });
});

/**
 * POST /api/v1/auth/resend-otp — Public
 * Resends signup verification OTP.
 */
export const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendOtp(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/v1/auth/login — Public
 * Validates credentials + sends login OTP. NO token returned.
 * Frontend should redirect to OTP verification page.
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const result = await authService.login({ email, password }, ipAddress);

  res.status(200).json({
    success: true,
    message: 'Credentials valid. OTP sent to your email.',
    data: { email: result.email, role: result.role },
  });
});

/**
 * POST /api/v1/auth/verify-login-otp — Public
 * Verifies login OTP → returns JWT.
 */
export const verifyLoginOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const { user, token } = await authService.verifyLoginOtp(email, otp, ipAddress);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: { user, token },
  });
});

/**
 * GET /api/v1/auth/me — Protected
 */
export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * POST /api/v1/auth/forgot-password — Public
 */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/v1/auth/verify-reset-otp — Public
 */
export const verifyResetOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyResetOtp(email, otp);

  res.status(200).json({
    success: true,
    message: result.message,
    data: { verified: result.verified },
  });
});

/**
 * POST /api/v1/auth/reset-password — Public
 */
export const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, password } = req.body;
  const result = await authService.resetPassword(email, otp, password);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
