-- Useful read-only queries for the website demo.
-- The examples use Alice's user_id (1). Replace it with the signed-in user's id.

-- 1. Dashboard totals for the last 30 days.
SELECT
    c.category_name,
    c.default_unit,
    ROUND(COALESCE(SUM(a.amount), 0), 2) AS total_last_30_days
FROM categories AS c
LEFT JOIN activity_logs AS a
    ON a.category_id = c.category_id
   AND a.user_id = 1
   AND date(a.recorded_date) >= date('now', '-29 days')
WHERE c.is_active = 1
GROUP BY c.category_id, c.category_name, c.default_unit
ORDER BY c.category_id;

-- 2. Goal progress cards.
SELECT
    title,
    category_name,
    actual_value,
    target_value,
    default_unit,
    progress_percent,
    goal_met
FROM v_goal_progress
WHERE user_id = 1 AND status = 'active'
ORDER BY end_date;

-- 3. Activity trend for a simple chart.
SELECT
    recorded_date,
    ROUND(SUM(amount), 2) AS daily_amount
FROM activity_logs
WHERE user_id = 1
  AND category_id = 1
  AND date(recorded_date) >= date('now', '-29 days')
GROUP BY recorded_date
ORDER BY recorded_date;

-- 4. Rule-based recommendations.
WITH category_totals AS (
    SELECT
        c.category_id,
        COALESCE(SUM(a.amount), 0) AS total_value
    FROM categories AS c
    LEFT JOIN activity_logs AS a
        ON a.category_id = c.category_id
       AND a.user_id = 1
       AND date(a.recorded_date) >= date('now', '-29 days')
    GROUP BY c.category_id
)
SELECT
    c.category_name,
    ct.total_value,
    c.default_unit,
    r.message,
    r.priority
FROM recommendation_rules AS r
JOIN category_totals AS ct ON ct.category_id = r.category_id
JOIN categories AS c ON c.category_id = r.category_id
WHERE r.is_active = 1
  AND (
       (r.operator = '>'  AND ct.total_value >  r.threshold_value)
    OR (r.operator = '>=' AND ct.total_value >= r.threshold_value)
    OR (r.operator = '<'  AND ct.total_value <  r.threshold_value)
    OR (r.operator = '<=' AND ct.total_value <= r.threshold_value)
    OR (r.operator = '='  AND ct.total_value =  r.threshold_value)
    OR (r.operator = '!=' AND ct.total_value != r.threshold_value)
  )
ORDER BY r.priority;

-- 5. Joined challenges and progress.
SELECT
    ch.title,
    ch.description,
    uc.progress_value,
    ch.target_value,
    ROUND(MIN(100.0, uc.progress_value * 100.0 / NULLIF(ch.target_value, 0)), 1) AS progress_percent,
    uc.status,
    ch.end_date
FROM user_challenges AS uc
JOIN challenges AS ch ON ch.challenge_id = uc.challenge_id
WHERE uc.user_id = 1
ORDER BY ch.end_date;

-- 6. Earned badges.
SELECT
    b.badge_name,
    b.description,
    b.icon_name,
    ub.awarded_at
FROM user_badges AS ub
JOIN badges AS b ON b.badge_id = ub.badge_id
WHERE ub.user_id = 1
ORDER BY ub.awarded_at DESC;

-- 7. Anonymous community report for the last 30 days.
-- Results are shown only when at least 3 opted-in households contributed.
WITH household_totals AS (
    SELECT
        a.user_id,
        a.category_id,
        SUM(a.amount) AS household_total
    FROM activity_logs AS a
    JOIN household_profiles AS hp ON hp.user_id = a.user_id
    WHERE hp.community_opt_in = 1
      AND date(a.recorded_date) >= date('now', '-29 days')
    GROUP BY a.user_id, a.category_id
)
SELECT
    c.category_name,
    c.default_unit,
    COUNT(*) AS participating_households,
    ROUND(SUM(ht.household_total), 2) AS community_total,
    ROUND(AVG(ht.household_total), 2) AS household_average
FROM household_totals AS ht
JOIN categories AS c ON c.category_id = ht.category_id
GROUP BY c.category_id, c.category_name, c.default_unit
HAVING COUNT(*) >= 3
ORDER BY c.category_id;

-- 8. Estimated impact using the current demo conversion factors.
-- Replace the illustrative factors before making real-world claims.
SELECT
    c.category_name,
    ROUND(SUM(a.amount), 2) AS activity_total,
    c.default_unit,
    cf.factor_value,
    cf.output_unit,
    ROUND(SUM(a.amount * cf.factor_value), 2) AS estimated_impact
FROM activity_logs AS a
JOIN categories AS c ON c.category_id = a.category_id
JOIN conversion_factors AS cf
    ON cf.factor_id = (
        SELECT cf2.factor_id
        FROM conversion_factors AS cf2
        WHERE cf2.category_id = a.category_id
          AND cf2.is_active = 1
          AND date(cf2.effective_from) <= date(a.recorded_date)
          AND (cf2.effective_to IS NULL OR date(cf2.effective_to) >= date(a.recorded_date))
        ORDER BY date(cf2.effective_from) DESC
        LIMIT 1
    )
WHERE a.user_id = 1
  AND date(a.recorded_date) >= date('now', '-29 days')
GROUP BY c.category_id, c.category_name, c.default_unit, cf.factor_value, cf.output_unit
ORDER BY c.category_id;

