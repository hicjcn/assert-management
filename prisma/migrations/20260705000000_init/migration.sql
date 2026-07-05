-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'VIRTUAL_ACCOUNT', 'INVESTMENT', 'LIABILITY_ACCOUNT', 'BOND') NOT NULL,
    `account_type` ENUM('ASSET', 'LIABILITY') NOT NULL,
    `current_amount` BIGINT NOT NULL DEFAULT 0,
    `include_in_stats` BOOLEAN NOT NULL DEFAULT true,
    `archived` BOOLEAN NOT NULL DEFAULT false,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `accounts_user_id_idx`(`user_id`),
    INDEX `accounts_category_idx`(`category`),
    INDEX `accounts_archived_idx`(`archived`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_changes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `account_name_snapshot` VARCHAR(191) NOT NULL,
    `category_snapshot` ENUM('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'VIRTUAL_ACCOUNT', 'INVESTMENT', 'LIABILITY_ACCOUNT', 'BOND') NOT NULL,
    `change_type` ENUM('INITIAL', 'INCREASE', 'DECREASE', 'SET', 'CORRECTION') NOT NULL,
    `before_amount` BIGINT NOT NULL,
    `change_amount` BIGINT NOT NULL,
    `after_amount` BIGINT NOT NULL,
    `note` TEXT NULL,
    `changed_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `account_changes_user_id_changed_at_idx`(`user_id`, `changed_at`),
    INDEX `account_changes_account_id_idx`(`account_id`),
    INDEX `account_changes_change_type_idx`(`change_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goals` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `target_amount` BIGINT NOT NULL,
    `current_amount` BIGINT NOT NULL DEFAULT 0,
    `monthly_income` BIGINT NOT NULL DEFAULT 0,
    `monthly_rent` BIGINT NOT NULL DEFAULT 0,
    `monthly_food` BIGINT NOT NULL DEFAULT 0,
    `monthly_living` BIGINT NOT NULL DEFAULT 0,
    `monthly_other_expense` BIGINT NOT NULL DEFAULT 0,
    `monthly_other_income` BIGINT NOT NULL DEFAULT 0,
    `one_time_income` BIGINT NOT NULL DEFAULT 0,
    `one_time_expense` BIGINT NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `goals_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_user_id_key_key`(`user_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_changes` ADD CONSTRAINT `account_changes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_changes` ADD CONSTRAINT `account_changes_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goals` ADD CONSTRAINT `goals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
