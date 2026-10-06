import { createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { Prisma, User } from '@prisma/client';
import { db } from '../../shared/db';
import { env } from '../../config/env';
import { HttpError } from '../../shared/http';
import { rolePermissions } from '../../shared/permissions';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
const minutes = (n: number) => new Date(Date.now() + n * 60000);
export const publicUser = (
  u: User & { organization: { name: string; currency: string; timezone: string } },
) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  organizationId: u.organizationId,
  organization: u.organization,
  permissions: rolePermissions[u.role],
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt,
});
export function audit(
  user: Pick<User, 'id' | 'organizationId'>,
  action: string,
): Prisma.AuditLogUncheckedCreateInput {
  return {
    organizationId: user.organizationId,
    actorId: user.id,
    action,
    entity: 'User',
    entityId: user.id,
  };
}
export function accessToken(userId: string, sessionId: string) {
  return jwt.sign({ sid: sessionId }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: '15m',
    algorithm: 'HS256',
    issuer: 'buildtrack-api',
    audience: 'buildtrack-web',
  });
}
export async function createSession(user: User, remember: boolean) {
  const raw = newToken();
  const session = await db.authSession.create({
    data: {
      userId: user.id,
      refreshHash: hashToken(raw),
      expiresAt: minutes(remember ? 10080 : 720),
    },
  });
  return { raw, session, accessToken: accessToken(user.id, session.id) };
}
export async function login(email: string, password: string, remember: boolean) {
  const user = await db.user.findUnique({ where: { email }, include: { organization: true } });
  // Use the same cost even when the account does not exist.
  const valid = await bcrypt.compare(
    password,
    user?.passwordHash ?? '$2b$12$eXv4mRnqSVBIWvlztbn5eegPWofRoRoGEApHl/7JRv.nFfydKsVR.',
  );
  if (!valid || !user || !user.active) throw new HttpError(401, 'Email or password is incorrect.');
  const session = await createSession(user, remember);
  const updated = await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    include: { organization: true },
  });
  await db.auditLog.create({ data: audit(user, 'LOGIN') });
  return { ...session, user: publicUser(updated) };
}
export async function register(data: {
  name: string;
  email: string;
  phone?: string;
  company: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return db.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: data.company } });
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        organizationId: org.id,
        role: 'CLIENT',
      },
      include: { organization: true },
    });
    await tx.auditLog.create({ data: audit(user, 'REGISTER') });
    return publicUser(user);
  });
}
export async function refresh(raw: string) {
  const session = await db.authSession.findUnique({
    where: { refreshHash: hashToken(raw) },
    include: { user: { include: { organization: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active)
    throw new HttpError(401, 'Your session has expired. Please sign in.');
  const next = newToken();
  const update = await db.authSession.updateMany({
    where: {
      id: session.id,
      refreshHash: hashToken(raw),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { refreshHash: hashToken(next) },
  });
  if (update.count !== 1) throw new HttpError(401, 'This session has already been refreshed.');
  return {
    raw: next,
    session,
    user: publicUser(session.user),
    accessToken: accessToken(session.userId, session.id),
  };
}
export async function requestReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.active) return;
  const raw = newToken();
  const token = await db.$transaction(async (tx) => {
    await tx.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return tx.passwordReset.create({
      data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: minutes(30) },
    });
  });
  const link = `${env.APP_ORIGIN}/reset-password?token=${raw}`;
  const text = `Hello ${user.name},\n\nReset your BuildTrack password:\n${link}\n\nThis one-time link expires in 30 minutes. If you did not request this, you can ignore this email.`;
  try {
    if (env.MAIL_PROVIDER === 'local') {
      const dir = path.resolve('.local/mail');
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `${token.id}.json`),
        JSON.stringify({ to: email, subject: 'Reset your BuildTrack password', text }, null, 2),
        { mode: 0o600 },
      );
    } else {
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        requireTLS: true,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      });
      await transport.sendMail({
        from: env.MAIL_FROM,
        to: email,
        subject: 'Reset your BuildTrack password',
        text,
      });
    }
  } catch {
    await db.passwordReset.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    console.error('Password-reset delivery failed; check mail configuration.');
  }
}
export async function resetPassword(token: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction(async (tx) => {
    const record = await tx.passwordReset.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date() || !record.user.active)
      throw new HttpError(400, 'This reset link is invalid or expired. Request a new one.');
    const consumed = await tx.passwordReset.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) throw new HttpError(400, 'This reset link has already been used.');
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.authSession.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.auditLog.create({ data: audit(record.user, 'PASSWORD_RESET') });
  });
}
