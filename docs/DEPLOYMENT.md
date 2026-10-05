# Орнату және орналастыру

## Жергілікті орта

Node.js 22+, npm және PostgreSQL 16+ қажет. Жоба түбірінде `npm ci` орындаңыз.
`server/.env.example` файлын `server/.env` етіп көшіріп, дерекқор URL-дерін және
кемінде 32 таңбалы кездейсоқ `JWT_SECRET` мәнін орнатыңыз. `.env` файлдары Git-ке
қосылмайды.

Дерекқор әкімшісі ретінде екі бөлек дерекқор жасаңыз:

```sql
CREATE ROLE kasipodaq WITH LOGIN PASSWORD 'сіздің-күрделі-пароліңіз' CREATEDB;
CREATE DATABASE kasipodaq OWNER kasipodaq;
CREATE DATABASE kasipodaq_test OWNER kasipodaq;
```

Тек әзірлеу үшін `CREATEDB` қажет: `prisma migrate dev` уақытша shadow database
жасайды. Production рөліне `CREATEDB` берудің қажеті жоқ; production ортада
`prisma migrate deploy` қолданылады. `TEST_DATABASE_URL` production дерекқорын
көрсетпеуі керек.

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Frontend: `http://localhost:5173`, API: `http://localhost:4000/api`,
API құжаттамасы: `http://localhost:4000/api-docs`.

## Docker Compose

Docker Engine және Docker Compose v2 қажет. Жоба түбірінде:

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Жасалған кездейсоқ мәнді `.env` ішіндегі `JWT_SECRET` орнына қойыңыз. Дерекқор
паролі үшін басқа кездейсоқ мән жасаңыз және `POSTGRES_PASSWORD` орнатыңыз.
`CLIENT_URL` мәнін браузердегі сайттың нақты URL мекенжайына теңестіріңіз.

```bash
docker compose up --build -d
docker compose ps
```

Бүкіл сайт және API бір мекенжайда іске қосылады: `http://localhost:4000`.
Қосымша жүктелмес бұрын migration автоматты түрде орындалады. Жаңа production
базасына демо есептік жазбалар қосылмайды. Демо орнату үшін ғана `.env` ішінде
`SEED_DEMO=true` орнатыңыз; алғашқы орнатудан кейін оны `false` етіп өзгертіңіз.
PostgreSQL мен жүктелген файлдар Docker volumes ішінде сақталады.

Жергілікті PostgreSQL 5432 портын қолданып тұрса, Compose ішіндегі `db.ports`
жолын алып тастаңыз: қосымша базаға Docker ішкі желісі арқылы қосылады.
Дерекқорға сыртқы қосылым қажет болмаса, production орналастыруда да осы жолды
алып тастауға болады.

```bash
docker compose logs --tail=100 app
docker compose exec app npm exec -- prisma migrate status
docker compose stop
docker compose start
```

`docker compose down` деректерді сақтайды. `docker compose down -v` барлық volume
деректерін жояды; оны деректерді әдейі жою кезінде ғана пайдаланыңыз.
Production орнатуда demo парольдерін өзгертіңіз және HTTPS reverse proxy
(мысалы Caddy немесе Nginx) арқылы сайтты жариялаңыз.

## Басқарылатын cloud ортадағы build

Кейбір cloud орталар HTTPS proxy үшін арнайы CA сертификатын қажет етеді.
Dockerfile сертификатты image ішінде сақтамайтын optional BuildKit secret
қолданады. Осындай ортада:

```bash
docker build --secret "id=proxy_ca,src=$CODEX_PROXY_CERT" -t kasipodaq:latest .
```

Одан кейін сол image-ті Compose қосымшасына беру үшін:

```bash
docker tag kasipodaq:latest kasipodaq-app:latest
docker compose up -d --no-build
```

TLS тексеруі барлық build қадамдарында қосулы.

## Деректердің сақтық көшірмесі

```bash
docker compose exec -T db pg_dump -U kasipodaq -d kasipodaq > kasipodaq-backup.sql
docker compose exec -T db psql -U kasipodaq -d kasipodaq < kasipodaq-backup.sql
```

Дерекқор backup файлын және `uploads` volume мазмұнын қауіпсіз орында сақтаңыз.
Қалпына келтіру алдында қолданушылардың жазу операцияларын тоқтатыңыз.
