# AGENTS.md — StockBrief-fe

This file defines how Codex and other agents must work in the StockBrief-fe repository.

## Role

- Act as a practical senior frontend engineer.
- Prefer direct action when the request is clear and low risk.
- Keep explanations concise, grounded in checked files or tool output, and explicit about unknowns.
- Do not claim completion until requested deliverables exist and relevant verification has been run.

## Repository Scope

`StockBrief-fe` covers Next.js UI, 클라이언트 상태, API 소비, 빌드.

```text
.
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # UI 컴포넌트
│   ├── lib/          # API 클라이언트, 유틸리티, watchlist 스토리지
│   └── types/        # TypeScript 타입 정의
├── docs/
│   ├── product/      # MVP PRD, 제품 정책
│   └── engineering/  # API 계약 (BE 참조용)
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## Project Identity

StockBrief는 한국 국내 주식 추천 후보 서비스다.

The product recommends stocks as candidates for further user review based on public evidence. It must not provide buy or sell instructions, target prices, entry prices, stop-loss prices, guaranteed returns, portfolio allocation advice, or certainty-based claims.

## Product Rules

- Use recommendation language only as `검토 후보 추천`.
- Allowed wording includes `추천 후보`, `추천 이유`, and `오늘의 추천 후보`.
- Do not use prohibited user-facing wording:
  - `매수 추천`
  - `매도 추천`
  - `목표가`
  - `진입가`
  - `손절가`
  - `수익 보장`
  - `확실`
  - `무조건`

## MVP Scope

- MVP is guest-first. Do not implement login or signup unless explicitly requested.
- Treat 로그인, 회원가입, login, signup, account sync, server-side user profile, and multi-device watchlist sync as P1.
- Store watchlist and preferences in `localStorage` for MVP.
- Use backend canonical API `/v1`.
- Use Next.js internal proxy path `/api/v1` only when implementing frontend proxy routes.

## Architecture Expectations

- Frontend: Next.js App Router, TypeScript, Tailwind.
- Backend API base: `http://localhost:8000/v1` (local), `/v1` (production via API Gateway).
- AWS target: Amplify 배포.

## API Contract Rules

- API 계약은 `docs/engineering/API_CONTRACT.md`를 참조한다.
- 계약이 바뀌면 BE 레포에서 먼저 고정한 후 FE를 맞춘다.
- 타입은 `src/types/api.ts`에서 관리한다.

## GitHub Operating Rules

- Treat GitHub Issue as the source of truth for scope, acceptance criteria, and review context.
- Start every task from `main`, create a short-lived branch, and keep the branch name aligned with the issue.
- Use `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `docs/<slug>`, `test/<issue>-<slug>`, `chore/<issue>-<slug>`, or `release/<version>`.
- Do not push directly to `main`. Use PRs only.
- One PR must have one purpose. Split UI, data, test, and config changes into separate PRs when practical.
- Link the GitHub Issue in the branch, commit messages when useful, and PR body.
- Prefer squash merge unless the reviewer or repo maintainer explicitly asks for another merge strategy.
- Keep branches short-lived. Rebase or merge `main` into the branch only when needed to resolve drift.

## PR And Review Rules

- Write PRs with: summary, background, main changes, tests run, risk/impact, rollback plan, and linked Issue.
- For frontend work, include the exact commands run and their result in the PR body.
- When API behavior changes, update `src/types/api.ts`, note the BE dependency, and call out any temporary mock or fallback handling.
- Before requesting review, self-check for missing tests, regression risk, secret leakage, prohibited financial wording, and contract drift.
- When reviewing a PR, prioritize correctness, regressions, security, API compatibility, and test coverage over style.
- Use `Request changes` only for blocking issues. Use `Comment` for non-blocking follow-ups. Approve only when the branch is safe to merge.
- After review feedback, either address it in the same branch or explain why it is out of scope in the PR thread.

## Branch Policy (가이드 기준)

- Follow the GitHub Operating Rules above for branch naming, PR scope, and merge style.

## Coding Rules

- Prefer small, focused changes.
- Read existing files before editing them.
- Respect existing code style and structure.
- Do not commit secrets, API keys, tokens, credentials, or private data.
- Keep `.env.example` updated when environment variables change.
- Avoid broad refactors unless requested.
- Do not add new production dependencies without a clear need.

## Verification Rules

- Frontend changes: run lint, typecheck, and build before completion.
- User-facing copy changes: scan for prohibited financial wording.
- API contract changes: update `src/types/api.ts` in the same PR.

## CI Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Definition Of Done

A task is done only when:

1. Every requested deliverable exists.
2. `npm run lint` passes.
3. `npm run typecheck` passes.
4. `npm run build` succeeds.
5. No prohibited financial wording appears in user-facing copy.
6. New environment variables are added to `.env.example`.
7. Remaining limitations or skipped verification are stated in the final response.

## Default Close-Out

Final responses should include:

- What changed.
- Files or artifacts created or modified.
- Verification performed.
- Remaining limitations, if any.
