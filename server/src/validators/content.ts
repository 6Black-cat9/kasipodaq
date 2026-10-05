import { z } from 'zod';

const text = (min: number, max: number) =>
  z.string().trim().min(min, `Кемінде ${min} таңба енгізіңіз`).max(max, `Ең көбі ${max} таңба`);
const image = z
  .string()
  .regex(
    /^\/api\/(?:assets|uploads)\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png)$/i,
    'Жүктелген суретті таңдаңыз',
  )
  .nullable()
  .optional();
const isoDate = z.string().datetime({ offset: true });

export const newsSchema = z
  .object({
    title: text(3, 200),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(220)
      .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Slug әріптер, сандар мен дефистен тұруы керек')
      .optional(),
    shortDescription: text(10, 600),
    content: text(20, 50_000),
    image,
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    publishedAt: isoDate.nullable().optional(),
    notify: z.boolean().default(false),
  })
  .strict();

export const documentSchema = z
  .object({
    title: text(3, 200),
    description: text(0, 2000),
    category: z.enum([
      'RULES',
      'RESOLUTIONS',
      'PROTOCOLS',
      'ORDERS',
      'REPORTS',
      'REGULATIONS',
      'OTHER',
    ]),
  })
  .strict();

export const eventSchema = z
  .object({
    title: text(3, 200),
    description: text(10, 20_000),
    date: z
      .string()
      .refine(
        (value) => /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && !Number.isNaN(Date.parse(value)),
        'Күнді дұрыс енгізіңіз',
      ),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    location: text(2, 300),
    image,
    organizer: text(2, 200),
    status: z.enum(['UPCOMING', 'PAST', 'CANCELLED']).default('UPCOMING'),
  })
  .strict()
  .refine((value) => value.endTime > value.startTime, {
    message: 'Аяқталу уақыты басталу уақытынан кейін болуы керек',
    path: ['endTime'],
  });

export const userUpdateSchema = z
  .object({
    role: z.enum(['ADMIN', 'CHAIRMAN', 'MEMBER']).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Өзгеріс енгізіңіз');

export const settingsSchema = z
  .object({
    organizationName: text(2, 150),
    schoolName: text(2, 200),
    description: text(10, 2000),
    email: z.string().trim().email().max(254),
    phone: text(5, 40),
    address: text(5, 400),
  })
  .strict();
