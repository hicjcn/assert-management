-- Goal progress is now derived from live account balances instead of a manually
-- maintained snapshot. Existing goals keep their target and forecast fields;
-- goals without links automatically use the user's current net worth.
CREATE TABLE `goal_accounts` (
    `goal_id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,

    INDEX `goal_accounts_account_id_idx`(`account_id`),
    PRIMARY KEY (`goal_id`, `account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `goal_accounts`
    ADD CONSTRAINT `goal_accounts_goal_id_fkey`
        FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `goal_accounts_account_id_fkey`
        FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `goals` DROP COLUMN `current_amount`;
