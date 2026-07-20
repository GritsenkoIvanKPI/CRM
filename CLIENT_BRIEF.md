# CLIENT_BRIEF.md — G.Vision Lead CRM

## Product
Standalone, single-user lead-tracking CRM for Ivan, founder of G.Vision (digital agency). Not multi-tenant SaaS — a personal operator tool for tracking inbound leads, follow-up timing, and sales conversion. Interface language: **Ukrainian**.

## Stack (confirmed)
- Frontend/Backend: Next.js (App Router), single deployable app
- Database: PostgreSQL (Neon or Vercel Postgres)
- Hosting: Vercel
- Auth: single-user password/magic-link session auth (Ivan only), all routes protected
- Calendar: Google Calendar API (OAuth2, server-side token storage) — Google account to be provided when wiring up OAuth

## Visual direction (confirmed)
- Reference image `example.png` (Hostinger dashboard) sets the **layout DNA only**: sidebar nav + topbar, greeting headline, quick-action pills, widget/card sections below.
- Actual skin is **dark theme**, per CLAUDE.md house style — custom G.Vision dark palette, not the reference's light/white colors.
- Follow CLAUDE.md anti-generic guardrails: custom accent color (no default Tailwind indigo/blue), layered color-tinted shadows, display+body font pairing, transform/opacity-only animation, full interactive states, layered depth system.

## Data model — Lead entity
- Business name (Назва бізнесу) — text
- Telegram — text
- Phone (Номер телефону) — text
- Instagram — text
- Niche (Ніша) — text/select, growing tag list
- Business GEO (ГЕО бізнесу) — text/select
- Website (Сайт) — URL
- Account (Аккаунт) — social/contact account lead came through
- Lead gen method (Метод лідогенерації) — editable select (cold outreach, IG/TikTok, referral, ads, inbound, etc.)
- Lead gen source/person (Лідген)
- Deal value (Чек) — number, ₴ UAH
- Date created (Дата) — auto-set
- Month (Місяць) — derived from Дата, not manual
- Next follow-up (Дата Пушу) — date + optional time
- Status (Статус) — see pipeline
- **Notes** — free text, confirmed addition for context/history

## Pipeline (linear, single status per lead)
1. Написав
2. Колл
3. КП
4. Думає
5. Цікаво
6. Не цікаво (lost, terminal)
7. Продаж (won, terminal)

Status changes logged with timestamp (status history table) for time-in-stage and drop-off analytics.

## Core features
1. **Lead management** — table view (sortable/filterable by status, niche, GEO, method, date), Kanban view by Статус with drag-and-drop, create/edit/delete, quick search (business name, Telegram, phone, Instagram)
2. **Follow-up + Google Calendar sync** — setting/editing Дата Пушу creates/updates a Calendar event (lead name, status, link back to CRM record); status → Продаж/Не цікаво or date change updates/removes event; in-app upcoming/today view independent of Calendar
3. **Analytics dashboard** — funnel conversion + drop-off per stage; close rate to Продаж (overall + date-range filterable); breakdown by Метод лідогенерації (count, conversion %, total Чек); breakdown by Ніша/ГЕО (secondary priority); monthly trend (leads/sales/revenue); segment views for Цікаво and Продаж lists
4. **Auth** — single-user session auth, all routes protected

## Non-functional
- Full Ukrainian UI
- Mobile-friendly (Ivan checks/updates from phone)
- Fast add-lead flow, minimal friction

## Out of scope v1
- Multi-user/roles
- Automated lead capture from Telegram/Instagram (manual entry only)
- Invoicing/payments

## Open items still to resolve during implementation
- Google account to use for Calendar OAuth setup (needed before wiring the integration, not before building the rest)
