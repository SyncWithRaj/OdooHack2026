import nodemailer from 'nodemailer';
import config from '../config/index.js';

/**
 * Nodemailer transporter — configured from SMTP env vars.
 * Falls back to console logging if SMTP credentials are not set.
 */
const createTransporter = () => {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('⚠️  SMTP credentials not set. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

const transporter = createTransporter();

/**
 * Send an email. Falls back to console if transporter is not configured.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: config.smtp.from,
    to,
    subject,
    html,
    text,
  };

  if (!transporter) {
    console.log('\n📧 [EMAIL] ─────────────────────────');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${text || '(HTML email)'}`);
    console.log('─────────────────────────────────────\n');
    return { messageId: 'console-stub' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
    return null;
  }
};

// ============================================================================
// OTP EMAIL TEMPLATES
// ============================================================================

/**
 * Email verification OTP — sent on signup.
 */
export const sendOtpEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: `AssetFlow — Your Verification Code: ${otp}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">AssetFlow</h1>
          <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">Email Verification</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${user.name}! 👋</h2>
          <p style="color: #555; line-height: 1.6;">Use the following 6-digit OTP to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #fff; border: 2px dashed #667eea; border-radius: 12px; padding: 20px 40px; display: inline-block;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #333; font-family: 'Courier New', monospace;">${otp}</span>
            </div>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888; font-size: 13px; text-align: center;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `Your AssetFlow verification OTP is: ${otp} (expires in 10 minutes)`,
  });
};

/**
 * Password reset OTP — sent on forgot password.
 */
export const sendPasswordResetOtpEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: `AssetFlow — Password Reset Code: ${otp}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">AssetFlow</h1>
          <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">Password Reset</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.name},</h2>
          <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Use this OTP:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #fff; border: 2px dashed #e74c3c; border-radius: 12px; padding: 20px 40px; display: inline-block;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #333; font-family: 'Courier New', monospace;">${otp}</span>
            </div>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `Your AssetFlow password reset OTP is: ${otp} (expires in 10 minutes)`,
  });
};

/**
 * Generic notification email (asset assigned, maintenance approved, etc.)
 */
export const sendNotificationEmail = async (userEmail, title, message) => {
  await sendEmail({
    to: userEmail,
    subject: `AssetFlow — ${title}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">AssetFlow</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
          <h2 style="color: #333; margin-top: 0;">${title}</h2>
          <p style="color: #555; line-height: 1.6;">${message}</p>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${config.frontendUrl}" style="background: #667eea; color: #fff; padding: 10px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open AssetFlow</a>
          </div>
        </div>
      </div>
    `,
    text: `${title}: ${message}`,
  });
};
