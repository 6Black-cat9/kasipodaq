# КӘСІПОДАҚ

Қазақстандағы мектеп кәсіподағына арналған қазақ тіліндегі толық веб-платформа. React клиенті нақты Express API-мен жұмыс істейді; қолданушылар, өтініштер, жаңалықтар, құжаттар, іс-шаралар және хабарламалар PostgreSQL дерекқорында сақталады. Статистика дерекқордағы жазбалардан есептеледі.

## Мүмкіндіктер

- Ашық басты бет, жаңалықтар мен олардың толық беттері, категория бойынша құжаттар және іс-шаралар.
- JWT сессия, bcrypt парольдері, `ADMIN`, `CHAIRMAN`, `MEMBER` рөлдері және серверде тексерілетін рұқсаттар.
- Мүшенің жеке кабинеті, профиль/фото/пароль өзгерту, өз өтініштері, файл тіркеу, пікірлер және мәртебе тарихы.
- Мүшелерді басқару: іздеу, бөлім/қызмет/статус сүзгілері, пагинация, қосу, өңдеу және жою.
- Өтініштерді қарау: алты мәртебе, комитет жауабы, файл қосу және автоматты хабарлама.
- Жаңалықтар CRUD, SEO slug, draft/published және жариялау хабарламалары.
- PDF көру, файл жүктеу; құжаттар, жаңалықтар мен іс-шараларды басқару.
- Іс-шараға тіркелу және қатысудан бас тарту; қатысушылардың саны.
- Әкімшілік dashboard, бес статистика графигі, кезең сүзгісі, қолданушылар/рөлдер және жүйе баптаулары.
- Қазақы нәзік өрнек, қою жасыл/алтын палитра, responsive интерфейс, keyboard focus, loading/empty/error күйлері және жоюды растау.

## Технологиялар

| Қабат       | Құралдар                                                                |
| ----------- | ----------------------------------------------------------------------- |
| Клиент      | React, Vite, TypeScript strict, Tailwind CSS, SCSS, React Router, Axios |
| Интерфейс   | Lucide React, Recharts, React Hook Form, Zod, Framer Motion             |
| Сервер      | Node.js, Express, TypeScript strict, REST API                           |
| Деректер    | PostgreSQL, Prisma ORM, migration және seed                             |
| Қауіпсіздік | JWT, bcrypt, Helmet, CORS, rate limiting, Zod, ownership/RBAC           |
| Тексеру     | Vitest, Supertest, жеке PostgreSQL тест дерекқоры, ESLint, Prettier     |
| Орналастыру | Dockerfile, Docker Compose, production SPA serving, OpenAPI/Swagger     |

## Қажетті орта

Node.js **22 немесе жаңарақ**, npm **10+**, PostgreSQL **16+**. Docker нұсқасы үшін Docker Engine және Compose v2 қажет. PostgreSQL қызметі жұмыс істеп тұруы керек. Python немесе сыртқы сурет қызметі қолданбаны іске қосу үшін қажет емес: демо суреттер мен қазақ тіліндегі PDF құжаттар репозиторийге енгізілген.

## Жергілікті орнату

Жоба түбірінде:

```bash
npm ci
cp server/.env.example server/.env
```

`server/.env` ішінде дерекқор парольдерін және кездейсоқ JWT құпиясын орнатыңыз. JWT үшін жеке кездейсоқ мән жасаңыз:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Осы команданың нәтижесін `JWT_SECRET` орнына қойыңыз. `.env` файлдары Git-ке және Docker build context-іне кірмейді.

## Environment variables

Жергілікті API `server/.env` файлын оқиды. Клиент салыстырмалы `/api` мекенжайларын қолданады және Vite development proxy арқылы API-ге қосылады.

| Айнымалы            | Мәні/мақсаты                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL қосылымы: `postgresql://USER:PASSWORD@localhost:5432/kasipodaq?schema=public`             |
| `TEST_DATABASE_URL` | Тек тестке арналған **бөлек** `kasipodaq_test` дерекқоры                                             |
| `JWT_SECRET`        | Кемінде 32 таңбалы кездейсоқ құпия                                                                   |
| `PORT`              | API порты, әдетте `4000`                                                                             |
| `CLIENT_URL`        | Рұқсат етілген браузер origin; development: `http://localhost:5173`; бірнеше origin үтірмен бөлінеді |
| `UPLOAD_DIR`        | Файл сақтау каталогы; server жұмыс каталогына қатысты `uploads` немесе абсолютті жол                 |
| `NODE_ENV`          | `development`, `test`, `production`                                                                  |
| `TRUST_PROXY`       | Сенімді reverse proxy артында ғана `1`; әдетте берілмейді                                            |
| `SEED_DEMO`         | Production режимінде демо орнатуды саналы түрде қосу үшін `true`; әдетте `false`                     |

Docker Compose жоба түбіріндегі `.env` файлын пайдаланады: үлгісі [.env.example](./.env.example). Онда `POSTGRES_PASSWORD`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `SEED_DEMO` орнатылады. Парольдегі URL арнайы таңбаларын `DATABASE_URL` ішінде percent-encoding арқылы беріңіз.

## PostgreSQL дайындау

Дерекқор әкімшісі ретінде `psql` ішінде орындаңыз; мысалдағы парольді өзіңіз жасаған құпиямен ауыстырыңыз:

```sql
CREATE ROLE kasipodaq WITH LOGIN PASSWORD 'өз-күрделі-пароліңіз' CREATEDB;
CREATE DATABASE kasipodaq OWNER kasipodaq;
CREATE DATABASE kasipodaq_test OWNER kasipodaq;
```

`CREATEDB` әзірлеудегі `prisma migrate dev` shadow database үшін қажет. Production рөліне бұл рұқсат қажет емес; онда дайын migration-дар `migrate deploy` арқылы қолданылады.

## Migration және seed

Дайын migration репозиторийде бар. Жаңа базаны орнату:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

Schema-ны өзгерткен әзірлеуші жаңа migration жасайды:

```bash
npm run db:migrate -- --name describe_change
```

Seed **16 мүше**, **10 өтініш**, **5 жаңалық**, **5 PDF құжат**, **5 іс-шара**, қатысушылар, хабарламалар және ұйым баптауларын береді. Демо деректер қазақ тілінде. Өтініштерде барлық алты мәртебе, тарих пен пікірлер бар. Seed asset-терді `server/prisma/assets` каталогынан `UPLOAD_DIR` ішіне көшіреді. Қайта орындау бар деректерді немесе өзгертілген парольдерді ауыстырмайды және жазбаларды жоймайды.

Production режимінде seed әдетте өшірулі; тек демо ортада `SEED_DEMO=true` оны қосады. Нақты production қолдануда барлық демо парольдерін өзгертіңіз және demo есептік жазбаларын тексеріңіз.

## Development іске қосу

Екі бөлікті қатар іске қосу:

```bash
npm run dev
```

Бөлек терминалдарда:

```bash
npm run dev -w server
```

```bash
npm run dev -w client
```

- Сайт: <http://localhost:5173>
- API: <http://localhost:4000/api>
- Swagger: <http://localhost:4000/api-docs>
- OpenAPI JSON: <http://localhost:4000/api/openapi.json>
- Health: <http://localhost:4000/api/health>

## Демо кіру

| Рөл      | Email                  | Development паролі |
| -------- | ---------------------- | ------------------ |
| ADMIN    | `admin@example.com`    | `Dev@12345!`       |
| CHAIRMAN | `chairman@example.com` | `Dev@12345!`       |
| MEMBER   | `member@example.com`   | `Dev@12345!`       |

Қалған demo мүшелерде де осы бастапқы development паролі қолданылады. Парольді профиль бетінен өзгертуге болады. **Нақты production ортада demo парольдерін міндетті түрде өзгертіңіз.** Ашық тіркелу жоқ: жаңа мүшені немесе қолданушыны ADMIN қосады.

## Production build және іске қосу

```bash
npm ci
npm run db:generate
npm run db:deploy
npm run build
npm start
```

`npm start` production серверді іске қосады; `server/.env` ішінде `NODE_ENV=production`, нақты `CLIENT_URL`, қауіпсіз JWT құпиясы және production дерекқорын орнатыңыз. Express клиенттің `client/dist` build-ын да береді. Production сайтты HTTPS reverse proxy арқылы орналастырыңыз: сессия cookie-і `Secure` болады. Файлдар мен дерекқордың сақтық көшірмесін жүргізіңіз.

Docker Compose:

```bash
cp .env.example .env
# .env ішіндегі екі құпияны және CLIENT_URL мәнін орнатыңыз.
docker compose up --build -d
```

Migration app контейнері басталғанда автоматты түрде орындалады. PostgreSQL және uploads volume-дары тұрақты сақталады. Демо орнату үшін ғана `.env` ішінде `SEED_DEMO=true` қосыңыз. Толық орналастыру және backup нұсқаулығы: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## API келісімі

Сәтті жауап:

```json
{ "success": true, "message": "Сәтті орындалды", "data": {} }
```

Қате:

```json
{ "success": false, "message": "Өрістерді тексеріңіз", "errors": [] }
```

Тізім: `data = { items, total, page, pageSize }`. Іздеу `q`, пагинация `page`/`pageSize`, модуль сүзгілері query арқылы беріледі. Мүшелер мен өтініштердің жеке деректері серверде қорғалған; MEMBER барлық мүшелер тізімін немесе басқа мүшенің өтінішін ала алмайды. Auth/login HttpOnly cookie орнатады; Axios `withCredentials: true` қолданады. Қосымша REST клиенттері Bearer JWT-ді де қолдана алады.

Толық endpoint кестелері мен сұрау мысалдары: [docs/API.md](./docs/API.md). Интерактивті OpenAPI: `/api-docs`.

## Тесттер және код сапасы

`TEST_DATABASE_URL` `DATABASE_URL`-ден бөлек PostgreSQL дерекқорын көрсетуі керек. Тесттер жеке кездейсоқ schema жасайды, сол schema-ға дайын migration қолданады және аяқталған соң тек өз schema-сы мен уақытша upload каталогын жояды. Development деректеріне өзгеріс жасалмайды.

```bash
npm test
npm run lint
npm run build
```

Integration тесттері нақты PostgreSQL мен Express арқылы кіруді, bcrypt сақтауын, мүшені жасауды, материалдық көмек validation-ын, өтінішті жасауды, статус тарихы мен хабарламаларды, рөлдік рұқсаттарды, draft жаңалықтардың құпиялығын, іс-шараға тіркелуді, файлдардың MIME/сигнатура/көлемін, жеке файлдар мен avatar ownership-ын, статистика санағын және JWT сессияларын тоқтатуды тексереді.

Форматтау:

```bash
npm run format
```

## Жоба құрылымы

```text
kasipodaq/
├── client/                    React/Vite клиенті
│   └── src/
│       ├── api/               Axios және ортақ API келісімі
│       ├── components/        Қайта қолданылатын UI
│       ├── context/           Сессия және хабарламалар
│       ├── layouts/           Public/admin/member layout
│       ├── pages/             Маршрут беттері
│       └── types/             Ортақ TypeScript типтері
├── server/
│   ├── prisma/
│   │   ├── schema.prisma      PostgreSQL моделдері мен байланыстары
│   │   ├── migrations/        Қайталанатын DB migration
│   │   ├── assets/            Seed суреттері және нақты PDF файлдар
│   │   └── seed.ts            Деректі сақтайтын idempotent seed
│   ├── src/
│   │   ├── middleware/        Auth, рөлдер, validation
│   │   ├── routes/            Модульдік REST handlers
│   │   ├── services/          Статистика және UploadStorage
│   │   ├── utils/             Prisma, HTTP, пагинация, admin lock
│   │   ├── validators/        Zod schema-лар
│   │   ├── app.ts             Express құрамы және error handler
│   │   ├── index.ts           Сервер lifecycle
│   │   └── openapi.ts         Толық OpenAPI schema
│   ├── tests/                 PostgreSQL integration тесттері
│   └── uploads/               Runtime файлдар; Git-ке кірмейді
├── docs/                      Архитектура, API, қауіпсіздік, deployment
├── docker/                    Контейнер entrypoint
├── Dockerfile
├── docker-compose.yml
└── package.json               npm workspaces және ортақ командалар
```

Барлық source және конфигурация файлдарының нақты тізімі: [docs/FILE_TREE.md](./docs/FILE_TREE.md). Архитектура және рөл келісімі: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Файлдар мен қауіпсіздік

Жүктеу шегі — **10 МБ**, бір сұрауда бір файл. PDF, DOC, DOCX, XLS, XLSX, JPG/JPEG және PNG үшін кеңейтім, MIME және файл мазмұны тексеріледі. Жеке файлдар жалпы static каталог арқылы берілмейді: API ownership/RBAC тексереді. Сервер UUID файл атауларын жасайды. `UploadStorage` интерфейсін S3/Cloudinary adapter-іне ауыстыруға болады; қазір `LocalUploadStorage` толық жұмыс істейді.

Пароль hash-тері және JWT құпиялары API-ге шықпайды. Сессия 8 сағат, HttpOnly/SameSite; logout, пароль/рөл өзгерісі немесе бұғаттау бұрынғы сессияларды жарамсыз етеді. Zod күтпеген өрістерді қабылдамайды, Prisma параметрленген SQL қолданады, React мәтінді HTML ретінде орындамайды. Соңғы ADMIN-ді жою/төмендету, қатарлас әкімші өзгерістері және жеке файл сілтемелерін теріс пайдалану серверде қорғалған. Толық сипаттама: [docs/SECURITY.md](./docs/SECURITY.md).

Демо фотосуреттер [Unsplash](https://unsplash.com/) ашық photo URL-дерінен жүктеліп, жергілікті seed asset ретінде сақталған. PDF құжаттар — қазақ тіліндегі оқу мақсатындағы демо материалдар; нақты мектептің ресми құжаттарын ADMIN құжаттар бөлімінен жүктейді.

Тексерудің нақты нәтижелері: [docs/VERIFICATION.md](./docs/VERIFICATION.md).
