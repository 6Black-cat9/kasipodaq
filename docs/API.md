# REST API

Негізгі жол: `/api`. Интерактивті Swagger — `/api-docs`, машина оқитын OpenAPI 3.0.3 — `/api/openapi.json`. Барлық API response-тарда `success`, `message`, `data`; қателерде `success:false`, `message`, `errors` бар. Файл response-тары binary, OpenAPI JSON өзінің стандартты schema-сымен беріледі.

## Сессия және рөлдер

`POST /auth/login` email/парольді тексереді және `kasipodaq_session` HttpOnly cookie орнатады. Браузер клиенті credentials қосылған cookie қолданады. REST клиенті сол JWT-ді `Authorization: Bearer JWT` арқылы бере алады. Пароль мен `tokenVersion` жауапқа шықпайды.

`PUBLIC` — жүйеге кірмей оқуға болады. `AUTH` — кез келген белсенді аккаунт. `STAFF` — ADMIN немесе CHAIRMAN. `ADMIN` — тек ADMIN. Мүшенің өтінішіне қол жеткізу серверде жеке ownership арқылы тексеріледі.

| Әдіс   | Endpoint                        | Рұқсат         | Әрекет                                               |
| ------ | ------------------------------- | -------------- | ---------------------------------------------------- |
| GET    | `/health`                       | PUBLIC         | PostgreSQL қосылымымен health check                  |
| GET    | `/public/overview`              | PUBLIC         | Жария aggregate санағы                               |
| POST   | `/auth/login`                   | PUBLIC         | `{email,password}`; `data:{user}`                    |
| GET    | `/auth/me`                      | AUTH           | Өз user және member профилі                          |
| POST   | `/auth/logout`                  | AUTH           | Сессияны және бұрынғы JWT-лерді тоқтату              |
| POST   | `/auth/register`                | ADMIN          | Қолданушы және мүшелік жасау                         |
| PATCH  | `/auth/profile`                 | AUTH           | Өз аты-жөні/телефон/avatar                           |
| POST   | `/auth/password`                | AUTH           | `{currentPassword,newPassword}`                      |
| GET    | `/members`                      | STAFF          | Іздеу, сүзгі, пагинация                              |
| GET    | `/members/:id`                  | STAFF          | Жеке member деректері                                |
| POST   | `/members`                      | ADMIN          | Мүше және аккаунт қосу                               |
| PUT    | `/members/:id`                  | ADMIN          | Мүшені/аккаунтты өңдеу                               |
| DELETE | `/members/:id`                  | ADMIN          | Байланысты өтініші жоқ мүшені жою                    |
| GET    | `/applications`                 | AUTH           | MEMBER өзінікін; STAFF барлығын көреді               |
| GET    | `/applications/:id`             | Иесі/STAFF     | Толық өтініш, пікірлер, тарих, файлдар               |
| POST   | `/applications`                 | Белсенді мүше  | Өтініш беру; файл optional                           |
| PUT    | `/applications/:id`             | Иесі/STAFF     | MEMBER тек NEW/NEEDS_INFO кезінде                    |
| DELETE | `/applications/:id`             | ADMIN          | Өтініш және тіркемелерді жою                         |
| POST   | `/applications/:id/comments`    | Иесі/STAFF     | `{text}` пікір немесе жауап                          |
| POST   | `/applications/:id/status`      | STAFF          | `{status,comment?}`; тарих/хабарлама                 |
| POST   | `/applications/:id/attachments` | Иесі/STAFF     | multipart `file`; MEMBER тек editable статус         |
| GET    | `/news`                         | PUBLIC         | Тек жария; STAFF draft та көреді                     |
| GET    | `/news/:slug`                   | PUBLIC         | Slug бойынша толық жаңалық                           |
| POST   | `/news`                         | STAFF          | Жаңалық қосу                                         |
| PUT    | `/news/:id`                     | STAFF          | Жаңалық өңдеу                                        |
| DELETE | `/news/:id`                     | STAFF          | Жаңалық жою                                          |
| GET    | `/documents`                    | PUBLIC         | Құжаттар, category/q/пагинация                       |
| GET    | `/documents/:id`                | PUBLIC         | Құжат метадерегі                                     |
| GET    | `/documents/:id/file`           | PUBLIC         | Көру немесе `?download=1` жүктеу                     |
| POST   | `/documents`                    | ADMIN          | multipart metadata + file                            |
| PUT    | `/documents/:id`                | ADMIN          | JSON metadata немесе multipart жаңа файл             |
| DELETE | `/documents/:id`                | ADMIN          | Құжат пен файлды жою                                 |
| GET    | `/events`                       | PUBLIC         | Іс-шаралар, статус/іздеу/пагинация                   |
| GET    | `/events/:id`                   | PUBLIC         | Толық іс-шара және қатысушылар саны                  |
| POST   | `/events`                       | STAFF          | Іс-шара қосу                                         |
| PUT    | `/events/:id`                   | STAFF          | Іс-шара өңдеу                                        |
| DELETE | `/events/:id`                   | STAFF          | Іс-шара жою                                          |
| POST   | `/events/:id/participate`       | Белсенді мүше  | Алдағы іс-шараға idempotent тіркелу                  |
| DELETE | `/events/:id/participate`       | AUTH           | Өз тіркелуін жою                                     |
| GET    | `/statistics/overview`          | STAFF          | Санау және бес chart dataset                         |
| GET    | `/statistics/members`           | STAFF          | `memberTrend`                                        |
| GET    | `/statistics/applications`      | STAFF          | Trend/types/statuses                                 |
| GET    | `/statistics/events`            | STAFF          | `eventTrend`                                         |
| GET    | `/notifications`                | AUTH           | Өз хабарламалары және unreadCount                    |
| PUT    | `/notifications/:id/read`       | Иесі           | Бір хабарламаны оқылды белгілеу                      |
| PUT    | `/notifications/read-all`       | AUTH           | Өз хабарламалары; `data:{count}`                     |
| GET    | `/users`                        | ADMIN          | Қолданушылар, role/q сүзгісі                         |
| PUT    | `/users/:id`                    | ADMIN          | `{role?,isActive?}`                                  |
| GET    | `/settings`                     | PUBLIC         | Ұйым деректері, readonly heroImage                   |
| PUT    | `/settings`                     | ADMIN          | Алты ұйым байланыс өрісі                             |
| POST   | `/uploads`                      | AUTH           | multipart JPG/PNG `file`; owner сурет preview        |
| GET    | `/uploads/:filename`            | Ресурсқа қарай | Құжат public; өтініш owner/STAFF; avatar owner/STAFF |
| GET    | `/assets/:filename`             | PUBLIC         | Жария контентке байланысты seed суреті               |
| GET    | `/openapi.json`                 | PUBLIC         | OpenAPI schema                                       |

## Пагинация мен сүзгілер

Тізім query-лері: `q`, `page` (1-ден басталады), `pageSize` (1–100). Жауап `data:{items,total,page,pageSize}`. Notifications қосымша `unreadCount` береді. Бос сүзгі мәндері сүзгі жоқ ретінде қабылданады.

- Members: `department`, `position`, `status=ACTIVE|INACTIVE`.
- Applications: `type=MATERIAL|ONE_TIME|SOCIAL|OTHER`, `status=NEW|IN_REVIEW|NEEDS_INFO|APPROVED|REJECTED|COMPLETED`.
- News: `status=DRAFT|PUBLISHED`; draft query STAFF үшін ғана.
- Documents: `category=RULES|RESOLUTIONS|PROTOCOLS|ORDERS|REPORTS|REGULATIONS|OTHER`.
- Events: `status=UPCOMING|PAST|CANCELLED`.
- Users: `role=ADMIN|CHAIRMAN|MEMBER`.
- Statistics: `days=7|30|90|180|365`, default 180. Жалпы карточка санағы ағымдағы дерекқордан; chart dataset кезеңді ескереді.

## Негізгі request body-лар

Мүше жасау:

```json
{
  "email": "teacher@example.com",
  "password": "өз-күрделі-пароліңіз",
  "role": "MEMBER",
  "firstName": "Айнұр",
  "lastName": "Ахметова",
  "middleName": "Болатқызы",
  "phone": "+77011234567",
  "position": "Қазақ тілі мұғалімі",
  "department": "Қазақ тілі мен әдебиеті",
  "joinDate": "2026-10-05T00:00:00.000Z",
  "status": "ACTIVE"
}
```

Рөл, middleName, joinDate, status, avatar optional. PUT member partial қабылдайды және қосымша isActive/парольді өзгерте алады. Пароль кемінде 8 таңба, UTF-8 бойынша ең көбі 72 байт.

Өтініш:

```json
{
  "type": "MATERIAL",
  "title": "Емделуге материалдық көмек",
  "description": "Кәсіподақ комитетінен емделуге материалдық көмек көрсетуін сұраймын.",
  "amount": 50000
}
```

MATERIAL үшін оң amount міндетті; басқа түрлер үшін optional. Жауапта amount Decimal сериализациясына сәйкес string болуы мүмкін. Member ID клиенттен қабылданбайды: ағымдағы сессиядан алынады. NEW статус, бірінші тарих жазбасы және мүше/комитет хабарламалары бір транзакцияда жасалады. Multipart сұрауда осы өрістер және `file` жіберіледі.

Статус өзгерту:

```json
{ "status": "APPROVED", "comment": "Комитет өтінішіңізді мақұлдады." }
```

Өтініш, статус тарихы, optional пікір және хабарлама бір транзакцияда сақталады. Бірдей статус 400, қатар өзгерген статус 409 береді.

Жаңалық:

```json
{
  "title": "Ұстаздар күні құтты болсын!",
  "slug": "ustazdar-kuni",
  "shortDescription": "Барша ұстаздарды кәсіби мерекемен құттықтаймыз.",
  "content": "Құрметті әріптестер! Сіздерге зор денсаулық және шығармашылық табыс тілейміз.",
  "image": null,
  "status": "PUBLISHED",
  "notify": true
}
```

Slug берілмесе тақырыптан жасалады. Сурет алдымен POST /uploads арқылы жүктеліп, қайтқан fileUrl image өрісіне жазылады. Болашақ publishedAt берілген жаңалық жария API-ге күні келгенде шығады. Draft және болашақ жаңалықтар ADMIN/CHAIRMAN үшін ғана көрінеді. notify жариялау кезінде белсенді қолданушыларға notification жасайды.

Іс-шара:

```json
{
  "title": "Еңбек құқығы семинары",
  "description": "Мектеп қызметкерлеріне арналған еңбек құқығы бойынша ашық семинар.",
  "date": "2026-10-12",
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Мектептің акт залы",
  "organizer": "Кәсіподақ комитеті",
  "status": "UPCOMING",
  "image": null
}
```

Аяқталу уақыты басталуынан кейін болуы керек. Қатысушылар API-де сан ретінде беріледі; өзге қатысушылардың жеке userId тізімі жарияланбайды.

## Қауіпсіз upload

Document POST/PUT multipart өрістері: `title`, `description`, `category`, `file`. PUT жаңа file берілмесе тек metadata жаңартады. Application POST/attachments multipart өрісі — `file`. Generic POST /uploads — тек JPG/PNG.

PDF, DOC, DOCX, XLS, XLSX, JPG/JPEG, PNG; ең көбі 10 МБ. Кеңейтім, жарияланған MIME және magic signature тексеріледі. Сақталған файлдың server UUID атауы клиенттен келмейді. Жеке файлға URL білу рұқсат бермейді. GET /uploads ownership пен ресурстың жариялығын тексереді. DOC/XLS download түрінде, PDF/сурет inline немесе `?download=1` арқылы беріледі.

## Қателер

| Код | Мағына                                                                      |
| --- | --------------------------------------------------------------------------- |
| 400 | Zod validation, enum/файл/көлем/сома қателері, өзгермейтін статус           |
| 401 | Сессия жоқ, жарамсыз JWT, бұғатталған қолданушы, қате кіру                  |
| 403 | Рөл, Origin немесе жеке ресурс ownership рұқсаты жоқ                        |
| 404 | Жазба/файл жоқ немесе жария емес жаңалық                                    |
| 409 | Қайталанатын email/slug, байланысты жазба, параллель өзгеріс, admin lockout |
| 413 | JSON request body көлемі 1 МБ-тан асты                                      |
| 429 | API немесе кіру rate limit                                                  |
| 500 | Құпия мәліметсіз жалпы сервер қатесі                                        |

Техникалық stack trace, PostgreSQL ішкі қатесі, пароль және JWT құпиясы клиентке берілмейді. Барлық қорғалған жазулар үшін браузер Origin allowlist қолданылады. Өзгертілген рөл/пароль және бұғаттау бұрынғы сессияларды тоқтатады.
