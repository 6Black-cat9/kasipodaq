import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const serverDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
dotenv.config({ path: resolve(serverDirectory, '.env') });
const devDatabase = process.env.DATABASE_URL;
const testDatabase = process.env.TEST_DATABASE_URL;
if (!testDatabase)
  throw new Error('TEST_DATABASE_URL міндетті. Тесттер үшін жеке PostgreSQL дерекқорын жасаңыз.');
if (devDatabase && new URL(devDatabase).pathname === new URL(testDatabase).pathname) {
  throw new Error('TEST_DATABASE_URL development дерекқорынан бөлек дерекқорға бағытталуы керек.');
}
const schemaName = `integration_${process.pid}_${Date.now()}`;
const testUrl = new URL(testDatabase);
testUrl.searchParams.set('schema', schemaName);
process.env.DATABASE_URL = testUrl.toString();
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-tests-only-secret-at-least-32-characters';
process.env.CLIENT_URL = 'http://localhost:5173';
const prisma = new PrismaClient({ datasourceUrl: testUrl.toString() });
const password = 'Testing@12345!';
let app: Express;
let serverPrisma: PrismaClient | undefined;
let uploadDirectory: string | undefined;
let admin: ReturnType<typeof request.agent>;
let chairman: ReturnType<typeof request.agent>;
let member: ReturnType<typeof request.agent>;
let otherMember: ReturnType<typeof request.agent>;
let memberId: string;
let memberUserId: string;
let otherMemberUserId: string;
let chairmanUserId: string;
let applicationId: string;
let uploadedPrivateFile: string;
let pdf: Buffer;

beforeAll(async () => {
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: serverDirectory,
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdio: 'pipe',
  });
  uploadDirectory = await mkdtemp(resolve(tmpdir(), 'kasipodaq-integration-'));
  process.env.UPLOAD_DIR = uploadDirectory;
  pdf = await readFile(resolve(serverDirectory, 'prisma/assets/documents/seed-document-1.pdf'));
  const hash = await bcrypt.hash(password, 10);
  for (const [index, role] of (['ADMIN', 'CHAIRMAN', 'MEMBER', 'MEMBER'] as const).entries()) {
    const user = await prisma.user.create({
      data: {
        email: `test-${index}@example.com`,
        password: hash,
        role,
        member: {
          create: {
            firstName: ['Ерлан', 'Айгүл', 'Айнұр', 'Дәулет'][index],
            lastName: 'Тестілеу',
            phone: '+77010000000',
            position: 'Мұғалім',
            department: 'Математика',
          },
        },
      },
      include: { member: true },
    });
    if (index === 1) chairmanUserId = user.id;
    if (index === 2) {
      memberId = user.member!.id;
      memberUserId = user.id;
    }
    if (index === 3) otherMemberUserId = user.id;
  }
  app = (await import('../src/app.js')).default;
  serverPrisma = (await import('../src/utils/prisma.js')).prisma;
  [admin, chairman, member, otherMember] = Array.from({ length: 4 }, () => request.agent(app));
  for (const [index, agent] of [admin, chairman, member, otherMember].entries()) {
    await agent
      .post('/api/auth/login')
      .send({ email: `test-${index}@example.com`, password })
      .expect(200);
  }
}, 60000);

afterAll(async () => {
  await serverPrisma?.$disconnect();
  if (/^integration_\d+_\d+$/.test(schemaName)) {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  }
  await prisma.$disconnect();
  if (uploadDirectory) await rm(uploadDirectory, { recursive: true, force: true });
});

const validApplication = {
  type: 'MATERIAL',
  title: 'Емделуге материалдық көмек',
  description: 'Кәсіподақ комитетінен емделуге материалдық көмек көрсетуін сұраймын.',
  amount: 50000,
};
const validNews = {
  title: 'Ұжымға арналған жаңа хабарландыру',
  shortDescription: 'Кәсіподақ мүшелерінің ортақ жұмыс жоспары туралы хабарландыру.',
  content:
    'Құрметті әріптестер! Кәсіподақ комитеті келесі айға арналған жұмыс жоспарын таныстырады. Ұсыныстарыңызды жеке кабинет арқылы жіберіңіз.',
};
const newMember = {
  email: 'new-member@example.com',
  password,
  firstName: 'Гүлнар',
  lastName: 'Омарова',
  phone: '+77011234567',
  position: 'Математика мұғалімі',
  department: 'Математика',
};

function expectNoPasswords(value: unknown) {
  if (Array.isArray(value)) value.forEach(expectNoPasswords);
  else if (value && typeof value === 'object') {
    expect(Object.keys(value)).not.toContain('password');
    expect(Object.keys(value)).not.toContain('tokenVersion');
    Object.values(value).forEach(expectNoPasswords);
  }
}

describe('JWT сессия және рөлдік рұқсат', () => {
  it('дұрыс кіруде HttpOnly сессия орнатады және пароль қайтармайды', async () => {
    const result = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-2@example.com', password })
      .expect(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data.user.role).toBe('MEMBER');
    expect(result.headers['set-cookie'][0]).toContain('HttpOnly');
    expectNoPasswords(result.body);
  });
  it('қате парольде бірдей 401 қатесін қайтарады', async () => {
    const result = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-2@example.com', password: 'invalid-password' })
      .expect(401);
    expect(result.body).toMatchObject({ success: false, errors: [] });
  });
  it('сессиясыз жеке endpoint қолжетімсіз', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/applications').expect(401);
    await request(app).post('/api/auth/register').send(newMember).expect(401);
  });
  it('MEMBER әкімшілік және өзге мүшелердің дерегіне кіре алмайды', async () => {
    await member.get('/api/members').expect(403);
    await member.get(`/api/members/${memberId}`).expect(403);
    await member.get('/api/statistics/overview').expect(403);
    await member.get('/api/users').expect(403);
    await member.post('/api/auth/register').send(newMember).expect(403);
  });
  it('профиль арқылы рөл көтеру мүмкін емес', async () => {
    await member.patch('/api/auth/profile').send({ firstName: 'Айнұр', role: 'ADMIN' }).expect(400);
    const result = await member.get('/api/auth/me').expect(200);
    expect(result.body.data.role).toBe('MEMBER');
  });
  it('bcrypt шегінен ұзын UTF-8 парольдер қабылданбайды', async () => {
    const longPassword = 'Қ'.repeat(37);
    await admin
      .post('/api/members')
      .send({ ...newMember, email: 'long-password@example.com', password: longPassword })
      .expect(400);
    await member
      .post('/api/auth/password')
      .send({ currentPassword: password, newPassword: longPassword })
      .expect(400);
    expect(
      await prisma.user.findUnique({ where: { email: 'long-password@example.com' } }),
    ).toBeNull();
  });
  it('әкімші өзінің рөлін төмендете немесе аккаунтын бұғаттай алмайды', async () => {
    const result = await admin.get('/api/auth/me').expect(200);
    await admin.put(`/api/users/${result.body.data.id}`).send({ role: 'MEMBER' }).expect(409);
    await admin.put(`/api/users/${result.body.data.id}`).send({ isActive: false }).expect(409);
    await admin.get('/api/users').expect(200);
  });
  it('рұқсат етілмеген Origin cookie арқылы өзгеріс жасай алмайды', async () => {
    await member
      .patch('/api/auth/profile')
      .set('Origin', 'https://invalid.example')
      .send({ firstName: 'Айнұр' })
      .expect(403);
  });
});

describe('Мүшелерді басқару', () => {
  it('ADMIN мүшені жасайды және парольді hash ретінде сақтайды', async () => {
    const result = await admin.post('/api/members').send(newMember).expect(201);
    expect(result.body.data).toMatchObject({ firstName: 'Гүлнар', lastName: 'Омарова' });
    expectNoPasswords(result.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: newMember.email } });
    expect(user.password).not.toBe(password);
    expect(await bcrypt.compare(password, user.password)).toBe(true);
  });
  it('қайталанатын email-де 409, қате өрістерде 400 береді', async () => {
    await admin.post('/api/members').send(newMember).expect(409);
    await admin
      .post('/api/members')
      .send({ ...newMember, email: 'not-email' })
      .expect(400);
  });
  it('CHAIRMAN мүшелерді көреді, қосу/өңдеу/жоюға рұқсат жоқ', async () => {
    const result = await chairman.get('/api/members').expect(200);
    expect(result.body.data.total).toBeGreaterThanOrEqual(5);
    expectNoPasswords(result.body);
    await chairman
      .post('/api/members')
      .send({ ...newMember, email: 'chair-created@example.com' })
      .expect(403);
    await chairman.put(`/api/members/${memberId}`).send({ firstName: 'Өзгерді' }).expect(403);
    await chairman.delete(`/api/members/${memberId}`).expect(403);
  });
  it('іздеу, пагинация және бос сүзгілер дұрыс жұмыс істейді', async () => {
    const result = await admin
      .get('/api/members')
      .query({ q: 'Омарова', page: 1, pageSize: 2, status: '', department: '', position: '' })
      .expect(200);
    expect(result.body.data.items).toHaveLength(1);
    expect(result.body.data.items[0].email ?? result.body.data.items[0].user.email).toBe(
      newMember.email,
    );
    expect(result.body.data.pageSize).toBe(2);
    await admin.get('/api/members').query({ pageSize: 0 }).expect(400);
  });
});

describe('Өтініштер мен хабарламалар', () => {
  it('материалдық көмекке сома міндетті әрі оң болуы керек', async () => {
    await member
      .post('/api/applications')
      .send({ ...validApplication, amount: null })
      .expect(400);
    await member
      .post('/api/applications')
      .send({ ...validApplication, amount: -1 })
      .expect(400);
    await member
      .post('/api/applications')
      .send({ ...validApplication, amount: true })
      .expect(400);
    expect(await prisma.application.count()).toBe(0);
  });
  it('жаңа өтінішті нақты дерекқорға, алғашқы тарих пен хабарламаға сақтайды', async () => {
    const result = await member.post('/api/applications').send(validApplication).expect(201);
    applicationId = result.body.data.id;
    expect(result.body.data).toMatchObject({ memberId, status: 'NEW' });
    expect(result.body.data.history).toHaveLength(1);
    expect(result.body.data.history[0]).toMatchObject({
      oldStatus: null,
      newStatus: 'NEW',
      changedBy: memberUserId,
    });
    expect(Number(result.body.data.amount)).toBe(50000);
    expect(
      await prisma.notification.count({ where: { userId: memberUserId, type: 'APPLICATION' } }),
    ).toBe(1);
    expectNoPasswords(result.body);
  });
  it('MEMBER тек өзінің өтініштерін көреді және өзгертеді', async () => {
    await otherMember.get(`/api/applications/${applicationId}`).expect(403);
    await otherMember
      .put(`/api/applications/${applicationId}`)
      .send({ title: 'Құпия өзгерту' })
      .expect(403);
    await otherMember
      .post(`/api/applications/${applicationId}/comments`)
      .send({ text: 'Басқа мүшенің пікірі' })
      .expect(403);
    const result = await otherMember.get('/api/applications').expect(200);
    expect(result.body.data.items).toHaveLength(0);
    expect(
      (await prisma.application.findUniqueOrThrow({ where: { id: applicationId } })).title,
    ).toBe(validApplication.title);
  });
  it('CHAIRMAN статусты өзгерткенде тарих, жауап және хабарлама атомарлы сақталады', async () => {
    const result = await chairman
      .post(`/api/applications/${applicationId}/status`)
      .send({ status: 'IN_REVIEW', comment: 'Өтініш комитет қарауына алынды.' })
      .expect(200);
    expect(result.body.data.status).toBe('IN_REVIEW');
    expect(result.body.data.history).toHaveLength(2);
    expect(result.body.data.history[1]).toMatchObject({
      oldStatus: 'NEW',
      newStatus: 'IN_REVIEW',
      changedBy: chairmanUserId,
    });
    expect(result.body.data.comments[0].text).toBe('Өтініш комитет қарауына алынды.');
    expect(
      await prisma.notification.count({ where: { userId: memberUserId, type: 'STATUS' } }),
    ).toBe(1);
  });
  it('MEMBER статус ауыстыра алмайды, қаралудағы өтінішті өзгерте алмайды', async () => {
    await member
      .post(`/api/applications/${applicationId}/status`)
      .send({ status: 'APPROVED' })
      .expect(403);
    await member
      .put(`/api/applications/${applicationId}`)
      .send({ title: 'Өзгертілген өтініш' })
      .expect(409);
    await member.delete(`/api/applications/${applicationId}`).expect(403);
  });
  it('бірдей статусқа қайта ауыстыру тарихты қайталамайды', async () => {
    await chairman
      .post(`/api/applications/${applicationId}/status`)
      .send({ status: 'IN_REVIEW' })
      .expect(400);
    expect(await prisma.applicationStatusHistory.count({ where: { applicationId } })).toBe(2);
  });
  it('өтініш сүзгілерінің бос мәндері ескерілмейді', async () => {
    const result = await member
      .get('/api/applications')
      .query({ status: '', type: '' })
      .expect(200);
    expect(result.body.data.total).toBe(1);
  });
  it('хабарламаны басқа мүше оқылды деп белгілей алмайды', async () => {
    const notification = await prisma.notification.findFirstOrThrow({
      where: { userId: memberUserId },
    });
    await otherMember.put(`/api/notifications/${notification.id}/read`).expect(404);
    await member.put(`/api/notifications/${notification.id}/read`).expect(200);
    expect(
      (await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } })).isRead,
    ).toBe(true);
  });
});

describe('Жаңалықтар және іс-шаралар', () => {
  it('ADMIN жаңалық жариялайды, жария API slug бойынша оқиды, хабарлама тарайды', async () => {
    const result = await admin
      .post('/api/news')
      .send({ ...validNews, slug: 'test-published-news', status: 'PUBLISHED', notify: true })
      .expect(201);
    expect(result.body.data.authorId).toBeDefined();
    const publicResult = await request(app).get('/api/news/test-published-news').expect(200);
    expect(publicResult.body.data.title).toBe(validNews.title);
    expect(await prisma.notification.count({ where: { type: 'NEWS' } })).toBe(5);
    expectNoPasswords(publicResult.body);
  });
  it('draft жаңалық жария тізімде/slug-та жоқ, CHAIRMAN көре алады', async () => {
    await chairman
      .post('/api/news')
      .send({ ...validNews, slug: 'test-draft-news', status: 'DRAFT' })
      .expect(201);
    await request(app).get('/api/news/test-draft-news').expect(404);
    await member.get('/api/news/test-draft-news').expect(404);
    await chairman.get('/api/news/test-draft-news').expect(200);
    const publicList = await request(app).get('/api/news').expect(200);
    expect(publicList.body.data.items.map((news: { slug: string }) => news.slug)).toEqual([
      'test-published-news',
    ]);
    await member.post('/api/news').send(validNews).expect(403);
    await request(app).get('/api/news').query({ status: 'DRAFT' }).expect(403);
  });
  it('мүше алдағы іс-шараға тіркеліп, қайта тіркелгенде қайталанбайды', async () => {
    const result = await chairman
      .post('/api/events')
      .send({
        title: 'Еңбек құқығы семинары',
        description: 'Мектеп қызметкерлеріне арналған еңбек құқығы туралы ашық семинар.',
        date: new Date(Date.now() + 86400000 * 5).toISOString(),
        startTime: '14:00',
        endTime: '16:00',
        location: 'Мектеп акт залы',
        organizer: 'Кәсіподақ комитеті',
      })
      .expect(201);
    const id = result.body.data.id;
    await member.post(`/api/events/${id}/participate`).expect(200);
    const joined = await member.post(`/api/events/${id}/participate`).expect(200);
    expect(joined.body.data).toMatchObject({ participants: 1, isParticipating: true });
    expect(joined.body.data.participants).not.toHaveProperty('userId');
    expect(await prisma.eventParticipant.count({ where: { eventId: id } })).toBe(1);
    const left = await member.delete(`/api/events/${id}/participate`).expect(200);
    expect(left.body.data).toMatchObject({ participants: 0, isParticipating: false });
  });
});

describe('Қауіпсіз файл жүктеу', () => {
  it('нақты PDF құжат жүктеп, жария оқу мен download береді', async () => {
    const result = await admin
      .post('/api/documents')
      .field('title', 'Тест құжаты')
      .field('description', 'Кәсіподақ ережесі')
      .field('category', 'RULES')
      .attach('file', pdf, { filename: 'test-document.pdf', contentType: 'application/pdf' })
      .expect(201);
    const download = await request(app)
      .get(result.body.data.fileUrl)
      .query({ download: '1' })
      .expect(200);
    expect(download.headers['content-type']).toContain('application/pdf');
    expect(download.headers['content-disposition']).toContain('attachment');
    expect(download.body.subarray(0, 4).toString()).toBe('%PDF');
    await chairman
      .post('/api/documents')
      .field('title', 'Бұғатталған құжат')
      .field('description', 'Рөл тексеруі')
      .field('category', 'RULES')
      .attach('file', pdf, { filename: 'test.pdf', contentType: 'application/pdf' })
      .expect(403);
  });
  it('MIME, кеңейтім және мазмұны сәйкес емес файл қабылданбайды', async () => {
    await admin
      .post('/api/documents')
      .field('title', 'Жарамсыз файл')
      .field('description', 'Сигнатура тексеруі')
      .field('category', 'OTHER')
      .attach('file', Buffer.from('not a PDF'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    await admin
      .post('/api/documents')
      .field('title', 'Жарамсыз файл')
      .field('description', 'MIME тексеруі')
      .field('category', 'OTHER')
      .attach('file', pdf, { filename: 'fake.png', contentType: 'image/png' })
      .expect(400);
    await admin
      .post('/api/documents')
      .field('title', 'Жарамсыз файл')
      .field('description', 'Кеңейтім тексеруі')
      .field('category', 'OTHER')
      .attach('file', pdf, { filename: 'fake.exe', contentType: 'application/pdf' })
      .expect(400);
    expect(await prisma.document.count()).toBe(1);
  });
  it('зақымдалған PNG және DOCX файлдары қауіпсіз 400 қайтарады', async () => {
    await member
      .post('/api/uploads')
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: 'broken.png',
        contentType: 'image/png',
      })
      .expect(400);
    await admin
      .post('/api/documents')
      .field('title', 'Зақымдалған құжат')
      .field('description', 'Контейнер тексеруі')
      .field('category', 'OTHER')
      .attach('file', Buffer.from('PK\u0003\u0004'), {
        filename: 'broken.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      .expect(400);
    expect(await prisma.document.count()).toBe(1);
  });
  it('жүктелген жеке суретті тек иесі көреді; өзге avatar-ды қолдану бұғатталады', async () => {
    const jpg = await readFile(resolve(serverDirectory, 'prisma/assets/public/hero-community.jpg'));
    const result = await member
      .post('/api/uploads')
      .attach('file', jpg, { filename: 'profile.jpg', contentType: 'image/jpeg' })
      .expect(201);
    const url = result.body.data.fileUrl;
    await member.get(url).expect(200);
    await request(app).get(url).expect(401);
    await otherMember.get(url).expect(403);
    await otherMember.patch('/api/auth/profile').send({ avatar: url }).expect(400);
    await member.patch('/api/auth/profile').send({ avatar: url }).expect(200);
  });
  it('10 МБ-тан үлкен файл дерекқорға немесе дискіге сақталмайды', async () => {
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1);
    pdf.copy(oversized);
    const result = await admin
      .post('/api/documents')
      .field('title', 'Үлкен файл')
      .field('description', 'Көлем тексеруі')
      .field('category', 'OTHER')
      .attach('file', oversized, { filename: 'large.pdf', contentType: 'application/pdf' })
      .expect(400);
    expect(result.body.message).toContain('10');
    expect(await prisma.document.count()).toBe(1);
  });
  it('жеке өтініш файлын тек иесі және комитет оқи алады', async () => {
    const result = await otherMember
      .post('/api/applications')
      .field('type', 'OTHER')
      .field('title', 'Құжатпен бірге өтініш')
      .field('description', 'Өтініштің жеке құжатын кәсіподақ комитетіне қоса жіберемін.')
      .attach('file', pdf, { filename: 'private.pdf', contentType: 'application/pdf' })
      .expect(201);
    uploadedPrivateFile = result.body.data.attachments[0].fileUrl;
    await otherMember.patch('/api/auth/profile').send({ avatar: uploadedPrivateFile }).expect(400);
    await request(app).get(uploadedPrivateFile).expect(401);
    await member.get(uploadedPrivateFile).expect(403);
    await otherMember.get(uploadedPrivateFile).expect(200);
    await chairman.get(uploadedPrivateFile).expect(200);
    expect(result.body.data.member.userId).toBe(otherMemberUserId);
  });
});

describe('Нақты статистика және сессияны тоқтату', () => {
  it('статистика дерекқор санағына тең, кезең сүзгісі жарамсыз мәнді қабылдамайды', async () => {
    const result = await admin.get('/api/statistics/overview').query({ days: 30 }).expect(200);
    expect(result.body.data.members).toBe(await prisma.member.count());
    expect(result.body.data.documents).toBe(await prisma.document.count());
    expect(result.body.data.news).toBe(await prisma.news.count());
    expect(result.body.data.applicationTrend).toBeInstanceOf(Array);
    await chairman.get('/api/statistics/overview').query({ days: 12 }).expect(400);
  });
  it('қолданушы бұғатталғанда бұрынғы JWT қайта қолданылмайды', async () => {
    await admin.put(`/api/users/${otherMemberUserId}`).send({ isActive: false }).expect(200);
    await otherMember.get('/api/auth/me').expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-3@example.com', password })
      .expect(401);
  });
  it('logout алдында алынған JWT logout кейін Bearer ретінде жарамсыз', async () => {
    const result = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-2@example.com', password })
      .expect(200);
    const cookie = result.headers['set-cookie'][0].split(';')[0];
    const token = cookie.slice('kasipodaq_session='.length);
    await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });
});
