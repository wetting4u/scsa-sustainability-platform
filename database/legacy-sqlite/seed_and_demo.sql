-- Initial reference data and a small demo dataset.
-- Values marked as demo/illustrative must not be used for official reporting.

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

INSERT OR IGNORE INTO categories
    (category_id, category_code, category_name, default_unit, progress_direction)
VALUES
    (1, 'electricity', 'Electricity', 'kWh',    'lower'),
    (2, 'water',       'Water',       'litres', 'lower'),
    (3, 'waste',       'Waste',       'kg',     'lower'),
    (4, 'eco_action',  'Eco Action',  'count',  'higher');

INSERT OR IGNORE INTO badges
    (badge_id, badge_code, badge_name, description, condition_type, threshold_value, icon_name)
VALUES
    (1, 'FIRST_LOG', 'First Step', 'Record the first sustainability activity.', 'log_count', 1, 'footprints'),
    (2, 'ECO_STARTER', 'Eco Starter', 'Record 10 eco actions.', 'category_total', 10, 'leaf'),
    (3, 'CHALLENGE_FINISHER', 'Challenge Finisher', 'Complete one challenge.', 'challenge_count', 1, 'trophy'),
    (4, 'SEVEN_DAY_STREAK', 'Seven Day Streak', 'Record activity on seven consecutive days.', 'streak_days', 7, 'flame');

INSERT OR IGNORE INTO challenges
    (challenge_id, category_id, title, description, target_value, duration_days, start_date, end_date, is_active)
VALUES
    (1, 4, '7-Day Eco Action Challenge', 'Complete at least one eco action each day for seven days.', 7, 7,
     date('now', '-3 days'), date('now', '+3 days'), 1),
    (2, 2, 'Water Wise Week', 'Keep the household water total at or below the weekly target.', 900, 7,
     date('now', '-3 days'), date('now', '+3 days'), 1);

INSERT OR IGNORE INTO conversion_factors
    (factor_id, category_id, factor_value, output_unit, source_name, source_url, effective_from, is_active)
VALUES
    (1, 1, 0.5000, 'kg CO2e', 'Illustrative demo factor - replace with a cited source', NULL, '2025-01-01', 1),
    (2, 2, 0.0003, 'kg CO2e', 'Illustrative demo factor - replace with a cited source', NULL, '2025-01-01', 1),
    (3, 3, 0.5800, 'kg CO2e', 'Illustrative demo factor - replace with a cited source', NULL, '2025-01-01', 1);

INSERT OR IGNORE INTO recommendation_rules
    (rule_id, category_id, operator, threshold_value, evaluation_days, message, priority, is_active)
VALUES
    (1, 1, '>', 150, 30, 'Electricity use is above the demo threshold. Switch off standby devices and review heating or cooling settings.', 10, 1),
    (2, 2, '>', 3000, 30, 'Water use is above the demo threshold. Check for leaks and shorten shower time.', 20, 1),
    (3, 3, '>', 10, 30, 'Waste is above the demo threshold. Plan meals and separate recyclable materials.', 30, 1),
    (4, 4, '<', 5, 30, 'Try one small eco action this week, such as using a reusable bottle or walking for a short trip.', 40, 1);

-- Password values below are placeholders, not valid production password hashes.
INSERT OR IGNORE INTO users
    (user_id, email, password_hash, account_status)
VALUES
    (1, 'alice@example.com', 'DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH', 'active'),
    (2, 'ben@example.com',   'DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH', 'active'),
    (3, 'chloe@example.com', 'DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH', 'active');

INSERT OR IGNORE INTO household_profiles
    (profile_id, user_id, display_name, household_size, community_opt_in)
VALUES
    (1, 1, 'Alice Household', 3, 1),
    (2, 2, 'Ben Household',   2, 1),
    (3, 3, 'Chloe Household', 4, 1);

INSERT OR IGNORE INTO goals
    (goal_id, user_id, category_id, title, target_value, baseline_value, period_type, start_date, end_date, status)
VALUES
    (1, 1, 1, 'Keep monthly electricity at 120 kWh or less', 120, 160, 'monthly', date('now', '-29 days'), date('now'), 'active'),
    (2, 1, 4, 'Complete 10 eco actions this month', 10, NULL, 'monthly', date('now', '-29 days'), date('now'), 'active'),
    (3, 2, 2, 'Keep monthly water at 1800 litres or less', 1800, 2400, 'monthly', date('now', '-29 days'), date('now'), 'active');

INSERT OR IGNORE INTO activity_logs
    (log_id, user_id, category_id, amount, recorded_date, notes)
VALUES
    (1,  1, 1, 42.0, date('now', '-20 days'), 'Electricity meter entry'),
    (2,  1, 1, 39.0, date('now', '-10 days'), 'Electricity meter entry'),
    (3,  1, 1, 36.0, date('now', '-1 day'),   'Electricity meter entry'),
    (4,  1, 2, 850,  date('now', '-14 days'), 'Water meter entry'),
    (5,  1, 2, 820,  date('now', '-2 days'),  'Water meter entry'),
    (6,  1, 3, 3.2,  date('now', '-12 days'), 'General waste'),
    (7,  1, 3, 2.5,  date('now', '-3 days'),  'General waste'),
    (8,  1, 4, 1,    date('now', '-6 days'),  'Used public transport'),
    (9,  1, 4, 2,    date('now', '-4 days'),  'Reusable bottle and shopping bag'),
    (10, 1, 4, 1,    date('now', '-2 days'),  'Meat-free meal'),
    (11, 1, 4, 2,    date('now', '-1 day'),   'Walked and recycled'),
    (12, 2, 1, 132,  date('now', '-2 days'),  'Monthly electricity'),
    (13, 2, 2, 1750, date('now', '-2 days'),  'Monthly water'),
    (14, 2, 3, 8.4,  date('now', '-2 days'),  'Monthly waste'),
    (15, 2, 4, 8,    date('now', '-2 days'),  'Monthly eco actions'),
    (16, 3, 1, 146,  date('now', '-2 days'),  'Monthly electricity'),
    (17, 3, 2, 2600, date('now', '-2 days'),  'Monthly water'),
    (18, 3, 3, 9.1,  date('now', '-2 days'),  'Monthly waste'),
    (19, 3, 4, 5,    date('now', '-2 days'),  'Monthly eco actions');

INSERT OR IGNORE INTO user_challenges
    (user_challenge_id, user_id, challenge_id, joined_at, progress_value, status, completed_at)
VALUES
    (1, 1, 1, datetime('now', '-3 days'), 5, 'joined', NULL),
    (2, 2, 1, datetime('now', '-3 days'), 7, 'completed', datetime('now', '-1 day')),
    (3, 3, 2, datetime('now', '-3 days'), 780, 'joined', NULL);

INSERT OR IGNORE INTO user_badges
    (user_badge_id, user_id, badge_id, awarded_at)
VALUES
    (1, 1, 1, datetime('now', '-20 days')),
    (2, 2, 1, datetime('now', '-2 days')),
    (3, 2, 3, datetime('now', '-1 day')),
    (4, 3, 1, datetime('now', '-2 days'));

COMMIT;

