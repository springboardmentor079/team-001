import { z } from 'zod';
const name = z.string().trim().min(2).max(150);
const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const password = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(72)
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[0-9]/, 'Include a number.')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 bytes.');
const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d ()-]*$/, 'Enter a valid phone number.')
  .optional();
export const registerSchema = z
  .object({ name, email, phone, company: z.string().trim().min(2).max(160), password })
  .strict();
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(128), remember: z.boolean().default(false) })
  .strict();
export const forgotSchema = z.object({ email }).strict();
export const resetSchema = z
  .object({ token: z.string().regex(/^[a-f0-9]{64}$/), password })
  .strict();
export const profileSchema = z.object({ name, phone }).strict();
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), password })
  .strict();
