-- Preserve one monthly budget per user from the most recently updated goal.
INSERT INTO `settings` (`id`, `user_id`, `key`, `value`, `created_at`, `updated_at`)
SELECT
    UUID(),
    `latest_goals`.`user_id`,
    'goal_monthly_budget',
    JSON_OBJECT(
        'monthlyIncome', CAST(`latest_goals`.`monthly_income` AS CHAR),
        'monthlyRent', CAST(`latest_goals`.`monthly_rent` AS CHAR),
        'monthlyFood', CAST(`latest_goals`.`monthly_food` AS CHAR),
        'monthlyLiving', CAST(`latest_goals`.`monthly_living` AS CHAR),
        'monthlyOtherExpense', CAST(`latest_goals`.`monthly_other_expense` AS CHAR),
        'monthlyOtherIncome', CAST(`latest_goals`.`monthly_other_income` AS CHAR)
    ),
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM (
    SELECT
        `ranked_goals`.*
    FROM (
        SELECT
            `goals`.*,
            ROW_NUMBER() OVER (
                PARTITION BY `goals`.`user_id`
                ORDER BY `goals`.`updated_at` DESC, `goals`.`created_at` DESC, `goals`.`id` DESC
            ) AS `goal_rank`
        FROM `goals`
    ) AS `ranked_goals`
    WHERE `ranked_goals`.`goal_rank` = 1
) AS `latest_goals`
WHERE NOT EXISTS (
    SELECT 1
    FROM `settings`
    WHERE
        `settings`.`user_id` = `latest_goals`.`user_id`
        AND `settings`.`key` = 'goal_monthly_budget'
);

ALTER TABLE `goals`
    DROP COLUMN `monthly_income`,
    DROP COLUMN `monthly_rent`,
    DROP COLUMN `monthly_food`,
    DROP COLUMN `monthly_living`,
    DROP COLUMN `monthly_other_expense`,
    DROP COLUMN `monthly_other_income`;
