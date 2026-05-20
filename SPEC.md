# PRODE Mundial FIFA 2026 — Especificación técnica

> Documento de implementación. Todas las decisiones del stack están tomadas. Está pensado para que vayas leyendo y construyendo en paralelo.

---

## 1. Decisiones finales (resumen ejecutivo)

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 | Standard moderno, server components, streaming |
| Lenguaje | TypeScript strict | Type safety |
| Estilos | Tailwind CSS v4 + shadcn/ui | UI rápida, componentes copiables (no dep pesada) |
| Estado server | TanStack Query v5 | Cache + revalidación + optimistic updates |
| Formularios | React Hook Form + Zod | Validación end-to-end con los mismos schemas del backend |
| Iconos | Lucide React | Liviano, tree-shakeable |
| Auth | Auth.js v5 (NextAuth) + Credentials provider | Free, flexible, JWT sessions |
| ORM | Prisma | DX excelente, type-safe |
| DB | Neon Postgres (free tier) | Branching para staging, point-in-time recovery |
| API de fútbol | API-Football (RapidAPI) | Free tier 100 req/día con cacheo agresivo alcanza |
| Email | Resend | 3000 emails/mes gratis, DX moderna |
| Scheduler | Vercel Cron Jobs | Built-in, sin servicios extra |
| Hosting | Vercel Pro ($20/mes) | Requerido para monetización con ads |
| CI/CD | GitHub Actions + Vercel auto-deploy | Automático en push a main |
| Ads | Adsterra inicialmente, AdSense después | Adsterra aprueba sites nuevos |
| Monitoring | Sentry (free tier) + Vercel Analytics | Errores + métricas |

---

## 2. Decisiones de diseño que tomé por vos

**1. Predicciones globales, no por sala.** Un usuario carga UN pronóstico por partido y vale para todas las salas a las que pertenece. Menos fricción, menos writes a la DB, y las salas siguen siendo significativas porque agrupan rankings entre amigos distintos.

**2. Sin aprobación manual a nivel app.** Registro libre con verificación de email. La aprobación se mueve a **nivel sala**: el owner decide si las uniones por código son automáticas o requieren su OK.

**3. Sin n8n.** Vercel Cron + Route Handlers cubren 100% de las automatizaciones del MVP. Cero costo extra, cero servicio adicional que mantener.

**4. Backups: Neon se encarga.** Tiene point-in-time recovery automático. Olvidate de Google Sheets.

**5. Scoring para fase eliminatoria:** se cuenta el resultado de los 90 minutos (no prórroga ni penales). Más simple, más justo.

**6. Lock de predicciones: 10 minutos antes del kickoff.** Buffer suficiente.

**7. Mobile-first.** 80%+ del tráfico será mobile.

**8. Una sola región de Vercel:** `iad1` (US East) — la API de fútbol y Neon están allá, latencia mínima entre servicios.

---

## 3. Sistema de scoring

```
Resultado exacto              → 10 pts
Ganador + diferencia exacta   →  7 pts   (predijo 2-1, fue 3-2)
Solo ganador (o empate)       →  5 pts   (predijo 2-0, fue 1-0; o predijo 1-1, fue 2-2)
Incorrecto                    →  0 pts
```

**Bonus opcional (post-MVP):** +3 pts si tu equipo favorito gana ese partido y vos lo predijiste correctamente. Da gamificación extra.

Implementación en `src/lib/scoring.ts`:

```typescript
export type ScoreResult = {
  points: number;
  category: 'EXACT' | 'WINNER_DIFF' | 'WINNER_ONLY' | 'WRONG';
};

export function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): ScoreResult {
  // Exacto
  if (predHome === realHome && predAway === realAway) {
    return { points: 10, category: 'EXACT' };
  }

  const predDiff = predHome - predAway;
  const realDiff = realHome - realAway;
  const predWinner = Math.sign(predDiff);   // -1, 0, 1
  const realWinner = Math.sign(realDiff);

  // Ganador correcto + diferencia exacta
  if (predWinner === realWinner && predDiff === realDiff) {
    return { points: 7, category: 'WINNER_DIFF' };
  }

  // Solo ganador correcto (incluye empate)
  if (predWinner === realWinner) {
    return { points: 5, category: 'WINNER_ONLY' };
  }

  return { points: 0, category: 'WRONG' };
}
```

---

## 4. Schema completo de Prisma

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  USER
  ADMIN
}

enum Stage {
  GROUP
  R32
  R16
  QF
  SF
  THIRD
  FINAL
}

enum MatchStatus {
  SCHEDULED
  LIVE
  FINISHED
  CANCELLED
  POSTPONED
}

enum MemberStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ScoreCategory {
  EXACT
  WINNER_DIFF
  WINNER_ONLY
  WRONG
}

model User {
  id              String       @id @default(cuid())
  email           String       @unique
  emailVerified   DateTime?
  name            String
  passwordHash    String
  role            Role         @default(USER)
  favoriteTeamId  String?
  favoriteTeam    Team?        @relation(fields: [favoriteTeamId], references: [id])
  hasProPass      Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  predictions     Prediction[]
  memberships     RoomMember[]
  ownedRooms      Room[]       @relation("RoomOwner")
  sessions        Session[]
  accounts        Account[]
  verificationTokens VerificationToken[]

  @@index([email])
}

model Team {
  id          String   @id @default(cuid())
  externalId  String   @unique             // ID en API-Football
  name        String
  code        String   @unique             // ARG, BRA, MEX
  flagUrl     String?
  group       String?                       // A..L (12 grupos)
  
  users       User[]
  homeMatches Match[]  @relation("HomeTeam")
  awayMatches Match[]  @relation("AwayTeam")
}

model Match {
  id          String      @id @default(cuid())
  externalId  String      @unique
  homeTeamId  String
  awayTeamId  String
  homeTeam    Team        @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam    Team        @relation("AwayTeam", fields: [awayTeamId], references: [id])
  kickoff     DateTime
  lockAt      DateTime                     // kickoff - 10 min
  stage       Stage
  homeScore   Int?
  awayScore   Int?
  status      MatchStatus @default(SCHEDULED)
  venue       String?
  scoredAt    DateTime?                    // cuándo se calcularon puntos
  
  predictions Prediction[]

  @@index([kickoff])
  @@index([status])
  @@index([lockAt])
}

model Prediction {
  id          String         @id @default(cuid())
  userId      String
  matchId     String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  match       Match          @relation(fields: [matchId], references: [id])
  homeScore   Int
  awayScore   Int
  points      Int?                           // null hasta calcular
  category    ScoreCategory?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([userId, matchId])               // un pronóstico por user/match
  @@index([matchId])
  @@index([userId])
}

model Room {
  id              String       @id @default(cuid())
  name            String
  code            String       @unique     // ej: "MUNDIAL26X"
  ownerId         String
  owner           User         @relation("RoomOwner", fields: [ownerId], references: [id])
  requireApproval Boolean      @default(false)
  isPublic        Boolean      @default(false)
  maxMembers      Int?         @default(50)
  createdAt       DateTime     @default(now())

  members         RoomMember[]

  @@index([code])
}

model RoomMember {
  id          String       @id @default(cuid())
  userId      String
  roomId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  room        Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  status      MemberStatus @default(APPROVED)
  totalScore  Int          @default(0)     // denormalizado para ranking rápido
  exactCount  Int          @default(0)     // bonus: cuántos resultados exactos
  joinedAt    DateTime     @default(now())

  @@unique([userId, roomId])
  @@index([roomId, totalScore(sort: Desc)])  // crítico para query de ranking
}

// === Tablas de Auth.js ===
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  id         String   @id @default(cuid())
  identifier String
  token      String   @unique
  expires    DateTime
  userId     String?
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([identifier, token])
}
```

---

## 5. Configuración de Vercel Cron

`vercel.json` en la raíz:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-results",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/lock-predictions",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Sync de resultados** (`src/app/api/cron/sync-results/route.ts`):
- Corre cada 15 min
- Llama a API-Football pidiendo partidos en estado `LIVE` o `FINISHED` del día actual
- Para cada partido finalizado nuevo: actualiza score, recalcula puntos de TODAS las predicciones, actualiza `totalScore` en TODOS los `RoomMember` afectados (en una transacción)
- Marca el match como `scoredAt = now()` para no recalcular

**Lock de predicciones** (`src/app/api/cron/lock-predictions/route.ts`):
- Corre cada 5 min
- En realidad no hace casi nada porque el lock se valida server-side en cada POST de predicción comparando `now()` con `match.lockAt`
- Sirve para notificar por email a usuarios que no cargaron pronóstico (opcional, post-MVP)

**Protección de los endpoints de cron:**

```typescript
// Header que Vercel manda automáticamente en cron jobs
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... lógica
}
```

---

## 6. Variables de entorno

`.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# Auth.js
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="PRODE 2026 <noreply@tu-dominio.com>"

# Football API
RAPIDAPI_KEY="xxx"
RAPIDAPI_HOST="api-football-v1.p.rapidapi.com"
FIFA_WORLD_CUP_LEAGUE_ID="1"   # confirmar ID exacto al integrar

# Cron
CRON_SECRET="generate-with-openssl-rand-hex-32"

# Admin inicial (para seed)
ADMIN_EMAIL="tu@email.com"
ADMIN_PASSWORD="cambiame-rapido"

# Public
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ADSTERRA_KEY=""    # poblar después
```

---

## 7. Estructura de carpetas

```
prode-mundial-2026/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                       # carga 48 equipos + admin inicial
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard (próximos partidos + mi ranking)
│   │   │   ├── matches/
│   │   │   │   ├── page.tsx          # Listado completo de partidos
│   │   │   │   └── [id]/page.tsx     # Detalle + cargar pronóstico
│   │   │   ├── rooms/
│   │   │   │   ├── page.tsx          # Mis salas
│   │   │   │   ├── new/page.tsx      # Crear sala
│   │   │   │   └── [code]/
│   │   │   │       ├── page.tsx      # Ranking de la sala
│   │   │   │       └── settings/page.tsx
│   │   │   ├── join/[code]/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Middleware: require role=ADMIN
│   │   │   ├── page.tsx
│   │   │   ├── matches/page.tsx      # Forzar resultados / re-sync
│   │   │   ├── users/page.tsx
│   │   │   └── recalculate/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── predictions/route.ts
│   │   │   ├── rooms/
│   │   │   │   ├── route.ts                  # POST crear, GET listar mías
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts              # GET detalle + ranking
│   │   │   │       ├── join/route.ts         # POST unirse
│   │   │   │       └── members/[memberId]/
│   │   │   │           └── route.ts          # PATCH aprobar/rechazar
│   │   │   ├── matches/route.ts
│   │   │   ├── cron/
│   │   │   │   ├── sync-results/route.ts
│   │   │   │   └── lock-predictions/route.ts
│   │   │   └── admin/
│   │   │       ├── matches/[id]/route.ts
│   │   │       └── recalculate/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # shadcn (button, card, dialog, input, etc.)
│   │   ├── matches/
│   │   │   ├── MatchCard.tsx
│   │   │   ├── PredictionForm.tsx
│   │   │   └── MatchList.tsx
│   │   ├── rooms/
│   │   │   ├── RoomCard.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── JoinRoomDialog.tsx
│   │   ├── ads/
│   │   │   ├── AdsterraBanner.tsx
│   │   │   └── AdsterraNative.tsx
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── BottomNav.tsx         # mobile
│   │       └── TeamFlag.tsx
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── auth.ts                   # config Auth.js
│   │   ├── scoring.ts                # función calculatePoints
│   │   ├── football-api.ts           # cliente de API-Football
│   │   ├── email.ts                  # cliente Resend
│   │   ├── room-code.ts              # generador de códigos
│   │   ├── validations/
│   │   │   ├── prediction.ts
│   │   │   ├── room.ts
│   │   │   └── auth.ts
│   │   └── utils.ts                  # cn() de shadcn, formatters, etc.
│   ├── hooks/
│   │   ├── use-predictions.ts
│   │   ├── use-rooms.ts
│   │   └── use-leaderboard.ts
│   ├── middleware.ts                  # protección de rutas
│   └── types/
│       └── index.ts
├── public/
│   └── flags/                         # banderas SVG locales (fallback)
├── .env.example
├── vercel.json
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 8. Plan de implementación día a día

Asumiendo 2-3 horas diarias de trabajo. Total ≈ 4-5 semanas hasta lanzamiento.

### Semana 1 — Cimientos

**Día 1-2: Setup**
- `npx create-next-app@latest prode-mundial-2026 --typescript --tailwind --app --src-dir`
- Configurar Neon (crear DB, copiar `DATABASE_URL` y `DIRECT_URL` con pooler)
- Instalar dependencias core: `prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs zod react-hook-form @hookform/resolvers @tanstack/react-query lucide-react resend`
- `npx shadcn@latest init` y agregar componentes base (button, input, card, dialog, form, table)
- Configurar `lib/db.ts` con el singleton de Prisma
- Crear repo en GitHub, push inicial, conectar Vercel

**Día 3-4: Schema + Auth**
- Pegar el `schema.prisma` completo, correr `npx prisma migrate dev --name init`
- Crear `lib/auth.ts` con Auth.js v5 + Credentials + Prisma adapter
- Implementar `/api/auth/[...nextauth]/route.ts`
- Páginas de login y register con React Hook Form + Zod
- Middleware para proteger `(app)` y `admin`
- Verificación de email con Resend (token + endpoint `/verify`)

**Día 5-7: Datos base**
- Script de seed: carga las 48 selecciones del Mundial 2026, grupos A-L
- Página de selección de equipo favorito (post-registro)
- Pantalla de perfil básica

### Semana 2 — Salas y predicciones

**Día 8-10: Salas**
- API: crear sala, listar mis salas, ver detalle
- Generador de códigos únicos de 8 caracteres (`lib/room-code.ts`)
- UI: crear sala, unirse por código, listado de salas
- Sistema de aprobación opcional (toggle en config de sala)

**Día 11-14: Predicciones**
- Integración con API-Football: endpoint admin para importar fixtures
- API: POST/PATCH predicción con validación de lock
- UI de carga de predicción (inputs simples, validación inmediata)
- Página de listado de partidos con estado (próximo, lockeado, finalizado)

### Semana 3 — Scoring y rankings

**Día 15-17: Scoring**
- Implementar `lib/scoring.ts` con tests unitarios (Vitest)
- Endpoint admin para forzar resultado de un partido + recalcular
- Cron `/api/cron/sync-results`: fetch resultados, calcular, actualizar todos los `totalScore`
- Probar con datos simulados (fixtures viejos)

**Día 18-21: Rankings y UI**
- Ranking de sala (query optimizada con índice)
- Ranking global
- Historial por usuario (predicciones + puntos por partido)
- Dashboard principal con próximos partidos y posición actual

### Semana 4 — Polish y deploy

**Día 22-24: Mobile + UX**
- Responsive completo (mobile-first)
- Bottom nav para mobile
- Loading states, skeletons, optimistic updates
- Empty states bonitos

**Día 25-26: Monitoring + ads**
- Sentry para errores
- Vercel Analytics
- Adsterra integrado (después de aplicar y esperar aprobación: ~1 semana)
- Política de privacidad + términos (requeridos para AdSense después)

**Día 27-28: Testing + lanzamiento beta**
- Beta cerrada con 10-20 amigos
- Iterar feedback
- Load test básico (k6 o autocannon)
- Activar dominio en Vercel + DNS

### Semana 5 — Pre-mundial (margen)

- Bugs encontrados en beta
- Polish visual
- Plan de contingencia: si la API de fútbol falla en vivo, modo manual desde admin para cargar resultados
- Comunicación con tu grupo de usuarios iniciales

---

## 9. Comandos para arrancar HOY

```bash
# 1. Crear proyecto
npx create-next-app@latest prode-mundial-2026 \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd prode-mundial-2026

# 2. Dependencias principales
npm install prisma @prisma/client
npm install next-auth@beta @auth/prisma-adapter
npm install bcryptjs zod
npm install react-hook-form @hookform/resolvers
npm install @tanstack/react-query
npm install resend
npm install lucide-react

# 3. shadcn
npx shadcn@latest init
npx shadcn@latest add button input label card dialog form table toast skeleton avatar badge

# 4. Devs
npm install -D @types/bcryptjs vitest @vitejs/plugin-react

# 5. Prisma
npx prisma init
# (pegar el schema.prisma del documento)
# (crear cuenta en Neon, copiar URLs al .env)
npx prisma migrate dev --name init
npx prisma generate

# 6. Git
git add . && git commit -m "feat: initial setup"
gh repo create prode-mundial-2026 --private --source=. --push

# 7. Vercel
npm i -g vercel
vercel link
vercel env pull .env.local
```

---

## 10. Checklist de lanzamiento

- [ ] Schema migrado en producción
- [ ] Seed corrido (48 equipos + admin user)
- [ ] Auth funcionando con verificación de email
- [ ] Salas funcionando (crear, unirse, aprobar)
- [ ] Predicciones funcionando (cargar, editar antes del lock)
- [ ] Cron de sync activo y testeado con un partido real
- [ ] Scoring testeado con todos los casos (exacto, diff, ganador, error)
- [ ] Rankings cargan en < 200ms
- [ ] Mobile usable sin zoom
- [ ] Errores se reportan a Sentry
- [ ] Adsterra aprobado e integrado
- [ ] Dominio configurado con SSL
- [ ] Política de privacidad y T&C en el footer
- [ ] Email de bienvenida testeado
- [ ] Plan B documentado: si la API de fútbol cae, cómo cargás resultados manualmente

---

## 11. Riesgos a tener en mente

**Rate limit de API-Football (100 req/día free):** con cacheo en Vercel (revalidate cada 5 min) y solo pidiendo el día en curso, te alcanza. Si no, plan Pro de RapidAPI sale ~10 USD/mes.

**Que AdSense no te apruebe rápido:** Adsterra es Plan B confirmado, no opcional.

**Tráfico concentrado en horarios de partidos:** Vercel maneja autoscaling pero ojo con el plan Hobby si todavía no migraste a Pro. Migrá ANTES del primer partido.

**Predicciones cargadas a último momento:** el lock server-side es la única defensa real. No confíes en el frontend.

**Recalcular puntos cuando admin corrige un resultado:** ya está contemplado en el endpoint admin pero verificá que actualice `totalScore` de TODOS los miembros afectados en una transacción.
