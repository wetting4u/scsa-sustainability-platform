# SCSA sustainability prototype

An English-language, login-free Next.js App Router + React + TypeScript + Tailwind prototype. Open `/` to start the dashboard. No database, account, environment variables or Supabase setup is required.

## Run in VS Code

Install Node.js 22.13+ (including npm), open this folder, then open Terminal → New Terminal:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Stop with Ctrl+C. If npm is not recognised, install Node.js with npm and restart VS Code. PowerShell users blocked by script execution policy can use `npm.cmd` instead of `npm`.

If dependencies are already installed and `node` works but `npm` is unavailable, you can start directly with `node node_modules/next/dist/bin/next dev`.

This repository includes a pnpm lockfile. For reproducible team installs, use pnpm with `pnpm install --frozen-lockfile` and `pnpm dev`. The npm commands above are an alternative; agree on one package manager before team integration.

## Demo walkthrough

1. Open Overview: September 2026 sample household data.
2. Choose Log usage. Enter electricity, 50 kWh, 15–21 September 2026.
3. Save and return to Overview: electricity total changes from 122 to 172 kWh; the weekly chart and goal usage change too.
4. Filter, edit or delete a record in My records.
5. Create a usage-limit goal; explore and join a challenge.
6. Open Settings & privacy: the two independent preferences start off. They affect only in-memory UI state.
7. Refresh the browser or select Reset demo to restore the sample data.

## Architecture and handoff

### Route groups

- `src/app/layout.tsx`: global HTML/body, metadata and CSS only.
- `src/app/(public)/page.tsx`: `/` temporarily redirects to `/overview`. Replace this with a landing page later; future sign-in/sign-up pages belong in this group.
- `src/app/(household)/layout.tsx`: owns `DemoProvider` and `Shell`, preserving demo state between household pages.
- `src/app/(household)/overview/page.tsx`: dashboard at `/overview`.
- Other household routes remain `/records`, `/goals`, `/challenges`, `/community` and `/settings`.
- Parenthesised folders organise routes and do not appear in URLs or provide authentication. No login or admin endpoints are implemented yet. Future admin routes can live under `src/app/admin/` with a separate layout and server-side authorization.
- Responsive styling currently uses CSS Grid/Flexbox and media queries in `src/app/globals.css`; Tailwind is available but most existing styles are custom CSS.

- `src/app`: route composition, root layout and styling.
- `src/components`: shared UI and responsive navigation.
- `src/features`: dashboard, records, goals, challenges, community and privacy modules.
- `src/features/demo/provider.tsx`: shared in-memory state across client navigation.
- `src/features/records/domain.ts`: resource units, period totals and demo validation.
- `src/mocks/data.ts`: consistent fixtures. Dates deliberately fixed for repeatable demonstrations.
- `tests/domain.test.ts`: validation and resource/period aggregation checks.

## Checks

```sh
npm run test
npm run typecheck
npm run build
```

## Deliberate prototype boundaries

- No login, database, server mutations, RLS, data transmission or persistent browser storage. Database choice is pending team discussion; Supabase is not a dependency.
- Client validation is demonstration-only. Add authentication, server validation, ownership checks and database constraints before real data entry.
- Water (L), electricity (kWh) and waste (kg) only. Eco-actions are deferred.
- Entries contain period consumption, not cumulative meter readings. Same-resource overlapping periods are rejected to avoid double counting. Demo maximum ranges require domain review.
- Monthly/goal summaries count only records entirely within the selected period; weekly charts do the same per week. Cross-boundary records are not prorated. Empty chart buckets are not confirmed zero consumption.
- Goals show usage against a limit, not verified savings. Challenge completion and environmental benefits are not automatically certified.
- Community numbers, tip and challenge/badge conditions are illustrative. No leaderboard is published. Staff reporting, consent enforcement and small-cohort suppression remain future work.
- Accessibility foundation includes labelled inputs, keyboard focus, skip navigation, text chart summaries and responsive layouts. Formal WCAG audit remains part of later acceptance testing.

Framework setup follows the [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation).
