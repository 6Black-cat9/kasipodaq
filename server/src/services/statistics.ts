import { prisma } from '../utils/prisma.js';
import { HttpError } from '../utils/http.js';

const applicationTypeLabels = {
  MATERIAL: 'Материалдық көмек',
  ONE_TIME: 'Біржолғы көмек',
  SOCIAL: 'Әлеуметтік көмек',
  OTHER: 'Басқа',
};
const applicationStatusLabels = {
  NEW: 'Жаңа',
  IN_REVIEW: 'Қаралуда',
  NEEDS_INFO: 'Ақпарат қажет',
  APPROVED: 'Мақұлданды',
  REJECTED: 'Қабылданбады',
  COMPLETED: 'Орындалды',
};

export function statisticsDays(value: unknown): number {
  if (value === undefined) return 90;
  if (typeof value !== 'string' || !['7', '30', '90', '180', '365'].includes(value)) {
    throw new HttpError(400, 'Кезең: 7, 30, 90, 180 немесе 365 күн');
  }
  return Number(value);
}

export async function overviewCounts(publicOnly = false) {
  const now = new Date();
  const [
    members,
    activeMembers,
    activeApplications,
    approvedApplications,
    news,
    documents,
    events,
  ] = await prisma.$transaction([
    prisma.member.count(),
    prisma.member.count({ where: { status: 'ACTIVE', user: { isActive: true } } }),
    prisma.application.count({ where: { status: { in: ['NEW', 'IN_REVIEW', 'NEEDS_INFO'] } } }),
    prisma.application.count({ where: { status: 'APPROVED' } }),
    prisma.news.count({
      where: publicOnly ? { status: 'PUBLISHED', publishedAt: { lte: now } } : {},
    }),
    prisma.document.count(),
    prisma.event.count(),
  ]);
  return {
    members,
    activeMembers,
    activeApplications,
    approvedApplications,
    news,
    documents,
    events,
  };
}

export async function statisticsOverview(days: number) {
  const now = new Date();
  const since = new Date(now);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  const monthly = days > 30;
  const key = (date: Date) => date.toISOString().slice(0, monthly ? 7 : 10);
  const periods = new Map<
    string,
    { name: string; value: number; total: number; approved: number }
  >();
  const cursor = new Date(since);
  while (cursor <= now) {
    const period = key(cursor);
    if (!periods.has(period)) {
      const name = new Intl.DateTimeFormat('kk-KZ', {
        month: monthly ? 'short' : '2-digit',
        ...(monthly ? { year: '2-digit' } : { day: '2-digit' }),
        timeZone: 'UTC',
      }).format(cursor);
      periods.set(period, { name, value: 0, total: 0, approved: 0 });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const [counts, members, applications, events, types, statuses] = await Promise.all([
    overviewCounts(),
    prisma.member.findMany({
      where: { joinDate: { gte: since, lte: now } },
      select: { joinDate: true },
    }),
    prisma.application.findMany({
      where: { createdAt: { gte: since, lte: now } },
      select: { createdAt: true, status: true },
    }),
    prisma.event.findMany({
      where: { date: { gte: since, lte: now }, status: { not: 'CANCELLED' } },
      select: { date: true },
    }),
    prisma.application.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since, lte: now } },
      _count: { _all: true },
    }),
    prisma.application.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since, lte: now } },
      _count: { _all: true },
    }),
  ]);
  const memberPeriods = new Map(
    [...periods].map(([period, value]) => [period, { name: value.name, value: 0 }]),
  );
  const eventPeriods = new Map(
    [...periods].map(([period, value]) => [period, { name: value.name, value: 0 }]),
  );
  for (const member of members) {
    const period = memberPeriods.get(key(member.joinDate));
    if (period) period.value += 1;
  }
  for (const application of applications) {
    const period = periods.get(key(application.createdAt));
    if (period) {
      period.total += 1;
      if (['APPROVED', 'COMPLETED'].includes(application.status)) period.approved += 1;
    }
  }
  for (const event of events) {
    const period = eventPeriods.get(key(event.date));
    if (period) period.value += 1;
  }
  return {
    ...counts,
    memberTrend: [...memberPeriods.values()],
    applicationTrend: [...periods.values()].map(({ name, total, approved }) => ({
      name,
      total,
      approved,
    })),
    applicationTypes: types.map((entry) => ({
      name: applicationTypeLabels[entry.type],
      value: entry._count._all,
    })),
    applicationStatuses: statuses.map((entry) => ({
      name: applicationStatusLabels[entry.status],
      value: entry._count._all,
    })),
    eventTrend: [...eventPeriods.values()],
  };
}
