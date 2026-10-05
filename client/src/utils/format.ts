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
  PUBLISHED: 'Жарияланды',
  UPCOMING: 'Алда',
  PAST: 'Өтті',
  CANCELLED: 'Болдырылмады',
};
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
  MEMBER: 'Кәсіподақ мүшесі',
};
const kazakhMonths = [
  'қаңтар',
  'ақпан',
  'наурыз',
  'сәуір',
  'мамыр',
  'маусым',
  'шілде',
  'тамыз',
  'қыркүйек',
  'қазан',
  'қараша',
  'желтоқсан',
];
const kazakhShortMonths = [
  'қаң',
  'ақп',
  'нау',
  'сәу',
  'мам',
  'мау',
  'шіл',
  'там',
  'қыр',
  'қаз',
  'қар',
  'жел',
];
export const formatDate = (
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const settings = options || { day: 'numeric', month: 'long', year: 'numeric' };
  const parts: string[] = [];
  if (settings.day) {
    const day = String(date.getDate());
    parts.push(settings.day === '2-digit' ? day.padStart(2, '0') : day);
  }
  if (settings.month) {
    const index = date.getMonth();
    if (settings.month === 'long') parts.push(kazakhMonths[index]);
    else if (settings.month === 'short' || settings.month === 'narrow')
      parts.push(kazakhShortMonths[index]);
    else
      parts.push(
        settings.month === '2-digit' ? String(index + 1).padStart(2, '0') : String(index + 1),
      );
  }
  if (settings.year) {
    const year = String(date.getFullYear());
    parts.push(settings.year === '2-digit' ? year.slice(-2) : year);
  }
  return parts.join(settings.month === 'numeric' || settings.month === '2-digit' ? '.' : ' ');
};
export const formatNumber = (value: number | string) =>
  new Intl.NumberFormat('kk-KZ').format(Number(value));
export const formatMoney = (value: number | string) => `${formatNumber(value)} ₸`;
export const formatFileSize = (value: number) =>
  value < 1024 * 1024
    ? `${Math.round(value / 1024)} КБ`
    : `${(value / (1024 * 1024)).toFixed(1)} МБ`;
export const memberName = (
  member?: { firstName: string; lastName: string; middleName?: string | null } | null,
) =>
  member
    ? `${member.lastName} ${member.firstName}${member.middleName ? ` ${member.middleName}` : ''}`
    : 'Кәсіподақ мүшесі';
