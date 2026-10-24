# Sustainable Communities SA — Household Sustainability Platform

A privacy-first sustainability platform for **Sustainable Communities SA (SCSA)**. Households manually record water, electricity and waste usage, set personal goals, join shared challenges and compare challenge points through optional pseudonymous community leaderboards.

The platform encourages reflection and participation through self-reported data. It does not verify utility bills, meter readings or waste measurements independently.

## Design at a glance

- **One account represents one household.** Each household owns its records, goals and sharing preferences.
- **Three resources, three units:** electricity in **kWh**, water in **litres (L)** and waste in **kilograms (kg)**.
- **Goals support personal progress.** A household can earn goal badges without joining challenges or sharing publicly.
- **Challenges support shared participation.** Administrators set usage limits, dates and reward points; households choose which challenges to join.
- **Resources are ranked separately.** Electricity, water and waste points are never combined into an overall score.
- **Sharing is optional.** Community analytics and leaderboard visibility have separate consent settings, both off by default.

## Using the platform

1. **Create an account and sign in.** Complete email verification when prompted.
2. **Open Settings.** Set your household name and size, choose a Community Area and review the two sharing options.
3. **Add usage records.** Select a resource, enter the period it covers and record the quantity used during that period.
4. **Set a personal Goal.** Choose a weekly or monthly usage limit and track its status in Goals and Overview.
5. **Join a Challenge.** Review its dates, points and usage limit, then follow your progress on its card.
6. **Claim eligible challenge points.** After the challenge ends, complete records within the limit allow you to claim its reward once.
7. **Visit Community.** View community participation statistics and separate resource leaderboards for the selected week or month.

### Main pages

| Page | Purpose |
| --- | --- |
| `/overview` | Household usage summary and personal goal badges. |
| `/records` | Add, view, edit and delete household usage records. |
| `/goals` | Create and manage personal usage limits. |
| `/challenges` | Explore challenges, join or leave, check progress and claim points. |
| `/community` | Community statistics and electricity, water and waste rankings. |
| `/settings` | Household details, Community Area and privacy preferences. |
| `/admin` | Administrator overview. |
| `/admin/challenges` | Create and manage challenges, including reward points. |
| `/admin/users` | Manage household accounts. |

Household pages require sign-in. Administrator routes and APIs also check the account's server-side role; showing or hiding a navigation item is not the authorization mechanism.

## Usage records and date rules

A record stores **usage during an inclusive date range**, not a cumulative meter reading. For example, a record of 80 kWh covering 12–18 October represents the total electricity used over those seven days.

- Quantities must be finite, non-negative numbers within the resource's accepted range.
- The same household cannot enter overlapping records for the same resource.
- **Only records fully contained within a Goal or Challenge period count towards it.** Partially overlapping records are excluded; usage is not prorated across days.
- Missing records are not treated as zero usage. An explicit zero-usage record is different from an unrecorded period.
- Completion requires records covering every day of the period, with total usage **at or below** the limit.

For example, a record covering 26 October–1 November does not count towards an October-only monthly target. Use non-overlapping records aligned with the target periods when accurate measurements are available.

New Goals and Challenges use predefined calendar periods, interpreted in **Australia/Adelaide** time:

| Period | Definition |
| --- | --- |
| Weekly | Monday through Sunday, inclusive. |
| Monthly | First through last day of the calendar month. |

Households can create a Goal for the current week or a later week beginning in the current month, or for the current calendar month. A final weekly period may extend into the following month. Administrators can schedule Challenges for current or future periods without the Goal's current-month restriction. Existing legacy periods can remain unchanged when editing.

## Goals and personal badges

A **Goal** is a household-defined usage limit. It is intended for private tracking and personal achievement, rather than competition.

Overview displays a status indicator for each goal:

- **Green:** recorded usage has not exceeded the limit. This alone does not mean the goal is achieved.
- **Red:** recorded usage exceeds the limit.
- **Grey:** no qualifying data is available, or the period has not started.
- **Green achievement tick:** the period has ended, records cover the full period and total usage is at or below the limit.

Goal badges are calculated from the household's saved goals and records. Editing or deleting those sources can change the badge status. They do **not** award leaderboard points and do not require Challenge participation or public sharing.

## Challenges and reward points

A **Challenge** is an administrator-defined resource usage limit with a start date, end date and point reward. Households opt in before the challenge ends.

Challenge cards show the resource, dates and points before their details are expanded. Joined challenges also display usage against the limit and the number of days recorded.

| Card status | Meaning |
| --- | --- |
| Upcoming | The challenge has not started. |
| No records yet | No qualifying usage records are available. |
| Within limit so far | The challenge is ongoing and recorded usage has not exceeded the limit. |
| Limit exceeded | Recorded usage is above the limit. |
| Incomplete records | The period has ended, but full-period coverage is missing. |
| Achieved | The period has ended and the recorded data meets the completion rules. |
| Completed | The household has successfully claimed its points. |

The progress bar shows **how much of the usage limit has been consumed**, not a completion percentage. Lower usage is better; reaching 100% means the household has used its entire allowance.

### Claiming points

A challenge ending on 18 October becomes eligible for claiming from **19 October at 00:00 Adelaide time**. The household selects **Claim points**, and the database rechecks membership, the end date, record coverage, usage and reward configuration.

- `challenges.reward_points` defines the reward offered by a challenge.
- `challenge_rewards` records a household's actual award, including points, resource, award time and the usage/target snapshot.
- Each household can receive a challenge's reward only once.
- Already-awarded points remain a historical snapshot; subsequent record edits do not automatically recalculate them. Resetting household activity clears its reward records.
- A challenge without configured points cannot issue a reward.

Challenge rewards are **points-only**. Personal badges come from Goals; legacy Challenge badge fields are not used by the current points flow.

## Community statistics and leaderboards

Community uses the household's currently selected Community Area. Select an area in Settings before viewing the page.

### Participation statistics

These cards include households that have enabled **community analytics sharing**:

| Statistic | What is counted |
| --- | --- |
| Participating households | Households currently in the area with analytics sharing enabled; this is not limited to accounts created during the selected period. |
| Usage records contributed | Records whose usage date ranges overlap the selected week or month. This counts records, not units consumed. |
| Challenge participations | Current membership records created during the selected period: new joins, not completed challenges or unique participants. |

The overlap rule here counts contributions to a period; it does not change the stricter fully-contained-record rule used to determine Goal or Challenge completion.

Aggregate visibility is deployment-configurable through `scsa_community_private.community_statistics_config.min_household_count`. A group below that threshold displays **Hidden**. This setting is separate from individual leaderboard consent.

### Separate resource rankings

The default view is **Weekly**, with a **Monthly** option. Both use the date on which points were **claimed**, in Adelaide time, rather than the challenge's start or end date.

For example, completing a challenge for 12–18 October and claiming 100 electricity points on 24 October adds those points to the week containing 24 October and to October's monthly electricity ranking.

Within each resource, points from eligible awards are added together:

- Water challenges worth 100, 50 and 20 points produce **170 water points**.
- Electricity challenges worth 80 and 70 points produce **150 electricity points**.
- These totals appear on separate boards; there is no combined 320-point ranking.

Only households in the selected area with **leaderboard sharing enabled** appear. Rankings show pseudonyms and points, never household display names, email addresses or raw usage records.

- Each board lists up to 50 households and separately shows **Your rank**, even when it is outside the top 50.
- The signed-in household is highlighted with a **You** label.
- Equal point totals share a rank. Competition ranking uses positions such as **1, 1, 3**.
- No qualifying awards means an empty state, not sample rankings.

### Why statistics and points can differ

A household may have no usage records overlapping this week and no new joins this week, yet still appear in this week's ranking after claiming a reward for an earlier challenge. The statistics use usage dates or joining dates; rankings use award dates.

## Privacy and identity

The two Settings toggles are independent:

| Setting | Effect |
| --- | --- |
| `share_analytics` | Includes the household's contributions in Community participation statistics. |
| `display_leaderboard` | Publishes the household's pseudonym and eligible challenge points in its Community leaderboard. |

Both start disabled. A household can use Records, Goals and personal badges without enabling either option.

The **household name** is used in the account interface and account management. It is not the public leaderboard name. The **pseudonym** is a persistent generated name such as `Northern Bear 12`; the suffix avoids duplicate names and is not a rank. Changing the household name does not change the pseudonym.

Authentication is handled by Supabase Auth. Row-level security and server-side authorization restrict access to household-owned data. Administrator account management does not automatically grant access to other households' raw usage records.

## Technology and project structure

- **Next.js App Router, React and TypeScript** for pages and application logic.
- **Supabase Auth and PostgreSQL** for authentication, persistence, row-level security and database functions.
- **Plain CSS and CSS Modules** for responsive layouts. The global stylesheet still imports Tailwind for its base reset (Preflight), so the Tailwind PostCSS plugin remains required; feature layouts primarily use custom CSS.
- **Vercel** as the deployment target.

```text
src/
  app/
    (public)/          Sign-in, sign-up and public entry routes
    (household)/       Household and administrator pages
    api/               Next.js Route Handlers
  components/          Shared interface components
  features/            Feature interfaces, domain logic and API clients
    <feature>/server/  Server-side feature services
  lib/                 Shared validation, periods and Supabase clients
supabase/
  migrations/          Versioned database changes
  seed.sql             Optional development fixtures
tests/                Domain, API and local database tests
```

## Run locally

### Prerequisites

- Node.js **22.13 or later** and pnpm. This repository uses `pnpm-lock.yaml`.
- A Supabase project with the application's current schema, policies and functions applied.

**Database setup note:** the migration directory contains the initial schema and later upgrades, but some prerequisite changes from the shared development database are not yet represented in this checkout. Do not assume applying these files alone creates a complete fresh deployment. See [migration notes](supabase/migrations/README.md) before setting up a new database. Do not rerun the initial migration against an existing project.

### Install and configure

```sh
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env.local`, then provide:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
```

The server-only key is needed by administrator APIs and the active-account status checks used by authenticated APIs. Never expose it with a `NEXT_PUBLIC_` prefix or commit `.env.local`.

For the current sign-up flow, enable email confirmation in Supabase and configure the sign-up confirmation email template to include `{{ .Token }}`. The interface verifies an emailed code and checks that the household profile and ordinary account role were initialized.

```sh
pnpm dev
```

Open **http://localhost:3000**. The entry route leads to Overview; unauthenticated visitors are directed to sign-in. Stop the development server with **Ctrl+C**.

### Checks and production build

```sh
pnpm test
pnpm test:db
pnpm typecheck
pnpm build
pnpm start
```

`test:db` uses local PGlite PostgreSQL tests and does not write to the cloud database. `database.test.mjs` verifies the initial migration's historical schema and permissions; `challenge-rewards-db.test.mjs` verifies the newer points, leaderboard and pseudonym migrations with their prerequisites. Neither is a complete replica of the current cloud schema. Browser checks and real Supabase Auth, email and policy integration checks remain part of release verification. If dependencies are already installed, the equivalent scripts can also be run with `npm run <script>`.

When deploying to Vercel, configure the environment variables there and configure the relevant Supabase authentication URLs. Database migrations are a separate deployment step; deploying the website does not apply them automatically.

## Current scope and limitations

- Input is manual and self-reported; points and badges reflect submitted records, not independently verified environmental savings.
- Public transport and other qualitative eco-actions are outside the current MVP.
- Partial-period records are not prorated into Goals or Challenges.
- Points from different resources have no shared weighting and are not combined.
- The interface includes responsive layouts, input labels, keyboard focus states and status text. Formal WCAG 2.2 AA conformance has not been certified.
