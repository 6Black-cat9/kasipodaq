import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '../utils/http.js';

export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return next(
        new HttpError(
          400,
          'Енгізілген мәліметтерді тексеріңіз',
          parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
    req.body = parsed.data;
    next();
  };
