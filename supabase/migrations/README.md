# PostgreSQL migrations

`20260917000100_initial_schema.sql` defines the initial schema for a fresh Supabase project, including tables, constraints, Auth triggers, grants and row-level security (RLS).
Apply migrations in filename order. The initial migration is not a repeatable database reset script.

The database maintainer coordinates changes to the shared development project. Do not change executable SQL in previously applied migrations; add a new migration for subsequent changes and commit it to Git. Comment-only translations do not change SQL behavior.
Switching Git branches does not switch the cloud database.

SQL executed manually in the Supabase SQL Editor does not automatically become part of the CLI migration history. Confirm the applied schema and reconcile migration history before using CLI deployment commands. Do not rerun the initial migration against an existing database.


## Challenge points and leaderboards

`20261024093319_challenge_points_leaderboards.sql` was applied to the development project.
It upgrades the team's existing cloud schema, including `challenge_rewards`, community areas,
household size limits and the account reset function. These prerequisite team migrations are
not all present in this checkout; this file alone is not a fresh-project bootstrap.

Challenges now award points without badges. An authenticated household explicitly claims after
the period ends, with complete, fully enclosed records and usage at or below the limit.
Each household/challenge pair can be awarded once. The ledger preserves points and resource
at award time; later source edits do not recalculate issued points. Account reset clears them.
Weekly/monthly resource leaderboards use the award date in Australia/Adelaide, the household's
current community area and its current leaderboard consent. They expose pseudonyms only.
Run `npm test` and `npm run test:db` for API and local PostgreSQL acceptance checks.


`20261024102759_friendly_leaderboard_identity.sql` replaces legacy UUID pseudonyms
with persistent adjective/animal/number names and updates the default for new households.
Custom names are preserved. Resource rankings include a requester-only `isMe` marker and
`myEntries` outside the top-50 limit; opted-out households have no published rank.
Names and rank responses do not expose Auth user IDs. Equal scores share a competition rank.
