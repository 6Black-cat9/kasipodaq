import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: unknown[] = [],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const asyncHandler =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export function success(res: Response, data: unknown, message = 'Сәтті орындалды', status = 200) {
  return res.status(status).json({ success: true, message, data });
}
