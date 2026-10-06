import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function ok(res: Response, data: unknown, message = 'Success', status = 200, meta?: object) {
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}
export function errors(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const requestId = randomUUID();
  if (error instanceof Error && 'code' in error && error.code === 'LIMIT_FILE_SIZE')
    return res
      .status(413)
      .json({ success: false, message: 'File exceeds the 10 MB limit.', errors: [] });
  if (error instanceof Error && 'code' in error && error.code === 'LIMIT_UNEXPECTED_FILE')
    return res
      .status(422)
      .json({ success: false, message: 'Only one document file is allowed.', errors: [] });
  if (error instanceof Error && 'type' in error && error.type === 'entity.too.large')
    return res
      .status(413)
      .json({ success: false, message: 'Request body is too large.', errors: [] });
  if (error instanceof ZodError)
    return res.status(422).json({
      success: false,
      message: 'Please check the highlighted fields.',
      errors: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    return res
      .status(409)
      .json({ success: false, message: 'A record with these details already exists.', errors: [] });
  if (error instanceof HttpError)
    return res.status(error.status).json({ success: false, message: error.message, errors: [] });
  if (error instanceof SyntaxError && 'body' in error)
    return res.status(400).json({ success: false, message: 'Invalid JSON request.', errors: [] });
  console.error(
    JSON.stringify({ requestId, type: error instanceof Error ? error.name : 'UnknownError' }),
  );
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    errors: [],
    requestId,
  });
}
