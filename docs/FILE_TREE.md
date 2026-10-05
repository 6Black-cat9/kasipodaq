# Файлдардың толық құрылымы

Source, конфигурация, migration, тесттер және seed asset файлдары. Орнатылатын node_modules, build, runtime uploads және құпия .env файлдары тізімге кірмейді.

```text
kasipodaq/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Brand.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Notifications.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ui.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useApi.ts
│   │   ├── layouts/
│   │   │   ├── PublicLayout.tsx
│   │   │   └── WorkspaceLayout.tsx
│   │   ├── pages/
│   │   │   ├── ApplicationPages.tsx
│   │   │   ├── ContentAdminPages.tsx
│   │   │   ├── DashboardPages.tsx
│   │   │   ├── MemberPages.tsx
│   │   │   ├── PublicPages.tsx
│   │   │   ├── workspace.scss
│   │   │   ├── WorkspacePages.tsx
│   │   │   ├── workspaceTypes.ts
│   │   │   └── workspaceUI.tsx
│   │   ├── services/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── format.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.scss
│   │   ├── tailwind.css
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker/
│   └── entrypoint.sh
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── FILE_TREE.md
│   ├── SECURITY.md
│   └── VERIFICATION.md
├── server/
│   ├── prisma/
│   │   ├── assets/
│   │   │   ├── documents/
│   │   │   │   ├── seed-document-1.pdf
│   │   │   │   ├── seed-document-2.pdf
│   │   │   │   ├── seed-document-3.pdf
│   │   │   │   ├── seed-document-4.pdf
│   │   │   │   └── seed-document-5.pdf
│   │   │   ├── public/
│   │   │   │   ├── event-1.jpg
│   │   │   │   ├── event-2.jpg
│   │   │   │   ├── event-3.jpg
│   │   │   │   ├── event-4.jpg
│   │   │   │   ├── event-5.jpg
│   │   │   │   ├── hero-community.jpg
│   │   │   │   ├── news-1.jpg
│   │   │   │   ├── news-2.jpg
│   │   │   │   ├── news-3.jpg
│   │   │   │   ├── news-4.jpg
│   │   │   │   └── news-5.jpg
│   │   │   └── README.md
│   │   ├── migrations/
│   │   │   ├── 20261005175819_init/
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── validation.ts
│   │   ├── routes/
│   │   │   ├── applications.ts
│   │   │   ├── auth.ts
│   │   │   ├── content.ts
│   │   │   └── members.ts
│   │   ├── services/
│   │   │   ├── statistics.ts
│   │   │   └── upload.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   ├── admin-lock.ts
│   │   │   ├── http.ts
│   │   │   ├── owned-image.ts
│   │   │   ├── pagination.ts
│   │   │   └── prisma.ts
│   │   ├── validators/
│   │   │   ├── content.ts
│   │   │   └── core.ts
│   │   ├── app.ts
│   │   ├── index.ts
│   │   └── openapi.ts
│   ├── tests/
│   │   └── api.test.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── package-lock.json
├── package.json
└── README.md
```
