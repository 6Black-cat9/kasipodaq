import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../utils/http.js';

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const allowedFormats: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
};

export interface StoredFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface UploadStorage {
  put(filename: string, buffer: Buffer): Promise<void>;
  remove(filename: string): Promise<void>;
  resolve(filename: string): string;
}

export class LocalUploadStorage implements UploadStorage {
  constructor(private readonly directory = path.resolve(process.env.UPLOAD_DIR || 'uploads')) {}

  resolve(filename: string): string {
    if (!isSafeFilename(filename)) throw new HttpError(400, 'Файл атауы жарамсыз');
    return path.join(this.directory, filename);
  }

  async put(filename: string, buffer: Buffer): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await writeFile(this.resolve(filename), buffer, { flag: 'wx', mode: 0o600 });
  }

  async remove(filename: string): Promise<void> {
    try {
      await unlink(this.resolve(filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

export const storage: UploadStorage = new LocalUploadStorage();

export function isSafeFilename(filename: string): boolean {
  return /^[a-zA-Z0-9_-]+\.(?:pdf|doc|docx|xls|xlsx|jpg|jpeg|png)$/i.test(filename);
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1, fields: 24, fieldSize: 100_000 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedFormats[extension]?.includes(file.mimetype)) {
      callback(new HttpError(400, 'PDF, DOC, DOCX, XLS, XLSX, JPG немесе PNG файлын таңдаңыз'));
      return;
    }
    callback(null, true);
  },
});

async function validateFile(file: Express.Multer.File, imagesOnly: boolean): Promise<string> {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedMimes = allowedFormats[extension];
  if (!allowedMimes?.includes(file.mimetype) || file.size === 0 || file.size > MAX_UPLOAD_SIZE) {
    throw new HttpError(400, 'Файл пішімі немесе көлемі жарамсыз (ең көбі 10 МБ)');
  }
  if (imagesOnly && !['.jpg', '.jpeg', '.png'].includes(extension)) {
    throw new HttpError(400, 'Тек JPG және PNG суреттерін жүктеуге болады');
  }
  let detected;
  try {
    detected = await fileTypeFromBuffer(file.buffer);
  } catch {
    throw new HttpError(400, 'Файлдың мазмұны зақымдалған немесе пішімі жарамсыз');
  }
  let valid = false;
  if (extension === '.doc' || extension === '.xls') {
    const oleSignature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const streams = extension === '.doc' ? ['WordDocument'] : ['Workbook', 'Book'];
    valid =
      file.buffer.subarray(0, 8).equals(oleSignature) &&
      streams.some((name) => file.buffer.includes(Buffer.from(name, 'utf16le')));
  } else if (extension === '.docx' || extension === '.xlsx') {
    valid =
      detected?.ext === extension.slice(1) && !file.buffer.includes(Buffer.from('vbaProject.bin'));
  } else {
    valid = detected !== undefined && allowedMimes.includes(detected.mime);
  }
  if (!valid) throw new HttpError(400, 'Файлдың мазмұны көрсетілген пішімге сәйкес келмейді');
  return extension;
}

export async function persistUpload(
  file: Express.Multer.File,
  options: { imagesOnly?: boolean; ownerId?: string } = {},
): Promise<StoredFile> {
  const extension = await validateFile(file, options.imagesOnly ?? false);
  const ownerPrefix =
    options.ownerId && /^[a-zA-Z0-9_-]+$/.test(options.ownerId) ? `${options.ownerId}_` : '';
  const filename = `${ownerPrefix}${randomUUID()}${extension}`;
  await storage.put(filename, file.buffer);
  return {
    fileUrl: `/api/uploads/${filename}`,
    fileName: path
      .basename(file.originalname)
      .split('')
      .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
      .join('')
      .slice(0, 200),
    fileType: file.mimetype,
    fileSize: file.size,
  };
}

export async function cleanupUpload(fileUrl: string): Promise<void> {
  const filename = fileUrl.startsWith('/api/uploads/') ? fileUrl.slice('/api/uploads/'.length) : '';
  if (isSafeFilename(filename)) await storage.remove(filename);
}
