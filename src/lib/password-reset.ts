import { createHmac, randomInt, timingSafeEqual } from 'crypto';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

function secret() {
  const value = process.env.PASSWORD_RESET_OTP_SECRET;
  if (!value) throw new Error('PASSWORD_RESET_OTP_SECRET no está configurado');
  return value;
}

export function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

export function validPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 12 && password.length <= 128;
}

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0');
}

export function digestOtp(challengeId: string, code: string) {
  return createHmac('sha256', secret()).update(`${challengeId}:${code}`).digest('hex');
}

export function sameDigest(expected: string, actual: string) {
  return expected.length === actual.length && timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
