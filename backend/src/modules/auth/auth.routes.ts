import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, cookieOrigin } from './auth.middleware';
import * as schema from './auth.schema';
import * as service from './auth.service';

export const authRouter = Router();
const cookie = 'bt_refresh';
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
};
function setCookie(res: Response, raw: string, expires: Date) {
  res.cookie(cookie, raw, { ...cookieOptions, expires });
}
authRouter.post('/register', async (req, res) =>
  ok(
    res,
    await service.register(schema.registerSchema.parse(req.body)),
    'Account created. You can now sign in.',
    201,
  ),
);
authRouter.post('/login', async (req, res) => {
  const data = schema.loginSchema.parse(req.body);
  const result = await service.login(data.email, data.password, data.remember);
  setCookie(res, result.raw, result.session.expiresAt);
  return ok(res, { accessToken: result.accessToken, user: result.user }, 'Welcome back.');
});
authRouter.post('/refresh', cookieOrigin, async (req, res) => {
  const raw: unknown = req.cookies[cookie];
  if (typeof raw !== 'string') throw new HttpError(401, 'Please sign in.');
  const result = await service.refresh(raw);
  setCookie(res, result.raw, result.session.expiresAt);
  return ok(res, { accessToken: result.accessToken, user: result.user });
});
authRouter.post('/logout', cookieOrigin, async (req, res) => {
  const raw: unknown = req.cookies[cookie];
  if (typeof raw === 'string') {
    const session = await db.authSession.findUnique({
      where: { refreshHash: service.hashToken(raw) },
      include: { user: true },
    });
    if (session && !session.revokedAt)
      await db.$transaction([
        db.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
        db.auditLog.create({ data: service.audit(session.user, 'LOGOUT') }),
      ]);
  }
  res.clearCookie(cookie, cookieOptions);
  return ok(res, null, 'You have signed out.');
});
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = schema.forgotSchema.parse(req.body);
  await service.requestReset(email);
  return ok(
    res,
    null,
    'If an active account exists, password-reset instructions will be delivered.',
    202,
  );
});
authRouter.post('/reset-password', async (req, res) => {
  const data = schema.resetSchema.parse(req.body);
  await service.resetPassword(data.token, data.password);
  res.clearCookie(cookie, cookieOptions);
  return ok(res, null, 'Password updated. Sign in with your new password.');
});
authRouter.get('/me', authenticate, (req, res) => ok(res, service.publicUser(req.identity!)));
authRouter.patch('/me', authenticate, async (req, res) => {
  const data = schema.profileSchema.parse(req.body);
  const user = req.identity!;
  const updated = await db.$transaction(async (tx) => {
    const value = await tx.user.update({
      where: { id: user.id },
      data,
      include: { organization: true },
    });
    await tx.auditLog.create({ data: service.audit(user, 'PROFILE_UPDATED') });
    return value;
  });
  return ok(res, service.publicUser(updated), 'Profile saved.');
});
authRouter.post('/change-password', authenticate, async (req, res) => {
  const data = schema.changePasswordSchema.parse(req.body);
  const user = req.identity!;
  if (!(await bcrypt.compare(data.currentPassword, user.passwordHash)))
    throw new HttpError(400, 'Current password is incorrect.');
  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } }),
    db.authSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    db.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.auditLog.create({ data: service.audit(user, 'PASSWORD_CHANGED') }),
  ]);
  res.clearCookie(cookie, cookieOptions);
  return ok(res, null, 'Password updated. Please sign in again.');
});
