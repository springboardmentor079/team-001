import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { db } from '../../shared/db';
import { HttpError } from '../../shared/http';
import { rolePermissions } from '../../shared/permissions';
export type Identity = User & {
  organization: { name: string; currency: string; timezone: string };
};
declare module 'express-serve-static-core' {
  interface Request {
    identity?: Identity;
    sessionId?: string;
  }
}
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const bearer = req.headers.authorization;
  if (!bearer?.startsWith('Bearer ')) throw new HttpError(401, 'Please sign in to continue.');
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(bearer.slice(7), env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'buildtrack-api',
      audience: 'buildtrack-web',
    });
    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.sid !== 'string'
    )
      throw new Error();
    payload = decoded;
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in.');
  }
  const session = await db.authSession.findUnique({
    where: { id: String(payload.sid) },
    include: { user: { include: { organization: true } } },
  });
  if (
    !session ||
    session.userId !== payload.sub ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.active
  )
    throw new HttpError(401, 'Your session has ended. Please sign in.');
  req.identity = session.user;
  req.sessionId = session.id;
  if (
    session.user.mustChangePassword &&
    req.originalUrl !== '/api/v1/auth/me' &&
    req.originalUrl !== '/api/v1/auth/change-password'
  )
    throw new HttpError(403, 'Change your temporary password before using the workspace.');
  next();
}
export const requirePermission =
  (permission: string) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.identity || !rolePermissions[req.identity.role].includes(permission))
      throw new HttpError(403, 'You do not have permission to perform this action.');
    next();
  };
export function cookieOrigin(req: Request, _res: Response, next: NextFunction) {
  if (req.get('origin') !== env.APP_ORIGIN || req.get('x-buildtrack-client') !== 'web')
    throw new HttpError(403, 'Invalid request origin.');
  next();
}
