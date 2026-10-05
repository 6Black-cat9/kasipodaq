import { z } from 'zod';
import { ApplicationStatus, ApplicationType, MemberStatus, Role } from '@prisma/client';

const text = (min = 1, max = 200) =>
  z.string().trim().min(min, `Кемінде ${min} таңба енгізіңіз`).max(max, `Ең көбі ${max} таңба`);
const email = z.string().trim().toLowerCase().email('Email мекенжайы дұрыс емес').max(254);
export const passwordValidator = z
  .string()
  .min(8, 'Пароль кемінде 8 таңба болсын')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Пароль UTF-8 форматында 72 байттан аспасын',
  );
const password = passwordValidator;
const loginPassword = z
  .string()
  .min(1)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Пароль тым ұзын');
const date = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Күн дұрыс емес')
  .transform((value) => new Date(value));
const memberFields = {
  firstName: text(1, 80),
  lastName: text(1, 80),
  middleName: text(0, 80).nullable().optional(),
  phone: text(5, 30),
  position: text(1, 120),
  department: text(1, 120),
  joinDate: date.optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  avatar: z
    .string()
    .max(500)
    .regex(/^\/api\/uploads\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png)$/i, 'Фото мекенжайы дұрыс емес')
    .nullable()
    .optional(),
};
export const loginSchema = z.object({ email, password: loginPassword }).strict();
export const memberCreateSchema = z
  .object({ email, password, role: z.nativeEnum(Role).default(Role.MEMBER), ...memberFields })
  .strict();
export const memberUpdateSchema = z
  .object({
    email: email.optional(),
    password: password.optional(),
    role: z.nativeEnum(Role).optional(),
    isActive: z.boolean().optional(),
    ...memberFields,
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Өзгерістер енгізіңіз');
export const profileSchema = z
  .object({
    firstName: memberFields.firstName.optional(),
    lastName: memberFields.lastName.optional(),
    middleName: memberFields.middleName,
    phone: memberFields.phone.optional(),
    avatar: memberFields.avatar,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Өзгерістер енгізіңіз');
export const passwordSchema = z
  .object({ currentPassword: loginPassword, newPassword: password })
  .strict();
const amount = z
  .preprocess(
    (value) =>
      value === '' || value === null || value === undefined
        ? null
        : typeof value === 'string'
          ? Number(value)
          : value,
    z.number().positive('Сома нөлден үлкен болсын').max(9999999999.99, 'Сома тым үлкен').nullable(),
  )
  .optional();
const applicationFields = {
  type: z.nativeEnum(ApplicationType),
  title: text(3, 200),
  description: text(10, 20000),
  amount,
};
export const applicationCreateSchema = z
  .object(applicationFields)
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.type === ApplicationType.MATERIAL &&
      (value.amount === undefined || value.amount === null)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: 'Материалдық көмек сомасын енгізіңіз',
      });
  });
export const applicationUpdateSchema = z
  .object(applicationFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Өзгерістер енгізіңіз');
export const commentSchema = z.object({ text: text(1, 5000) }).strict();
export const statusSchema = z
  .object({ status: z.nativeEnum(ApplicationStatus), comment: text(1, 5000).optional() })
  .strict();
