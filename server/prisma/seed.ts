import 'dotenv/config';
import {
  PrismaClient,
  ApplicationStatus,
  ApplicationType,
  Role,
  DocumentCategory,
  EventStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();
const sourceDirectory = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const uploadDirectory = resolve(process.env.UPLOAD_DIR || './uploads');
const now = new Date();
const day = (offset: number) => new Date(now.getTime() + offset * 86_400_000);
const demoPassword = 'Dev@12345!';

async function copyAssets() {
  await mkdir(join(uploadDirectory, 'public'), { recursive: true });
  for (const [source, destination] of [
    [join(sourceDirectory, 'public'), join(uploadDirectory, 'public')],
    [join(sourceDirectory, 'documents'), uploadDirectory],
  ]) {
    for (const name of await readdir(source)) {
      const target = join(destination, name);
      try {
        await stat(target);
      } catch {
        await copyFile(join(source, name), target);
      }
    }
  }
}

const people = [
  ['admin@example.com', 'Әкімші', 'Ерлан', 'Серікұлы', 'Жүйе әкімшісі', 'Әкімшілік', Role.ADMIN],
  [
    'chairman@example.com',
    'Сәрсенова',
    'Айгүл',
    'Маратқызы',
    'Кәсіподақ төрағасы',
    'Әкімшілік',
    Role.CHAIRMAN,
  ],
  [
    'member@example.com',
    'Ахметова',
    'Айнұр',
    'Болатқызы',
    'Қазақ тілі мұғалімі',
    'Қазақ тілі мен әдебиеті',
    Role.MEMBER,
  ],
  [
    'gulnar@example.com',
    'Омарова',
    'Гүлнар',
    'Ермекқызы',
    'Математика мұғалімі',
    'Математика',
    Role.MEMBER,
  ],
  [
    'daulet@example.com',
    'Ермеков',
    'Дәулет',
    'Асылұлы',
    'Дене шынықтыру мұғалімі',
    'Дене шынықтыру',
    Role.MEMBER,
  ],
  [
    'madina@example.com',
    'Қасымова',
    'Мәдина',
    'Талғатқызы',
    'Бастауыш сынып мұғалімі',
    'Бастауыш сыныптар',
    Role.MEMBER,
  ],
  [
    'nurlan@example.com',
    'Бекенов',
    'Нұрлан',
    'Әлібекұлы',
    'Тарих мұғалімі',
    'Қоғамдық пәндер',
    Role.MEMBER,
  ],
  [
    'aliya@example.com',
    'Жұмабаева',
    'Әлия',
    'Нұрқызы',
    'Ағылшын тілі мұғалімі',
    'Шет тілдері',
    Role.MEMBER,
  ],
  [
    'serik@example.com',
    'Әбілов',
    'Серік',
    'Оразұлы',
    'Физика мұғалімі',
    'Жаратылыстану',
    Role.MEMBER,
  ],
  [
    'aigerim@example.com',
    'Мұратова',
    'Айгерім',
    'Саматқызы',
    'Мектеп психологі',
    'Әлеуметтік қызмет',
    Role.MEMBER,
  ],
  [
    'askar@example.com',
    'Төлеуов',
    'Асқар',
    'Даниярұлы',
    'Информатика мұғалімі',
    'Ақпараттық технологиялар',
    Role.MEMBER,
  ],
  [
    'saltanat@example.com',
    'Нұрғазина',
    'Салтанат',
    'Ерболқызы',
    'Биология мұғалімі',
    'Жаратылыстану',
    Role.MEMBER,
  ],
  ['zhanar@example.com', 'Әлімова', 'Жанар', 'Бекқызы', 'Кітапханашы', 'Кітапхана', Role.MEMBER],
  [
    'baurzhan@example.com',
    'Құдайбергенов',
    'Бауыржан',
    'Мұратұлы',
    'Шаруашылық меңгерушісі',
    'Шаруашылық',
    Role.MEMBER,
  ],
  [
    'dinara@example.com',
    'Исабекова',
    'Динара',
    'Қанатқызы',
    'Химия мұғалімі',
    'Жаратылыстану',
    Role.MEMBER,
  ],
  [
    'raushan@example.com',
    'Сүлейменова',
    'Раушан',
    'Серікқызы',
    'Музыка мұғалімі',
    'Өнер',
    Role.MEMBER,
  ],
] as const;

async function seed() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO !== 'true')
    throw new Error(
      'Демо seed production режимінде орындалмайды. Демо орнату үшін SEED_DEMO=true мәнін саналы түрде қосыңыз.',
    );
  await copyAssets();
  const password = await bcrypt.hash(demoPassword, 12);
  const users = [];
  const members = [];
  for (const [index, person] of people.entries()) {
    const [email, lastName, firstName, middleName, position, department, role] = person;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: `seed-user-${index + 1}`,
        email,
        password,
        role,
        createdAt: day(-240 + index * 13),
      },
    });
    const member = await prisma.member.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: `seed-member-${index + 1}`,
        userId: user.id,
        firstName,
        lastName,
        middleName,
        phone: `+7701${String(1000000 + index * 101)}`,
        position,
        department,
        joinDate: day(-240 + index * 13),
        createdAt: day(-240 + index * 13),
        status: index === 15 ? 'INACTIVE' : 'ACTIVE',
      },
    });
    users.push(user);
    members.push(member);
  }
  const admin = users[0];
  const chairman = users[1];
  const applicationData: {
    title: string;
    type: ApplicationType;
    status: ApplicationStatus;
    amount?: number;
    memberIndex: number;
  }[] = [
    {
      title: 'Емделуге материалдық көмек',
      type: 'MATERIAL',
      status: 'NEW',
      amount: 75000,
      memberIndex: 2,
    },
    { title: 'Отбасына әлеуметтік қолдау', type: 'SOCIAL', status: 'IN_REVIEW', memberIndex: 3 },
    {
      title: 'Баланың оқуына біржолғы көмек',
      type: 'ONE_TIME',
      status: 'NEEDS_INFO',
      amount: 40000,
      memberIndex: 4,
    },
    {
      title: 'Оңалту еміне материалдық көмек',
      type: 'MATERIAL',
      status: 'APPROVED',
      amount: 100000,
      memberIndex: 5,
    },
    {
      title: 'Әлеуметтік жәрдемақы туралы өтініш',
      type: 'SOCIAL',
      status: 'REJECTED',
      memberIndex: 6,
    },
    {
      title: 'Мерейтойға біржолғы көмек',
      type: 'ONE_TIME',
      status: 'COMPLETED',
      amount: 30000,
      memberIndex: 7,
    },
    { title: 'Еңбек демалысы туралы кеңес', type: 'OTHER', status: 'NEW', memberIndex: 8 },
    {
      title: 'Отбасылық жағдайға байланысты көмек',
      type: 'MATERIAL',
      status: 'IN_REVIEW',
      amount: 60000,
      memberIndex: 2,
    },
    { title: 'Сауықтыру жолдамасына өтініш', type: 'SOCIAL', status: 'APPROVED', memberIndex: 9 },
    { title: 'Еңбек шартын түсіндіру', type: 'OTHER', status: 'COMPLETED', memberIndex: 10 },
  ];
  for (const [index, item] of applicationData.entries()) {
    const id = `seed-application-${index + 1}`;
    const applicant = members[item.memberIndex];
    const createdAt = day(-index * 3 - 1);
    await prisma.application.upsert({
      where: { id },
      update: {},
      create: {
        id,
        memberId: applicant.id,
        type: item.type,
        title: item.title,
        description: `${item.title} бойынша кәсіподақ комитетінен қолдау сұраймын. Қажетті құжаттарды ұсынуға дайынмын. Өтінішімді қолданыстағы ережеге сәйкес қарауыңызды өтінемін.`,
        amount: item.amount,
        status: item.status,
        createdAt,
      },
    });
    await prisma.applicationStatusHistory.upsert({
      where: { id: `${id}-history-created` },
      update: {},
      create: {
        id: `${id}-history-created`,
        applicationId: id,
        newStatus: 'NEW',
        changedBy: users[item.memberIndex].id,
        createdAt,
      },
    });
    if (item.status !== 'NEW')
      await prisma.applicationStatusHistory.upsert({
        where: { id: `${id}-history-status` },
        update: {},
        create: {
          id: `${id}-history-status`,
          applicationId: id,
          oldStatus: 'NEW',
          newStatus: item.status,
          changedBy: chairman.id,
          createdAt: new Date(createdAt.getTime() + 3_600_000),
        },
      });
    await prisma.applicationComment.upsert({
      where: { id: `${id}-comment` },
      update: {},
      create: {
        id: `${id}-comment`,
        applicationId: id,
        userId: chairman.id,
        text:
          item.status === 'NEEDS_INFO'
            ? 'Өтінішті қарау үшін растайтын құжатты қоса жіберуіңізді сұраймыз.'
            : item.status === 'REJECTED'
              ? 'Өтініш ережеде көрсетілген талаптарға сәйкес келмейді. Қосымша кеңес алу үшін комитетке хабарласыңыз.'
              : 'Өтінішіңіз тіркелді. Қабылданған шешім туралы жеке кабинетіңізге хабарлама жіберіледі.',
        createdAt: new Date(createdAt.getTime() + 7_200_000),
      },
    });
  }
  const news = [
    [
      'ustazdar-kuni-2026',
      'Ұстаздар күні құтты болсын!',
      'Ұстаз еңбегі — ұрпақ болашағына салынған ең үлкен инвестиция. Барша әріптестерімізді кәсіби мерекемен құттықтаймыз.',
      'Құрметті ұстаздар! Сіздердің шәкіртке берген біліміңіз бен тәрбиелеріңіз қоғамның ертеңін қалыптастырады. Кәсіподақ комитеті әрбір мектеп қызметкеріне зор денсаулық, отбасына амандық және шығармашылық табыс тілейді. Мерекелік кездесуде үздік қызметкерлерге алғыс хаттар табысталды. Біз әріптестеріміздің құқығын қорғау мен кәсіби дамуын қолдауды жалғастырамыз.',
    ],
    [
      'aleumettik-qoldau-2026',
      'Әлеуметтік қолдау: жаңа мүмкіндіктер',
      'Кәсіподақ мүшелеріне материалдық көмек көрсету тәртібі жаңартылды. Өтінішті енді онлайн беруге болады.',
      'Кәсіподақ комитеті әлеуметтік қолдауды қолжетімді ету үшін өтініш қабылдау тәртібін жаңартты. Мүшелер жеке кабинетінен өтініш түрін таңдап, қажетті құжаттарды тіркей алады. Әр өтініштің қаралу мәртебесі мен тарихы сақталады. Қосымша сұрақтар бойынша комитет мүшелеріне хабарласыңыз.',
    ],
    [
      'zhana-oqu-zhyly',
      'Жаңа оқу жылы — ортақ мақсаттар',
      'Мектеп ұжымының жаңа оқу жылына арналған жиналысында кәсіподақтың жұмыс жоспары таныстырылды.',
      'Жаңа оқу жылындағы негізгі бағыттар — қауіпсіз еңбек жағдайы, педагогтердің кәсіби дамуы және ұжымның әлеуметтік әл-ауқаты. Жиналыста ұжымдық шарттың орындалуы талқыланып, мүшелердің ұсыныстары тыңдалды. Кәсіподақ комитеті қабылданған жұмыс жоспарын құжаттар бөлімінде жариялады.',
    ],
    [
      'enbek-quqygy-seminary',
      'Еңбек құқығы бойынша пайдалы кездесу',
      'Мектеп қызметкерлері еңбек шарты, демалыс және әлеуметтік кепілдіктер туралы сұрақтарына жауап алды.',
      'Кәсіподақ ұйымдастырған кездесуде мамандар еңбек шартының талаптарын, демалысты рәсімдеу тәртібін және еңбек дауын шешу жолдарын түсіндірді. Әріптестер нақты жағдайларға қатысты сұрақтар қойып, жеке кеңес алды. Осындай кездесулер тұрақты түрде өткізіледі.',
    ],
    [
      'birge-kushimiz-mol',
      'Бірге — күшіміз мол!',
      'Ұжымымыздың мәдени кездесуінде әріптестер бір-бірімен жақынырақ танысып, жаңа идеялармен бөлісті.',
      'Кәсіподақ тек құқық қорғаумен шектелмейді. Біз әріптестер арасында сенім мен қолдау мәдениетін қалыптастырамыз. Ұжымдық кездесуде шығармашылық топтар өз өнерін көрсетіп, ортақ жобалар талқыланды. Келесі іс-шараларға қатысу үшін платформаның іс-шаралар бөліміне назар аударыңыз.',
    ],
  ];
  for (const [index, item] of news.entries()) {
    const [slug, title, shortDescription, content] = item;
    await prisma.news.upsert({
      where: { slug },
      update: {},
      create: {
        id: `seed-news-${index + 1}`,
        slug,
        title,
        shortDescription,
        content,
        image: `/api/assets/news-${index + 1}.jpg`,
        authorId: chairman.id,
        status: 'PUBLISHED',
        publishedAt: day(-index * 4 - 1),
        createdAt: day(-index * 4 - 1),
      },
    });
  }
  const documents: [string, string, DocumentCategory][] = [
    [
      'Кәсіподақ мүшелігі туралы ереже',
      'Мүшелікке қабылдау, жарна төлеу және кәсіподақ мүшелерінің құқықтары.',
      'RULES',
    ],
    [
      'Материалдық көмек көрсету қаулысы',
      'Материалдық көмекке өтініш беру және қарау тәртібі.',
      'RESOLUTIONS',
    ],
    [
      'Кәсіподақ комитеті отырысының хаттамасы',
      'Комитет отырысының күн тәртібі мен қабылданған шешімдер.',
      'PROTOCOLS',
    ],
    [
      '2026 жылғы әлеуметтік қолдау есебі',
      'Кәсіподақ мүшелеріне көрсетілген қолдаудың демо есебі.',
      'REPORTS',
    ],
    [
      'Қазақстан Республикасының еңбек құқықтары',
      'Қызметкердің еңбек құқықтары туралы демо анықтама.',
      'REGULATIONS',
    ],
  ];
  for (const [index, [title, description, category]] of documents.entries()) {
    const fileName = `seed-document-${index + 1}.pdf`;
    const file = await stat(join(uploadDirectory, fileName));
    await prisma.document.upsert({
      where: { id: `seed-document-${index + 1}` },
      update: {},
      create: {
        id: `seed-document-${index + 1}`,
        title,
        description,
        category,
        fileName,
        fileUrl: `/api/uploads/${fileName}`,
        fileType: 'application/pdf',
        fileSize: file.size,
        uploadedBy: admin.id,
        createdAt: day(-index * 7 - 3),
      },
    });
  }
  const events: [string, string, number, string, string, string, EventStatus][] = [
    [
      'Ұстаздар күніне арналған кездесу',
      'Әріптестерге құрмет көрсетіп, ортақ жетістіктерімізді атап өтетін мерекелік кездесу. Қатысуға барлық кәсіподақ мүшелерін шақырамыз.',
      2,
      '15:00',
      '17:00',
      'Мектептің акт залы',
      'UPCOMING',
    ],
    [
      'Еңбек құқығы: ашық семинар',
      'Еңбек шарты, демалыс, әлеуметтік кепілдіктер және ұжымдық шарт туралы маманмен сұрақ-жауап.',
      7,
      '14:00',
      '16:00',
      'Мәжіліс залы, 2-қабат',
      'UPCOMING',
    ],
    [
      'Денсаулық күні: бірге серуендейік',
      'Таза ауада серуен, жеңіл жаттығулар және әріптестермен пайдалы әңгіме. Ыңғайлы киіммен келіңіз.',
      14,
      '10:00',
      '13:00',
      'Орталық саябақ',
      'UPCOMING',
    ],
    [
      'Кәсіподақ мүшелерінің жалпы жиналысы',
      'Жылдық жұмыс жоспарын талқылау және ұжымның ұсыныстарын тыңдау. Жиналыс хаттамасы құжаттар бөлімінде қолжетімді.',
      -10,
      '16:00',
      '17:30',
      'Мектептің акт залы',
      'PAST',
    ],
    [
      'Цифрлық сауаттылық практикумы',
      'Жеке кабинет, онлайн өтініштер және электрондық құжаттармен жұмыс істеу бойынша тәжірибелік сабақ.',
      -20,
      '14:30',
      '16:00',
      'Информатика кабинеті',
      'PAST',
    ],
  ];
  for (const [
    index,
    [title, description, offset, startTime, endTime, location, status],
  ] of events.entries()) {
    const id = `seed-event-${index + 1}`;
    await prisma.event.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title,
        description,
        date: day(offset),
        startTime,
        endTime,
        location,
        status,
        organizer: 'Мектеп кәсіподақ комитеті',
        image: `/api/assets/event-${index + 1}.jpg`,
        createdAt: day(-25 - index),
      },
    });
    for (const user of users.slice(1, index + 6))
      await prisma.eventParticipant.upsert({
        where: { eventId_userId: { eventId: id, userId: user.id } },
        update: {},
        create: { eventId: id, userId: user.id },
      });
  }
  const settings = {
    organizationName: 'КӘСІПОДАҚ',
    schoolName: '№25 жалпы білім беретін мектеп',
    description:
      'Мектеп қызметкерлерінің құқығы мен мүддесін бірге қорғаймыз. Ашықтық, қолдау және ортақ даму — біздің басты құндылықтарымыз.',
    address: 'Астана қаласы, Мәңгілік Ел даңғылы, 25',
    email: 'kasipodaq@example.com',
    phone: '+7 (7172) 55-25-25',
    heroImage: '/api/assets/hero-community.jpg',
  };
  for (const [key, value] of Object.entries(settings))
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  for (const [index, user] of users.entries())
    await prisma.notification.upsert({
      where: { id: `seed-notification-${index + 1}` },
      update: {},
      create: {
        id: `seed-notification-${index + 1}`,
        userId: user.id,
        title: 'Кәсіподақ платформасына қош келдіңіз!',
        message:
          'Жаңалықтармен танысып, іс-шараларға қатысыңыз. Жеке кабинеттен өтініш беріп, оның қаралуын бақылай аласыз.',
        type: 'INFO',
        link: '/news',
        createdAt: day(-1),
      },
    });
  await prisma.notification.upsert({
    where: { id: 'seed-notification-status' },
    update: {},
    create: {
      id: 'seed-notification-status',
      userId: users[2].id,
      title: 'Өтінішіңіз қабылданды',
      message: 'Емделуге материалдық көмек туралы өтінішіңіз тіркелді және комитетке жіберілді.',
      type: 'APPLICATION',
      link: '/applications/seed-application-1',
    },
  });
  console.info(
    'Seed дайын: 16 мүше, 10 өтініш, 5 жаңалық, 5 PDF құжат, 5 іс-шара. Бар дерек пен өзгертілген парольдер сақталды.',
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
