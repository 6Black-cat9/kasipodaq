import type { ParsedQs } from 'qs';
import { HttpError } from './http.js';

export function pagination(query: ParsedQs) {
  const parse = (value: unknown, defaultValue: number, max: number) => {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value))
      throw new HttpError(400, 'Бет параметрлері дұрыс емес');
    const parsed = Number(value);
    if (parsed < 1 || parsed > max) throw new HttpError(400, 'Бет параметрлері дұрыс емес');
    return parsed;
  };
  const page = parse(query.page, 1, 100000);
  const pageSize = parse(query.pageSize, 12, 100);
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : '';
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, q };
}
