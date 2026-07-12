import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../utils/prisma.js';
import config from '../../config/index.js';
import AppError from '../../utils/AppError.js';
import { sendOtpEmail, sendPasswordResetOtpEmail } from '../../utils/email.js';

// ============================================================================
// HELPERS
// ============================================================================

const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ============================================================================
// SIGNUP — Step 1: Create unverified account + send OTP (NO token returned)
// ============================================================================

export const signup = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  // If user exists but NOT verified, allow re-signup (resend OTP)
  if (existingUser && existingUser.isEmailVerified) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  let user;

  if (existingUser && !existingUser.isEmailVerified) {
    // Update existing unverified user (re-signup case)
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        emailOtp: otp,
        emailOtpExpires: otpExpires,
      },
      select: { id: true, name: true, email: true, role: true, isEmailVerified: true },
    });
  } else {
    // Create new user — unverified, employee role enforced
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'employee',
        isEmailVerified: false,
        emailOtp: otp,
        emailOtpExpires: otpExpires,
      },
      select: { id: true, name: true, email: true, role: true, isEmailVerified: true },
    });
  }

  // Send OTP email
  sendOtpEmail(user, otp).catch((err) => {
    console.error('Failed to send OTP email:', err.message);
  });

  // NO token returned — user must verify OTP first
  return { email: user.email };
};

// ============================================================================
// VERIFY SIGNUP OTP — Step 2: Verify OTP → activate account → return JWT
// ============================================================================

export const verifySignupOtp = async (email, otp) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError('No account found with this email.', 404);
  if (user.isEmailVerified) throw new AppError('Email is already verified.', 400);
  if (!user.emailOtp || !user.emailOtpExpires) {
    throw new AppError('No OTP was generated. Please sign up again.', 400);
  }
  if (new Date() > user.emailOtpExpires) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }
  if (user.emailOtp !== otp) {
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  // Activate account
  const verified = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailOtp: null,
      emailOtpExpires: null,
    },
    select: {
      id: true, name: true, email: true, role: true,
      departmentId: true, status: true, isEmailVerified: true,
    },
  });

  // NOW issue JWT
  const token = signToken(verified.id);

  return { user: verified, token };
};

// ============================================================================
// RESEND OTP — For unverified signup
// ============================================================================

export const resendOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('No account found with this email.', 404);
  if (user.isEmailVerified) throw new AppError('Email is already verified.', 400);

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailOtp: otp, emailOtpExpires: otpExpires },
  });

  await sendOtpEmail(user, otp);

  return { message: 'A new OTP has been sent to your email.' };
};

// ============================================================================
// LOGIN — Step 1: Validate credentials + send OTP (NO token returned)
// ============================================================================

export const login = async ({ email, password }, ipAddress) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, name: true, email: true, passwordHash: true,
      role: true, departmentId: true, status: true, isEmailVerified: true,
    },
  });

  if (!user) {
    await prisma.activityLog.create({
      data: { action: 'LOGIN_FAILED', entityType: 'user', details: { email, reason: 'User not found' }, ipAddress },
    }).catch(() => {});
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status === 'inactive') {
    throw new AppError('Your account has been deactivated. Contact an administrator.', 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Email not verified. Please complete signup verification first.', 403);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) {
    await prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN_FAILED', entityType: 'user', entityId: user.id, details: { reason: 'Incorrect password' }, ipAddress },
    }).catch(() => {});
    throw new AppError('Invalid email or password.', 401);
  }

  // Credentials valid — send login OTP
  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailOtp: otp, emailOtpExpires: otpExpires },
  });

  sendOtpEmail(user, otp).catch(() => {});

  // NO token returned — user must verify login OTP first
  return { email: user.email, role: user.role };
};

// ============================================================================
// VERIFY LOGIN OTP — Step 2: Verify OTP → return JWT
// ============================================================================

export const verifyLoginOtp = async (email, otp, ipAddress) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, name: true, email: true,
      role: true, departmentId: true, status: true,
      isEmailVerified: true, emailOtp: true, emailOtpExpires: true,
    },
  });

  if (!user) throw new AppError('No account found with this email.', 404);
  if (!user.emailOtp || !user.emailOtpExpires) {
    throw new AppError('No login OTP was generated. Please log in again.', 400);
  }
  if (new Date() > user.emailOtpExpires) {
    throw new AppError('OTP has expired. Please log in again.', 400);
  }
  if (user.emailOtp !== otp) {
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  // Clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: { emailOtp: null, emailOtpExpires: null },
  });

  // Audit log: successful login
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'LOGIN_SUCCESS', entityType: 'user', entityId: user.id, details: { role: user.role }, ipAddress },
  }).catch(() => {});

  // NOW issue JWT
  const token = signToken(user.id);

  const { emailOtp, emailOtpExpires, ...safeUser } = user;
  return { user: safeUser, token };
};

// ============================================================================
// FORGOT PASSWORD — Sends 6-digit OTP
// ============================================================================

export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: 'If an account with that email exists, a password reset OTP has been sent.' };
  }

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetOtp: otp, passwordResetExpires: otpExpires },
  });

  await sendPasswordResetOtpEmail(user, otp);

  return { message: 'If an account with that email exists, a password reset OTP has been sent.' };
};

// ============================================================================
// VERIFY RESET OTP
// ============================================================================

export const verifyResetOtp = async (email, otp) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError('No account found with this email.', 404);
  if (!user.passwordResetOtp || !user.passwordResetExpires) {
    throw new AppError('No password reset OTP was generated.', 400);
  }
  if (new Date() > user.passwordResetExpires) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }
  if (user.passwordResetOtp !== otp) {
    throw new AppError('Invalid OTP.', 400);
  }

  return { message: 'OTP verified. You can now set a new password.', verified: true };
};

// ============================================================================
// RESET PASSWORD — Requires email + OTP + new password
// ============================================================================

export const resetPassword = async (email, otp, newPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError('No account found with this email.', 404);
  if (!user.passwordResetOtp || !user.passwordResetExpires) {
    throw new AppError('No password reset OTP was generated.', 400);
  }
  if (new Date() > user.passwordResetExpires) {
    throw new AppError('OTP has expired.', 400);
  }
  if (user.passwordResetOtp !== otp) {
    throw new AppError('Invalid OTP.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetOtp: null, passwordResetExpires: null },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'PASSWORD_RESET', entityType: 'user', entityId: user.id },
  }).catch(() => {});

  return { message: 'Password has been reset successfully.' };
};

// ============================================================================
// GET ME
// ============================================================================

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true,
      departmentId: true, status: true, isEmailVerified: true,
      createdAt: true, updatedAt: true,
      department: { select: { id: true, name: true, code: true } },
    },
  });

  if (!user) throw new AppError('User not found.', 404);
  return user;
};
