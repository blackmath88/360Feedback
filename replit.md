# Leadership Assessment Platform

## Overview

A lightweight web platform for self-assessment and 360-degree external assessment (Selbst- und Fremdeinschätzung) at the University of Basel. Built as a case-based assessment management system supporting multiple roles.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Wouter routing, TanStack Query, shadcn/ui, Tailwind CSS v4)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Sessions**: express-session

## Architecture

- `artifacts/assessment-platform/` — React/Vite frontend
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas for server validation
- `lib/db/` — Drizzle ORM database client and schema

## Database Schema

- `users` — Platform users with roles: admin, manager, participant
- `cases` — Assessment cases with lifecycle status
- `assessment_instances` — Self or external assessment instances linked to cases
- `response_sets` — JSON answers and comments for each assessment
- `reports` — Generated reports (self, external, comparison) with release state

## Key Roles

- **Manager/Admin**: Create and manage cases, add respondents, generate/release reports
- **Participant**: Complete self-assessments, view released reports
- **External Respondent**: Complete assessments via tokenized link (no login required)

## Case Lifecycle

draft → self_assessment_open → external_assessment_open → collecting_responses → ready_for_report → report_generated → reviewed → released → closed

## Questionnaire

6 sections in German covering: Vision, Communication, Collaboration, Development, Decision-making, Self-leadership. Questions are 1–5 Likert scale with optional comments. Same engine, different wording for self vs. external mode.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Demo Users (Seeded)

1. Dr. Maria Hoffmann — manager
2. Thomas Bauer — participant
3. Sandra Meier — participant
4. Prof. Klaus Weber — admin
5. Laura Fischer — manager

## Notes

- Authentication is demo-mode (user selector). Replace with Entra ID SSO for production.
- External respondent links use 64-character hex tokens (e.g. `/respond/<token>`)
- The orval config writes its own index.ts — the codegen script overwrites it post-generation to avoid duplicate export errors
