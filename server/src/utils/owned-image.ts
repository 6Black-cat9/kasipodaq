import { HttpError } from './http.js';

export function assertOwnedImage(url: unknown, actorId: string) {
  if (url === undefined || url === null) return;
  if (
    typeof url !== 'string' ||
    !url.startsWith(`/api/uploads/${actorId}_`) ||
    !/\.(?:jpg|jpeg|png)$/i.test(url)
  )
    throw new HttpError(400, 'Алдымен суретті өз аккаунтыңызбен жүктеңіз');
}
