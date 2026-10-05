import { formatDate } from '../utils/format';
export interface PageList<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Person {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  status: string;
  avatar?: string | null;
  user?: Account;
}
export interface Account {
  id: string;
  email: string;
  role: 'ADMIN' | 'CHAIRMAN' | 'MEMBER';
  isActive: boolean;
  createdAt: string;
  member?: Person | null;
}
export interface Attachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}
export interface RequestRecord {
  id: string;
  number: number;
  memberId: string;
  member?: Person;
  title: string;
  description: string;
  type: string;
  status: string;
  amount?: string | number | null;
  createdAt: string;
  updatedAt: string;
  comments?: { id: string; text: string; createdAt: string; user?: Account }[];
  history?: {
    id: string;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string;
    user?: Account;
  }[];
  attachments?: Attachment[];
}
export interface NewsRecord {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  image?: string | null;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  author?: Account;
}
export interface DocumentRecord extends Attachment {
  title: string;
  description: string;
  category: string;
  createdAt: string;
}
export interface EventRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  image?: string | null;
  organizer: string;
  status: string;
  participants?: number;
  isParticipating?: boolean;
  _count?: { participants: number };
}
export const applicationTypes: Record<string, string> = {
  MATERIAL: 'Материалдық көмек',
  ONE_TIME: 'Біржолғы көмек',
  SOCIAL: 'Әлеуметтік көмек',
  OTHER: 'Басқа',
};
export const statuses: Record<string, string> = {
  NEW: 'Жаңа',
  IN_REVIEW: 'Қаралуда',
  NEEDS_INFO: 'Қосымша ақпарат қажет',
  APPROVED: 'Мақұлданды',
  REJECTED: 'Қабылданбады',
  COMPLETED: 'Орындалды',
  ACTIVE: 'Белсенді',
  INACTIVE: 'Белсенді емес',
  DRAFT: 'Жоба',
  PUBLISHED: 'Жарияланған',
  UPCOMING: 'Алда',
  PAST: 'Өтті',
  CANCELLED: 'Болдырылмады',
};
export const applicationStatuses = Object.fromEntries(Object.entries(statuses).slice(0, 6));
export const documentCategories: Record<string, string> = {
  RULES: 'Ережелер',
  RESOLUTIONS: 'Қаулылар',
  PROTOCOLS: 'Хаттамалар',
  ORDERS: 'Бұйрықтар',
  REPORTS: 'Есептер',
  REGULATIONS: 'Нормативтік құжаттар',
  OTHER: 'Басқа',
};
export const roles: Record<string, string> = {
  ADMIN: 'Әкімші',
  CHAIRMAN: 'Төраға',
  MEMBER: 'Мүше',
};
export const personName = (p?: Person | null) =>
  p ? `${p.lastName} ${p.firstName}${p.middleName ? ` ${p.middleName}` : ''}` : 'Кәсіподақ мүшесі';
export const dateText = (value?: string | null) => formatDate(value);
export const shortDate = (value: string) =>
  formatDate(value, { day: '2-digit', month: '2-digit', year: 'numeric' });
export const currency = (value?: number | string | null) =>
  value != null
    ? new Intl.NumberFormat('kk-KZ', {
        style: 'currency',
        currency: 'KZT',
        maximumFractionDigits: 0,
      }).format(Number(value))
    : '—';
export const bytes = (value: number) =>
  value < 1024 * 1024 ? `${Math.round(value / 1024)} КБ` : `${(value / 1024 / 1024).toFixed(1)} МБ`;
export const dateInput = (value: string) => value.slice(0, 10);
export const uploadAccept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
export function errorMessage(error: unknown) {
  const item = error as { response?: { data?: { message?: string } }; message?: string };
  return item.response?.data?.message || item.message || 'Сұрауды орындау мүмкін болмады';
}
