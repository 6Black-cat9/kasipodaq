const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const string = { type: 'string' };
const dateTime = { type: 'string', format: 'date-time' };
const id = { type: 'string', example: 'cmember123' };
const nullableString = { type: 'string', nullable: true };
const auth = [{ CookieAuth: [] }, { BearerAuth: [] }];
const envelope = (data: unknown) => ({
  type: 'object',
  required: ['success', 'message', 'data'],
  properties: { success: { type: 'boolean', example: true }, message: string, data },
});
const page = (name: string) => ({
  type: 'object',
  required: ['items', 'total', 'page', 'pageSize'],
  properties: {
    items: { type: 'array', items: ref(name) },
    total: { type: 'integer' },
    page: { type: 'integer' },
    pageSize: { type: 'integer' },
  },
});
const response = (data: unknown, status = '200') => ({
  [status]: {
    description: 'Сәтті орындалды',
    content: { 'application/json': { schema: envelope(data) } },
  },
});
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409, 413, 429, 500].map((status) => [
    String(status),
    {
      description: (
        {
          400: 'Сұрау немесе файл жарамсыз',
          401: 'Жүйеге кіру қажет немесе сессия жарамсыз',
          403: 'Рөл немесе ресурс иесі рұқсат бермейді',
          404: 'Ресурс табылмады',
          409: 'Қайталанатын жазба немесе қатарлас өзгеріс',
          413: 'Файл 10 МБ көлемінен асады',
          429: 'Сұрау шегі асып кетті',
          500: 'Сервер қатесі',
        } as Record<number, string>
      )[status],
      content: { 'application/json': { schema: ref('Error') } },
    },
  ]),
);
const body = (schema: unknown, multipart = false) => ({
  required: true,
  content: { [multipart ? 'multipart/form-data' : 'application/json']: { schema } },
});
const identifier = (name = 'id') => ({
  in: 'path',
  name,
  required: true,
  schema: { type: 'string' },
});
const query = (name: string, schema: unknown = string) => ({ in: 'query', name, schema });
const listParams = [
  query('q'),
  query('page', { type: 'integer', minimum: 1, default: 1 }),
  query('pageSize', { type: 'integer', minimum: 1, maximum: 100, default: 10 }),
];
const op = (
  tag: string,
  summary: string,
  data: unknown,
  options: Record<string, unknown> = {},
) => ({
  tags: [tag],
  summary,
  security: auth,
  responses: { ...response(data), ...errors },
  ...options,
});
const binary = { type: 'string', format: 'binary' };
const uploadDescription =
  'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG; ең көбі 10 МБ. Кеңейтім, MIME және файл сигнатурасы сәйкес болуы қажет.';
const memberProperties = {
  firstName: string,
  lastName: string,
  middleName: nullableString,
  phone: string,
  position: string,
  department: string,
  joinDate: dateTime,
  status: { enum: ['ACTIVE', 'INACTIVE'], type: 'string' },
  avatar: nullableString,
};
const applicationProperties = {
  type: { type: 'string', enum: ['MATERIAL', 'ONE_TIME', 'SOCIAL', 'OTHER'] },
  title: { type: 'string', minLength: 3, maxLength: 200 },
  description: { type: 'string', minLength: 10, maxLength: 20000 },
  amount: {
    type: 'number',
    nullable: true,
    exclusiveMinimum: true,
    minimum: 0,
    maximum: 9999999999.99,
    description: 'MATERIAL үшін міндетті; API оқу жауаптарында decimal жол болуы мүмкін.',
  },
};
const newsProperties = {
  title: { type: 'string', minLength: 3, maxLength: 200 },
  slug: { type: 'string', description: 'Әріп, сан, дефис. Жіберілмесе тақырыптан жасалады.' },
  shortDescription: { type: 'string', minLength: 10, maxLength: 600 },
  content: { type: 'string', minLength: 20, maxLength: 50000 },
  image: nullableString,
  status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
  publishedAt: { ...dateTime, nullable: true },
  notify: {
    type: 'boolean',
    default: false,
    description: 'Жарияланған жаңалық туралы белсенді мүшелерге хабарлама жіберу.',
  },
};
const eventProperties = {
  title: string,
  description: string,
  date: { type: 'string', example: '2026-10-12' },
  startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '14:00' },
  endTime: { type: 'string', example: '16:00' },
  location: string,
  image: nullableString,
  organizer: string,
  status: { type: 'string', enum: ['UPCOMING', 'PAST', 'CANCELLED'], default: 'UPCOMING' },
};
const docProperties = {
  title: string,
  description: string,
  category: {
    type: 'string',
    enum: ['RULES', 'RESOLUTIONS', 'PROTOCOLS', 'ORDERS', 'REPORTS', 'REGULATIONS', 'OTHER'],
  },
};
const settingsProperties = {
  organizationName: string,
  schoolName: string,
  description: string,
  email: { type: 'string', format: 'email' },
  phone: string,
  address: string,
};
const fileResponse = {
  '200': {
    description:
      'Тексерілген файл. Құжаттар және жария суреттер ашық; өтініш тіркемелері тек иесіне, ADMIN және CHAIRMAN рөлдеріне.',
    content: {
      'application/octet-stream': { schema: binary },
      'application/pdf': { schema: binary },
      'image/jpeg': { schema: binary },
      'image/png': { schema: binary },
    },
  },
  ...errors,
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'КӘСІПОДАҚ REST API',
    version: '1.0.0',
    description:
      'Мектеп кәсіподағын басқару платформасы. JWT сессия HttpOnly cookie-де; API клиенті Bearer JWT қолдана алады. ADMIN барлық басқаруды орындайды. CHAIRMAN мүшелерді көреді, өтініштерді қарайды, жаңалықтар/іс-шараларды басқарады, статистиканы көреді. MEMBER тек өз профилі мен өтініштеріне қол жеткізеді. Ашық тіркелу жоқ.',
  },
  servers: [{ url: '/', description: 'Ағымдағы сервер' }],
  tags: [
    'Auth',
    'Members',
    'Applications',
    'News',
    'Documents',
    'Events',
    'Statistics',
    'Notifications',
    'Users',
    'Settings',
    'Files',
    'Public',
  ].map((name) => ({ name })),
  components: {
    securitySchemes: {
      CookieAuth: { type: 'apiKey', in: 'cookie', name: 'kasipodaq_session' },
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['success', 'message', 'errors'],
        properties: {
          success: { type: 'boolean', example: false },
          message: string,
          errors: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      Member: {
        type: 'object',
        properties: {
          id,
          userId: id,
          ...memberProperties,
          createdAt: dateTime,
          updatedAt: dateTime,
          user: ref('User'),
        },
      },
      User: {
        type: 'object',
        description: 'Пароль мен tokenVersion жауапқа кірмейді.',
        properties: {
          id,
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'CHAIRMAN', 'MEMBER'] },
          isActive: { type: 'boolean' },
          member: { ...ref('Member'), nullable: true },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      MemberCreate: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password', 'firstName', 'lastName', 'phone', 'position', 'department'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72, writeOnly: true },
          role: { type: 'string', enum: ['ADMIN', 'CHAIRMAN', 'MEMBER'], default: 'MEMBER' },
          ...memberProperties,
        },
      },
      MemberUpdate: {
        type: 'object',
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, writeOnly: true },
          role: { type: 'string', enum: ['ADMIN', 'CHAIRMAN', 'MEMBER'] },
          isActive: { type: 'boolean' },
          ...memberProperties,
        },
      },
      ApplicationInput: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'title', 'description'],
        properties: applicationProperties,
      },
      Application: {
        type: 'object',
        properties: {
          id,
          number: { type: 'integer' },
          memberId: id,
          ...applicationProperties,
          status: {
            type: 'string',
            enum: ['NEW', 'IN_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'COMPLETED'],
          },
          member: ref('Member'),
          comments: { type: 'array', items: ref('Comment') },
          history: { type: 'array', items: ref('StatusHistory') },
          attachments: { type: 'array', items: ref('File') },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id,
          applicationId: id,
          userId: id,
          text: string,
          user: ref('User'),
          createdAt: dateTime,
        },
      },
      StatusHistory: {
        type: 'object',
        properties: {
          id,
          applicationId: id,
          oldStatus: nullableString,
          newStatus: string,
          changedBy: id,
          user: ref('User'),
          createdAt: dateTime,
        },
      },
      File: {
        type: 'object',
        properties: {
          id,
          applicationId: id,
          fileUrl: string,
          fileName: string,
          fileType: string,
          fileSize: { type: 'integer', maximum: 10485760 },
          uploadedBy: id,
          createdAt: dateTime,
        },
      },
      NewsInput: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'shortDescription', 'content'],
        properties: newsProperties,
      },
      News: {
        type: 'object',
        properties: {
          id,
          ...newsProperties,
          authorId: id,
          author: ref('User'),
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      Document: {
        type: 'object',
        properties: {
          id,
          ...docProperties,
          fileUrl: string,
          fileName: string,
          fileSize: { type: 'integer' },
          fileType: string,
          uploadedBy: id,
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      EventInput: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'organizer'],
        properties: eventProperties,
      },
      Event: {
        type: 'object',
        properties: {
          id,
          ...eventProperties,
          participants: { type: 'integer' },
          isParticipating: { type: 'boolean' },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      ChartPoint: { type: 'object', properties: { name: string, value: { type: 'integer' } } },
      Statistics: {
        type: 'object',
        properties: {
          members: { type: 'integer' },
          activeMembers: { type: 'integer' },
          activeApplications: { type: 'integer' },
          approvedApplications: { type: 'integer' },
          news: { type: 'integer' },
          documents: { type: 'integer' },
          events: { type: 'integer' },
          memberTrend: { type: 'array', items: ref('ChartPoint') },
          applicationTrend: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: string,
                total: { type: 'integer' },
                approved: { type: 'integer' },
              },
            },
          },
          applicationTypes: { type: 'array', items: ref('ChartPoint') },
          applicationStatuses: { type: 'array', items: ref('ChartPoint') },
          eventTrend: { type: 'array', items: ref('ChartPoint') },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id,
          userId: id,
          title: string,
          message: string,
          type: string,
          link: nullableString,
          isRead: { type: 'boolean' },
          createdAt: dateTime,
        },
      },
      Settings: {
        type: 'object',
        additionalProperties: false,
        required: Object.keys(settingsProperties),
        properties: settingsProperties,
      },
      PublicSettings: {
        type: 'object',
        properties: { ...settingsProperties, heroImage: { type: 'string', readOnly: true } },
      },
    },
  },
  paths: {
    '/api/openapi.json': {
      get: {
        tags: ['Public'],
        summary: 'OpenAPI 3.0.3 schema',
        security: [],
        responses: {
          '200': {
            description: 'OpenAPI құжаты стандартты schema форматында беріледі.',
            content: {
              'application/json': { schema: { type: 'object', additionalProperties: true } },
            },
          },
        },
      },
    },
    '/api/health': {
      get: op(
        'Public',
        'Сервер мен дерекқордың жұмысын тексеру',
        { type: 'object', additionalProperties: true },
        { security: [] },
      ),
    },
    '/api/public/overview': {
      get: op(
        'Public',
        'Жария мүшелер/өтініштер/құжаттар/іс-шаралар саны',
        { type: 'object', additionalProperties: { type: 'integer' } },
        { security: [] },
      ),
    },
    '/api/auth/login': {
      post: op(
        'Auth',
        'Email және пароль арқылы кіру',
        { type: 'object', properties: { user: ref('User') } },
        {
          security: [],
          requestBody: body({
            type: 'object',
            additionalProperties: false,
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', writeOnly: true },
            },
          }),
          description:
            '8 сағаттық JWT HttpOnly cookie орнатылады. Бір IP үшін 15 минутта 15 кіру әрекеті.',
        },
      ),
    },
    '/api/auth/me': { get: op('Auth', 'Ағымдағы қолданушы мен жеке профилі', ref('User')) },
    '/api/auth/logout': {
      post: op('Auth', 'Шығу және барлық бұрынғы JWT сессияларын жарамсыз ету', { nullable: true }),
    },
    '/api/auth/register': {
      post: op('Auth', 'ADMIN жаңа қолданушы мен мүшені тіркейді', ref('User'), {
        requestBody: body(ref('MemberCreate')),
        responses: { ...response(ref('User'), '201'), ...errors },
      }),
    },
    '/api/auth/profile': {
      patch: op('Auth', 'Өз аты-жөнін, телефонын немесе фотосын өзгерту', ref('User'), {
        requestBody: body({
          type: 'object',
          additionalProperties: false,
          properties: {
            firstName: string,
            lastName: string,
            middleName: nullableString,
            phone: string,
            avatar: nullableString,
          },
        }),
      }),
    },
    '/api/auth/password': {
      post: op('Auth', 'Өз паролін өзгерту және басқа сессияларын тоқтату', ref('User'), {
        requestBody: body({
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', writeOnly: true },
            newPassword: { type: 'string', minLength: 8, writeOnly: true },
          },
        }),
      }),
    },
    '/api/members': {
      get: op('Members', 'ADMIN/CHAIRMAN мүшелерді іздеу және сүзгілеу', page('Member'), {
        parameters: [
          ...listParams,
          query('department'),
          query('position'),
          query('status', memberProperties.status),
        ],
      }),
      post: op('Members', 'ADMIN жаңа мүше қосады', ref('Member'), {
        requestBody: body(ref('MemberCreate')),
        responses: { ...response(ref('Member'), '201'), ...errors },
      }),
    },
    '/api/members/{id}': {
      get: op('Members', 'ADMIN/CHAIRMAN мүшенің жеке дерегін көреді', ref('Member'), {
        parameters: [identifier()],
      }),
      put: op('Members', 'ADMIN мүшені, рөлін немесе белсенділігін өзгертеді', ref('Member'), {
        parameters: [identifier()],
        requestBody: body(ref('MemberUpdate')),
      }),
      delete: op(
        'Members',
        'ADMIN мүшені жояды; өтініші бар мүшеде 409',
        { nullable: true },
        { parameters: [identifier()] },
      ),
    },
    '/api/applications': {
      get: op(
        'Applications',
        'Өтініштер: MEMBER тек өзінікін, қызметкерлер барлығын көреді',
        page('Application'),
        {
          parameters: [
            ...listParams,
            query('status', {
              type: 'string',
              enum: ['NEW', 'IN_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'COMPLETED'],
            }),
            query('type', applicationProperties.type),
          ],
        },
      ),
      post: op('Applications', 'Белсенді мүше жаңа өтініш береді', ref('Application'), {
        description: uploadDescription,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: ref('ApplicationInput') },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['type', 'title', 'description'],
                properties: { ...applicationProperties, file: binary },
              },
            },
          },
        },
        responses: { ...response(ref('Application'), '201'), ...errors },
      }),
    },
    '/api/applications/{id}': {
      get: op(
        'Applications',
        'Өтініш, пікірлер, тіркемелер және мәртебе тарихы',
        ref('Application'),
        { parameters: [identifier()] },
      ),
      put: op(
        'Applications',
        'Өтінішті өзгерту; MEMBER үшін тек NEW/NEEDS_INFO',
        ref('Application'),
        {
          parameters: [identifier()],
          requestBody: body({
            type: 'object',
            additionalProperties: false,
            properties: applicationProperties,
          }),
        },
      ),
      delete: op(
        'Applications',
        'ADMIN өтінішті және оның тіркемелерін жояды',
        { nullable: true },
        { parameters: [identifier()] },
      ),
    },
    '/api/applications/{id}/comments': {
      post: op(
        'Applications',
        'Өтініш иесі немесе ADMIN/CHAIRMAN пікір/жауап қосады',
        ref('Comment'),
        {
          parameters: [identifier()],
          requestBody: body({
            type: 'object',
            required: ['text'],
            properties: { text: { type: 'string', minLength: 1, maxLength: 5000 } },
          }),
          responses: { ...response(ref('Comment'), '201'), ...errors },
        },
      ),
    },
    '/api/applications/{id}/status': {
      post: op(
        'Applications',
        'ADMIN/CHAIRMAN мәртебені өзгертеді, тарих пен хабарлама сақталады',
        ref('Application'),
        {
          parameters: [identifier()],
          requestBody: body({
            type: 'object',
            required: ['status'],
            properties: {
              status: {
                type: 'string',
                enum: ['NEW', 'IN_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'COMPLETED'],
              },
              comment: { type: 'string', maxLength: 5000 },
            },
          }),
        },
      ),
    },
    '/api/applications/{id}/attachments': {
      post: op('Applications', 'Өтінішке қауіпсіз файл қосу', ref('File'), {
        description: uploadDescription,
        parameters: [identifier()],
        requestBody: body(
          { type: 'object', required: ['file'], properties: { file: binary } },
          true,
        ),
        responses: { ...response(ref('File'), '201'), ...errors },
      }),
    },
    '/api/news': {
      get: op('News', 'Жария жаңалықтар; ADMIN/CHAIRMAN draft көре алады', page('News'), {
        security: [],
        parameters: [
          ...listParams,
          query('status', { type: 'string', enum: ['DRAFT', 'PUBLISHED'] }),
        ],
      }),
      post: op('News', 'ADMIN/CHAIRMAN жаңалық қосады', ref('News'), {
        requestBody: body(ref('NewsInput')),
        responses: { ...response(ref('News'), '201'), ...errors },
      }),
    },
    '/api/news/{slugOrId}': {
      get: op('News', 'SEO slug бойынша толық жаңалық', ref('News'), {
        security: [],
        parameters: [identifier('slugOrId')],
        description: 'GET параметрі — slug. Draft жаңалықты тек ADMIN және CHAIRMAN көреді.',
      }),
      put: op('News', 'ADMIN/CHAIRMAN жаңалықты өңдейді', ref('News'), {
        description: 'PUT параметрі — жаңалықтың id мәні.',
        parameters: [identifier('slugOrId')],
        requestBody: body(ref('NewsInput')),
      }),
      delete: op(
        'News',
        'ADMIN/CHAIRMAN жаңалықты жояды',
        { nullable: true },
        {
          description: 'DELETE параметрі — жаңалықтың id мәні.',
          parameters: [identifier('slugOrId')],
        },
      ),
    },
    '/api/documents': {
      get: op(
        'Documents',
        'Жария құжаттарды іздеу және категория бойынша сүзгілеу',
        page('Document'),
        { security: [], parameters: [...listParams, query('category', docProperties.category)] },
      ),
      post: op('Documents', 'ADMIN қауіпсіз құжат жүктейді', ref('Document'), {
        description: uploadDescription,
        requestBody: body(
          {
            type: 'object',
            required: ['title', 'description', 'category', 'file'],
            properties: { ...docProperties, file: binary },
          },
          true,
        ),
        responses: { ...response(ref('Document'), '201'), ...errors },
      }),
    },
    '/api/documents/{id}': {
      get: op('Documents', 'Құжат метадерегі', ref('Document'), {
        security: [],
        parameters: [identifier()],
      }),
      put: op(
        'Documents',
        'ADMIN құжат метадерегін және қажет болса файлын өзгертеді',
        ref('Document'),
        {
          parameters: [identifier()],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'category'],
                  properties: docProperties,
                },
              },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'category'],
                  properties: { ...docProperties, file: binary },
                },
              },
            },
          },
        },
      ),
      delete: op(
        'Documents',
        'ADMIN құжат пен сақталған файлын жояды',
        { nullable: true },
        { parameters: [identifier()] },
      ),
    },
    '/api/documents/{id}/file': {
      get: {
        tags: ['Documents'],
        summary: 'PDF көру немесе құжатты жүктеу',
        security: [],
        parameters: [identifier(), query('download', { type: 'string', enum: ['1'] })],
        responses: fileResponse,
      },
    },
    '/api/events': {
      get: op('Events', 'Алдағы және өткен іс-шараларды көру', page('Event'), {
        security: [],
        parameters: [...listParams, query('status', eventProperties.status)],
      }),
      post: op('Events', 'ADMIN/CHAIRMAN іс-шара қосады', ref('Event'), {
        requestBody: body(ref('EventInput')),
        responses: { ...response(ref('Event'), '201'), ...errors },
      }),
    },
    '/api/events/{id}': {
      get: op('Events', 'Іс-шараның толық мәліметі', ref('Event'), {
        security: [],
        parameters: [identifier()],
      }),
      put: op('Events', 'ADMIN/CHAIRMAN іс-шараны өзгертеді', ref('Event'), {
        parameters: [identifier()],
        requestBody: body(ref('EventInput')),
      }),
      delete: op(
        'Events',
        'ADMIN/CHAIRMAN іс-шараны жояды',
        { nullable: true },
        { parameters: [identifier()] },
      ),
    },
    '/api/events/{id}/participate': {
      post: op('Events', 'Белсенді мүше алдағы іс-шараға тіркеледі', ref('Event'), {
        parameters: [identifier()],
      }),
      delete: op('Events', 'Іс-шараға қатысудан бас тарту', ref('Event'), {
        parameters: [identifier()],
      }),
    },
    '/api/statistics/overview': {
      get: op(
        'Statistics',
        'ADMIN/CHAIRMAN нақты DB статистикасы және графиктер',
        ref('Statistics'),
        {
          parameters: [
            query('days', { type: 'integer', enum: [7, 30, 90, 180, 365], default: 180 }),
          ],
        },
      ),
    },
    '/api/statistics/members': {
      get: op(
        'Statistics',
        'Мүшелер динамикасы',
        {
          type: 'object',
          properties: { memberTrend: { type: 'array', items: ref('ChartPoint') } },
        },
        { parameters: [query('days', { type: 'integer', enum: [7, 30, 90, 180, 365] })] },
      ),
    },
    '/api/statistics/applications': {
      get: op(
        'Statistics',
        'Өтініш түрлері, мәртебелері және динамикасы',
        { type: 'object', additionalProperties: true },
        { parameters: [query('days', { type: 'integer', enum: [7, 30, 90, 180, 365] })] },
      ),
    },
    '/api/statistics/events': {
      get: op(
        'Statistics',
        'Іс-шаралар динамикасы',
        { type: 'object', properties: { eventTrend: { type: 'array', items: ref('ChartPoint') } } },
        { parameters: [query('days', { type: 'integer', enum: [7, 30, 90, 180, 365] })] },
      ),
    },
    '/api/notifications': {
      get: op(
        'Notifications',
        'Тек өзінің хабарламалары және оқылмаған саны',
        {
          type: 'object',
          properties: { ...page('Notification').properties, unreadCount: { type: 'integer' } },
        },
        { parameters: listParams },
      ),
    },
    '/api/notifications/{id}/read': {
      put: op('Notifications', 'Өз хабарламасын оқылды деп белгілеу', ref('Notification'), {
        parameters: [identifier()],
      }),
    },
    '/api/notifications/read-all': {
      put: op('Notifications', 'Барлық өз хабарламаларын оқылды деп белгілеу', {
        type: 'object',
        properties: { count: { type: 'integer' } },
      }),
    },
    '/api/users': {
      get: op('Users', 'ADMIN қолданушылар мен рөлдерді көреді', page('User'), {
        parameters: listParams,
      }),
    },
    '/api/users/{id}': {
      put: op('Users', 'ADMIN рөлді немесе есептік жазба белсенділігін өзгертеді', ref('User'), {
        parameters: [identifier()],
        description: 'Өз рөлін/белсенділігін өзгерту және соңғы белсенді ADMIN-ді өшіру қорғалған.',
        requestBody: body({
          type: 'object',
          additionalProperties: false,
          properties: {
            role: { type: 'string', enum: ['ADMIN', 'CHAIRMAN', 'MEMBER'] },
            isActive: { type: 'boolean' },
          },
        }),
      }),
    },
    '/api/settings': {
      get: op('Settings', 'Ұйымның жария байланыс мәліметтері', ref('PublicSettings'), {
        security: [],
      }),
      put: op('Settings', 'ADMIN жүйе баптауларын өзгертеді', ref('Settings'), {
        requestBody: body(ref('Settings')),
      }),
    },
    '/api/uploads': {
      post: op('Files', 'Қауіпсіз JPG/PNG суретін жүктеу', ref('File'), {
        description:
          'Ең көбі 10 МБ. Жүктелген сурет URL-ін news/event/profile өрісіне сақтаңыз. MEMBER тек өз avatar суретін жүктейді.',
        requestBody: body(
          { type: 'object', required: ['file'], properties: { file: binary } },
          true,
        ),
        responses: { ...response(ref('File'), '201'), ...errors },
      }),
    },
    '/api/uploads/{filename}': {
      get: {
        tags: ['Files'],
        summary: 'Ресурсқа байланысқан файлды ownership тексеріп беру',
        security: [],
        parameters: [identifier('filename'), query('download', { type: 'string', enum: ['1'] })],
        responses: fileResponse,
      },
    },
    '/api/assets/{filename}': {
      get: {
        tags: ['Files'],
        summary: 'Жария контентте қолданылатын seed суретін беру',
        security: [],
        parameters: [identifier('filename')],
        responses: fileResponse,
      },
    },
  },
};

export default openApiSpec;
