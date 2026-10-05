# КӘСІПОДАҚ архитектурасы

React/Vite клиенті → Express REST API → Prisma → PostgreSQL. Express production режимінде client/dist файлын да береді. /api-docs — OpenAPI. Файлдар UploadStorage арқылы сервердің қорғалған uploads каталогында сақталады.

## API келісімі

Жауап: `{success:true,message:string,data:T}`. Тізім дерегі: `{items:T[],total:number,page:number,pageSize:number}`. Қате: `{success:false,message:string,errors:unknown[]}`.

Сессия HttpOnly cookie-де; JWT API тесттері үшін Bearer ретінде де қабылданады. Auth/me data — User (password жоқ, member енгізілген). Auth/login data — `{user}`. Cookie Axios withCredentials=true.

Тізімдер q, page, pageSize query қабылдайды. Мүшелер: department, position, status. Өтініштер: status, type. News: status (әкімші), q. Documents: category,q. Events: status. Statistics: days=7|30|90|180|365. `GET /api/public/overview` — жария aggregate counters.

## Рөлдер

ADMIN — барлық басқару; CHAIRMAN — мүшелерді көру, өтініштерді қарау, жаңалықтар/іс-шаралар CRUD және статистика; MEMBER — өз профилі және өтініштері. Құжат өзгерту, мүшелерді өзгерту, қолданушылар және баптаулар — ADMIN. Тіркелу endpoint-і ADMIN ғана, ашық self-register жоқ.

## Route экспорттары

server/src/routes/auth.ts: authRouter, members.ts: membersRouter, applications.ts: applicationsRouter. content.ts: newsRouter, documentsRouter, eventsRouter, statisticsRouter, notificationsRouter, usersRouter, settingsRouter, publicRouter, uploadsRouter.

## Қауіпсіздік

Әр қорғалған сұрау JWT-мен бірге дерекқордағы isActive/tokenVersion тексереді. Cookie жазу сұрауларында Origin allowlist тексеріледі. Әр жеке ресурс серверде ownership тексереді. Құпия upload жария static арқылы берілмейді. HTML контент JSX text ретінде көрсетіледі. Файл көлемі 10MB; extension, MIME және magic signature сәйкестігі тексеріледі.
