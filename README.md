# QBIT Hub — Enterprise Portal

**Precision engineering for modern POS systems.** QBIT Hub is a comprehensive enterprise platform for managing hardware lifecycles, installation workflows, driver deployments, knowledge bases, and AI-powered technical support.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Modules](#modules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Security](#security)
- [Testing Strategy](#testing-strategy)
- [Release Notes](#release-notes)

---

## Overview

QBIT Hub serves **7 user roles** across **22 design screens** with a Material 3 design system, role-based access control, RAG-powered AI assistant, and a customer-facing public portal — all built on Next.js 16 with strict TypeScript.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Auth | NextAuth.js v4 (JWT, Credentials provider) |
| AI | z-ai-web-dev-sdk (GLM-4) with provider abstraction |
| Icons | Material Symbols Outlined |
| Fonts | Inter (next/font) |
| State | Zustand (navigation), React hooks (local) |

## Architecture

```
Feature-based architecture with 9 module directories:

src/
├── app/                    # Next.js App Router
│   ├── api/                # 13 API routes (4 admin, 5 public, 1 AI, 1 auth, 1 download, 1 health)
│   ├── error.tsx           # Global error boundary
│   ├── forbidden/          # 403 page
│   ├── globals.css         # QBIT design system CSS
│   ├── layout.tsx          # Root layout (Inter + Material Symbols + Providers)
│   ├── not-found.tsx       # 404 page
│   ├── page.tsx            # Single-route router (Zustand-driven)
│   └── unauthorized/       # 401 page
├── components/
│   ├── providers/          # SessionProvider + ThemeProvider
│   ├── ui/                 # shadcn/ui primitives (49 components)
│   └── qbit/               # QBIT Hub feature components
│       ├── primitives/     # 7 base components (Icon, GlassCard, KpiCard, etc.)
│       ├── shells/         # 7 layout components (AppShell, Sidebar, TopBar, etc.)
│       ├── dashboard/      # 16 Home Dashboard sections
│       ├── downloads/      # 10 Driver Download Center components
│       ├── installation/   # 12 Installation Center components
│       ├── knowledge/      # 9 Knowledge Base components
│       ├── admin/          # 10 Admin Control Center components
│       ├── portal/         # 21 Customer Public Portal components
│       ├── ai/             # 5 AI Assistant components
│       └── pages/          # 22 page-level components
├── hooks/                  # 3 custom hooks (use-debounce, use-mobile, use-toast)
├── lib/
│   ├── ai/                 # RAG architecture (provider, retrieval, prompt-builder, types)
│   ├── auth/               # NextAuth config + useAuth hook
│   ├── admin/              # Admin types + placeholder data
│   ├── downloads/          # Download types + placeholder data
│   ├── errors/             # API error handling utilities
│   ├── installation/       # Installation types + placeholder data
│   ├── knowledge/          # Knowledge types + placeholder data
│   ├── monitoring/         # Logger + Monitor interfaces
│   ├── navigation/         # Zustand store + nav config
│   ├── portal/             # Portal types + placeholder data
│   ├── rbac/               # Role definitions + permission matrix
│   ├── security/           # Input validation + sanitization
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # Shared utilities (cn, etc.)
├── middleware.ts           # Rate limiting for API routes
└── prisma/
    └── schema.prisma       # 56 Prisma models
```

## Modules

### 1. Authentication & RBAC
- NextAuth.js with JWT sessions + Credentials provider
- 7 roles: Administrator, Installation Engineer, Support Engineer, Sales Executive, Dealer, Viewer, Public Customer
- AuthGuard protects all in-app screens
- Theme toggle (Light/Dark/System) with persistence
- Profile dropdown with role badge + sign out

### 2. Home Dashboard
- 17 reusable section components (hero, search, KPIs, quick access, featured products, continue working, system updates, popular downloads, bookmarks, pinned resources, announcements, recent activity, AI assistant, skeleton, empty state)

### 3. Driver Download Center
- Secure download API with visibility enforcement (public/internal/restricted)
- Download drawer with version timeline + release notes
- PDF preview for manuals
- Filter sidebar (OS, category, type, year, latest toggle)

### 4. Installation Center
- Step-by-step installation guides with progress tracking
- Wiring diagram viewer (zoom, fullscreen, download)
- Interactive checklists with completion tracking
- Required tools display
- Troubleshooting + FAQ sections

### 5. Knowledge Base & Troubleshooting
- Rich-text article viewer (paragraphs, callouts, code blocks, tables, lists)
- Searchable FAQ accordion
- Troubleshooting cards with symptoms/causes/solutions
- Common error code lookup
- Article feedback (helpful/not helpful/suggest/report)
- Bookmarks

### 6. Enterprise Admin Control Center
- Admin dashboard with 14 stats + analytics + audit logs
- User management table (search, filter, suspend, activate, reset password, delete)
- Permission matrix (7 roles × 10 permissions)
- Unified asset manager (drivers, firmware, SDK, utility, manuals, datasheets, warranty, videos)
- Announcement manager with CRUD
- System settings panel (company info, branding, application)
- 4 RBAC-protected admin API routes

### 7. Customer Public Portal
- Public product catalog with search + category filters
- Full product detail page (gallery, overview, specs, downloads, YouTube videos, FAQs, troubleshooting, accessories, related products, support, contact form, QR code)
- SEO: JSON-LD Product + BreadcrumbList schemas, Open Graph, Twitter Card, canonical URL
- Share modal (copy link, WhatsApp, email, QR code, Native Share API)
- Contact form + newsletter signup
- Public API routes (no auth required, public assets only)

### 8. Enterprise AI Assistant
- RAG-ready architecture (document retrieval → prompt builder → AI provider → source references)
- Provider abstraction (ZAI default, MockProvider fallback, OpenAI/Gemini/Claude/local ready)
- Markdown rendering (headings, bold, lists, tables, code blocks)
- Source references + related assets
- Search history (pinned + recent)
- Suggested questions
- Feedback (thumbs up/down)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- SQLite (dev) or PostgreSQL 14+ (prod)

### Installation

```bash
# Clone the repository
git clone <repo-url> qbit-hub
cd qbit-hub

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Push database schema
bun run db:push

# Seed demo users
bun run scripts/seed-users.ts

# Start development server
bun run dev
```

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Administrator | admin@qbithub.com | admin123 |
| Installation Engineer | engineer@qbithub.com | engineer123 |
| Support Engineer | support@qbithub.com | support123 |
| Sales Executive | sales@qbithub.com | sales123 |
| Dealer | dealer@qbithub.com | dealer123 |
| Viewer | viewer@qbithub.com | viewer123 |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Prisma database connection string |
| `NEXTAUTH_SECRET` | Yes | — | NextAuth JWT secret (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Application base URL |
| `ZAI_API_KEY` | No | — | ZAI API key (leave empty for MockProvider) |
| `ZAI_BASE_URL` | No | `https://api.z.ai/api/paas/v4` | ZAI API base URL |
| `SENTRY_DSN` | No | — | Sentry DSN for error tracking (leave empty to disable) |

## Database

### Prisma Schema

56 models across 8 modules. Key models:

- **User** — authentication, roles, password hash
- **Download** — file metadata + secure storage path (never exposed to client)
- **DownloadHistory** / **FavoriteDownload** — user download tracking
- **InstallationGuide** / **InstallationStep** / **RequiredTool** — installation content
- **KnowledgeArticle** / **FAQ** / **TroubleshootingIssue** / **CommonError** — knowledge content
- **AuditLog** / **SystemSetting** / **Announcement** — admin infrastructure
- **CustomerInquiry** / **CustomerNewsletter** — public portal forms
- **AIConversation** / **AIMessage** / **SourceReference** — AI chat persistence

### Migrations

Development uses `prisma db push` (schema sync). For production:

```bash
# Create a migration
bun run db:migrate --name init

# Apply migrations in production
npx prisma migrate deploy
```

### Seed Strategy

```bash
# Seed 6 demo users
bun run scripts/seed-users.ts
```

## API Documentation

### Authentication

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth.js catch-all |

### Admin (RBAC: administrator only)

| Endpoint | Method | Description |
|---|---|---|
| `/api/admin/audit-logs` | GET, POST | List/create audit log entries |
| `/api/admin/announcements` | GET, POST | List/create announcements |
| `/api/admin/settings` | GET, PUT | List/update system settings |
| `/api/admin/metrics` | GET, POST | List/record system metrics |

### AI (authenticated)

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai/chat` | POST | RAG-powered AI chat (retrieve → prompt → AI → response + sources) |

### Downloads

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/downloads/[id]` | GET | Public/Internal/Restricted | Secure download with visibility enforcement |

### Public (no auth)

| Endpoint | Method | Description |
|---|---|---|
| `/api/public/products` | GET | List public products |
| `/api/public/downloads` | GET | List public downloads only |
| `/api/public/articles` | GET | List public knowledge articles |
| `/api/public/contact` | POST | Submit customer inquiry |
| `/api/public/newsletter` | POST | Subscribe to newsletter |

### Health

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check (server + database) |

### Rate Limits

| Route prefix | Limit |
|---|---|
| `/api/ai/chat` | 10 requests/min |
| `/api/public/contact` | 5 requests/min |
| `/api/public/newsletter` | 5 requests/min |
| `/api/downloads` | 30 requests/min |
| `/api/admin` | 60 requests/min |
| `/api/public` (other) | 100 requests/min |
| Default | 60 requests/min |

## Deployment

### Vercel

```bash
# 1. Push code to GitHub
# 2. Import project in Vercel dashboard
# 3. Set environment variables in Vercel project settings
# 4. Deploy

# Or use Vercel CLI:
npm i -g vercel
vercel
```

### Self-hosted (Node.js)

```bash
# Build
bun run build

# Start production server
bun run start
```

### Docker (recommended for production)

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build
COPY . .
RUN bun run db:generate
RUN bun run build

# Production image
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
ENV NODE_ENV=production
CMD ["bun", "server.js"]
```

### Production Checklist

- [ ] Set `DATABASE_URL` to PostgreSQL connection string
- [ ] Set `NEXTAUTH_SECRET` to a random 32+ character string
- [ ] Set `NEXTAUTH_URL` to the production domain
- [ ] Set `ZAI_API_KEY` for AI Assistant (or leave empty for MockProvider)
- [ ] Run `npx prisma migrate deploy` to apply migrations
- [ ] Run `bun run scripts/seed-users.ts` to create admin account
- [ ] Configure reverse proxy (Caddy/Nginx) with HTTPS
- [ ] Set up object storage (Supabase Storage / UploadThing) for file uploads
- [ ] Configure Sentry DSN for error tracking (optional)
- [ ] Verify `/api/health` returns 200

## Security

### RBAC Enforcement

- All admin API routes enforce `administrator` role via `getServerSession`
- AuthGuard protects all in-app screens client-side
- Public API routes only return `visibility="public"` content
- Internal and restricted downloads are never exposed to unauthenticated users
- The `storagePath` field is never selected in public API responses

### Input Validation

All user input is validated and sanitized via `src/lib/security/validation.ts`:
- `sanitizeText()` — strips HTML + truncates
- `sanitizeEmail()` — validates + normalizes
- `validateRequired()` — checks required fields
- `isSafeText()` — allows only safe characters

### Security Headers

| Header | Value |
|---|---|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload |

## Testing Strategy

### Recommended Test Structure

```
tests/
├── unit/                    # Unit tests for utilities and hooks
│   ├── lib/
│   │   ├── security/        # validation.test.ts
│   │   ├── rbac/            # roles.test.ts
│   │   └── ai/              # retrieval.test.ts, prompt-builder.test.ts
│   └── hooks/               # use-debounce.test.ts
├── integration/             # API route tests
│   ├── api/
│   │   ├── admin/           # audit-logs.test.ts, announcements.test.ts
│   │   ├── public/          # contact.test.ts, downloads.test.ts
│   │   ├── ai/              # chat.test.ts
│   │   └── downloads/       # [id].test.ts
│   └── lib/
│       └── auth/            # options.test.ts
└── e2e/                     # End-to-end tests (Playwright/Cypress)
    ├── auth.spec.ts         # Login, logout, RBAC
    ├── downloads.spec.ts    # Download flow
    ├── ai-chat.spec.ts      # AI chat flow
    └── admin.spec.ts        # Admin CRUD operations
```

### Recommended Test Runners

| Type | Tool | Rationale |
|---|---|---|
| Unit | Vitest | Fast, native ESM, Jest-compatible API |
| Integration | Vitest + supertest | API route testing with mocked database |
| E2E | Playwright | Cross-browser, reliable, fast |

## Release Notes

### Version 1.0.0 — Initial Release

**8 Modules:**
1. Authentication & RBAC (NextAuth, 7 roles, AuthGuard)
2. Home Dashboard (17 reusable sections)
3. Driver Download Center (secure downloads, version timeline, PDF viewer)
4. Installation Center (step-by-step guides, wiring diagrams, checklists)
5. Knowledge Base & Troubleshooting (articles, FAQs, error codes, troubleshooting)
6. Enterprise Admin Control Center (user management, asset manager, audit logs, announcements, settings)
7. Customer Public Portal (product catalog, product detail page, SEO, QR codes, share, contact form, newsletter)
8. Enterprise AI Assistant (RAG architecture, provider abstraction, Markdown chat, source references)

**Production Hardening:**
- Rate limiting middleware (per-IP, per-route)
- Input validation + sanitization (11 utilities)
- Structured logging (provider-agnostic)
- Monitoring interface (Sentry/OpenTelemetry/AppInsights ready)
- Consistent error handling (7 helpers + apiHandler wrapper)
- 6 security headers
- Strict TypeScript (no `any`, `noImplicitAny: true`)
- Search debounce hook
- Health check endpoint

**Metrics:**
- 56 Prisma models
- ~110 reusable components across 9 feature directories
- 13 API routes (4 admin RBAC-protected, 5 public, 1 AI, 1 auth, 1 download, 1 health)
- 22 page-level components
- 0 ESLint errors
- 0 TypeScript errors
- 0 `any` types
