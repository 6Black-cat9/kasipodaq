import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { authRouter } from './routes/auth.js';
import { membersRouter } from './routes/members.js';
import { applicationsRouter } from './routes/applications.js';
import {
  assetsRouter,
  documentsRouter,
  eventsRouter,
  newsRouter,
  notificationsRouter,
  publicRouter,
  settingsRouter,
  statisticsRouter,
  uploadsRouter,
  usersRouter,
} from './routes/content.js';
import { HttpError } from './utils/http.js';
import { allowedOrigins } from './middleware/auth.js';
import { prisma } from './utils/prisma.js';
import { openApiSpec } from './openapi.js';
import type { ErrorRequestHandler } from 'express';

export const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      },
    },
  }),
);
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins().includes(origin)) callback(null, true);
      else callback(new HttpError(403, 'Сұрау көзіне рұқсат берілмеген'));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (_req, res) =>
      res
        .status(429)
        .json({
          success: false,
          message: 'Сұрау тым көп. Бір минуттан кейін қайталаңыз',
          errors: [],
        }),
  }),
);
app.use('/api', (req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin &&
    !allowedOrigins().includes(req.headers.origin)
  )
    return next(new HttpError(403, 'Сұрау көзіне рұқсат берілмеген'));
  next();
});
app.get('/api/health', (_req, res, next) => {
  prisma.$queryRaw`SELECT 1`
    .then(() =>
      res.json({ success: true, message: 'Жүйе жұмыс істеп тұр', data: { status: 'ok' } }),
    )
    .catch(next);
});
app.use('/api/auth', authRouter);
app.use('/api/members', membersRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/news', newsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/public', publicRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/assets', assetsRouter);
app.get('/api/openapi.json', (_req, res) => res.json(openApiSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'API мекенжайы табылмады')));
const clientDirectory = fileURLToPath(new URL('../../client/dist/', import.meta.url));
if (existsSync(path.join(clientDirectory, 'index.html'))) {
  app.use(express.static(clientDirectory, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDirectory, 'index.html')));
}
app.use((_req, _res, next) => next(new HttpError(404, 'Бет табылмады')));
const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (res.headersSent) return _next(error);
  let status = 500;
  let message = 'Серверде қате орын алды. Қайта көріңіз';
  let errors: unknown[] = [];
  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof multer.MulterError) {
    status = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Файл көлемі 10 МБ-тан аспасын'
        : 'Файл жүктеу параметрлері дұрыс емес';
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      status = 409;
      message = 'Бұл мәнмен жазба бар. Бірегей мән енгізіңіз';
    } else if (error.code === 'P2025') {
      status = 404;
      message = 'Жазба табылмады';
    } else if (error.code === 'P2003') {
      status = 409;
      message = 'Бұл жазба басқа деректермен байланысты. Оны белсенді емес күйге ауыстырыңыз';
    } else if (error.code === 'P2034') {
      status = 409;
      message = 'Жазба бір уақытта өзгертілді. Қайта көріңіз';
    }
  } else if (error instanceof SyntaxError && 'body' in error) {
    status = 400;
    message = 'JSON деректері дұрыс емес';
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    status = 413;
    message = 'Сұрау көлемі тым үлкен';
  }
  if (status === 500)
    console.error('API error:', error instanceof Error ? error.name : 'UnknownError');
  res.status(status).json({ success: false, message, errors });
};
app.use(errorHandler);
export default app;
