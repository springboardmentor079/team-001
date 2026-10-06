import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(4300),
  HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  JWT_SECRET: z
    .string()
    .min(48)
    .refine((v) => !v.includes('REPLACE_'), 'Set a random JWT secret'),
  APP_ORIGIN: z.url().default('http://localhost:4200'),
  MAIL_PROVIDER: z.enum(['local', 'smtp']).default('local'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('BuildTrack <noreply@buildtrack.local>'),
});
export const env = schema.parse(process.env);
if (
  env.NODE_ENV === 'production' &&
  (env.MAIL_PROVIDER !== 'smtp' || !env.APP_ORIGIN.startsWith('https://'))
) {
  throw new Error('Production requires SMTP and an HTTPS application origin');
}
if (env.MAIL_PROVIDER === 'smtp' && !env.SMTP_HOST) throw new Error('SMTP_HOST is required');
