-- SCSA Household Sustainability Challenge Platform
-- SQLite schema for a school-project MVP
-- Run this file before seed_and_demo.sql.

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    user_id          INTEGER PRIMARY KEY,
    email            TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash    TEXT NOT NULL,
    account_status   TEXT NOT NULL DEFAULT 'active'
                     CHECK (account_status IN ('active', 'disabled')),
    created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at    TEXT
);

CREATE TABLE IF NOT EXISTS household_profiles (
    profile_id        INTEGER PRIMARY KEY,
    user_id           INTEGER NOT NULL UNIQUE,
    display_name      TEXT NOT NULL,
    household_size    INTEGER NOT NULL DEFAULT 1 CHECK (household_size > 0),
    community_opt_in  INTEGER NOT NULL DEFAULT 0 CHECK (community_opt_in IN (0, 1)),
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    category_id        INTEGER PRIMARY KEY,
    category_code      TEXT NOT NULL UNIQUE,
    category_name      TEXT NOT NULL UNIQUE,
    default_unit       TEXT NOT NULL,
    progress_direction TEXT NOT NULL CHECK (progress_direction IN ('lower', 'higher')),
    is_active          INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS goals (
    goal_id         INTEGER PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    category_id     INTEGER NOT NULL,
    title           TEXT NOT NULL,
    target_value    REAL NOT NULL CHECK (target_value >= 0),
    baseline_value  REAL CHECK (baseline_value IS NULL OR baseline_value >= 0),
    period_type     TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'total')),
    start_date      TEXT NOT NULL,
    end_date        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (date(end_date) >= date(start_date)),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS activity_logs (
    log_id         INTEGER PRIMARY KEY,
    user_id        INTEGER NOT NULL,
    category_id    INTEGER NOT NULL,
    amount         REAL NOT NULL CHECK (amount >= 0),
    recorded_date  TEXT NOT NULL,
    notes          TEXT,
    created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS challenges (
    challenge_id   INTEGER PRIMARY KEY,
    category_id    INTEGER NOT NULL,
    title          TEXT NOT NULL,
    description    TEXT NOT NULL,
    target_value   REAL NOT NULL CHECK (target_value >= 0),
    duration_days  INTEGER NOT NULL CHECK (duration_days > 0),
    start_date     TEXT NOT NULL,
    end_date       TEXT NOT NULL,
    is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    CHECK (date(end_date) >= date(start_date)),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS user_challenges (
    user_challenge_id INTEGER PRIMARY KEY,
    user_id           INTEGER NOT NULL,
    challenge_id      INTEGER NOT NULL,
    joined_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    progress_value    REAL NOT NULL DEFAULT 0 CHECK (progress_value >= 0),
    status            TEXT NOT NULL DEFAULT 'joined'
                      CHECK (status IN ('joined', 'completed', 'abandoned')),
    completed_at      TEXT,
    UNIQUE (user_id, challenge_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
    badge_id         INTEGER PRIMARY KEY,
    badge_code       TEXT NOT NULL UNIQUE,
    badge_name       TEXT NOT NULL UNIQUE,
    description      TEXT NOT NULL,
    condition_type   TEXT NOT NULL
                     CHECK (condition_type IN ('log_count', 'category_total', 'challenge_count', 'streak_days')),
    threshold_value  REAL NOT NULL CHECK (threshold_value >= 0),
    icon_name        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_badge_id  INTEGER PRIMARY KEY,
    user_id        INTEGER NOT NULL,
    badge_id       INTEGER NOT NULL,
    awarded_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversion_factors (
    factor_id       INTEGER PRIMARY KEY,
    category_id     INTEGER NOT NULL,
    factor_value    REAL NOT NULL CHECK (factor_value >= 0),
    output_unit     TEXT NOT NULL DEFAULT 'kg CO2e',
    source_name     TEXT NOT NULL,
    source_url      TEXT,
    effective_from  TEXT NOT NULL,
    effective_to    TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    UNIQUE (category_id, effective_from),
    CHECK (effective_to IS NULL OR date(effective_to) >= date(effective_from)),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendation_rules (
    rule_id          INTEGER PRIMARY KEY,
    category_id      INTEGER NOT NULL,
    operator         TEXT NOT NULL CHECK (operator IN ('>', '>=', '<', '<=', '=', '!=')),
    threshold_value  REAL NOT NULL CHECK (threshold_value >= 0),
    evaluation_days  INTEGER NOT NULL DEFAULT 30 CHECK (evaluation_days > 0),
    message           TEXT NOT NULL,
    priority          INTEGER NOT NULL DEFAULT 100,
    is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_user_status
    ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
    ON activity_logs(user_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category_date
    ON activity_logs(category_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_challenges_dates
    ON challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status
    ON user_challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_category
    ON recommendation_rules(category_id, is_active, priority);

-- One row per goal, with activity accumulated inside that goal's date range.
CREATE VIEW IF NOT EXISTS v_goal_progress AS
WITH goal_actuals AS (
    SELECT
        g.goal_id,
        g.user_id,
        g.category_id,
        g.title,
        g.target_value,
        g.baseline_value,
        g.period_type,
        g.start_date,
        g.end_date,
        g.status,
        c.category_name,
        c.default_unit,
        c.progress_direction,
        COALESCE(SUM(a.amount), 0) AS actual_value
    FROM goals AS g
    JOIN categories AS c ON c.category_id = g.category_id
    LEFT JOIN activity_logs AS a
        ON a.user_id = g.user_id
       AND a.category_id = g.category_id
       AND date(a.recorded_date) BETWEEN date(g.start_date) AND date(g.end_date)
    GROUP BY
        g.goal_id, g.user_id, g.category_id, g.title, g.target_value,
        g.baseline_value, g.period_type, g.start_date, g.end_date,
        g.status, c.category_name, c.default_unit, c.progress_direction
)
SELECT
    goal_id,
    user_id,
    category_id,
    title,
    category_name,
    default_unit,
    progress_direction,
    target_value,
    baseline_value,
    actual_value,
    period_type,
    start_date,
    end_date,
    status,
    CASE
        WHEN progress_direction = 'lower' AND actual_value <= target_value THEN 1
        WHEN progress_direction = 'higher' AND actual_value >= target_value THEN 1
        ELSE 0
    END AS goal_met,
    ROUND(
        MIN(100.0,
            CASE
                WHEN progress_direction = 'higher' AND target_value > 0
                    THEN actual_value * 100.0 / target_value
                WHEN progress_direction = 'lower' AND actual_value = 0
                    THEN 100.0
                WHEN progress_direction = 'lower'
                    THEN target_value * 100.0 / actual_value
                ELSE 0
            END
        ), 1
    ) AS progress_percent
FROM goal_actuals;

-- Anonymous all-time community totals. Groups smaller than 3 households are hidden.
CREATE VIEW IF NOT EXISTS v_community_category_stats AS
WITH household_totals AS (
    SELECT
        a.user_id,
        a.category_id,
        SUM(a.amount) AS household_total
    FROM activity_logs AS a
    JOIN household_profiles AS hp ON hp.user_id = a.user_id
    WHERE hp.community_opt_in = 1
    GROUP BY a.user_id, a.category_id
)
SELECT
    c.category_id,
    c.category_name,
    c.default_unit,
    COUNT(*) AS participating_households,
    ROUND(SUM(ht.household_total), 2) AS community_total,
    ROUND(AVG(ht.household_total), 2) AS household_average
FROM household_totals AS ht
JOIN categories AS c ON c.category_id = ht.category_id
GROUP BY c.category_id, c.category_name, c.default_unit
HAVING COUNT(*) >= 3;

COMMIT;

