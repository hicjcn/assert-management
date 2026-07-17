-- CreateTable
CREATE TABLE `passkey_credentials` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `credential_id` VARCHAR(191) NOT NULL,
    `public_key` TEXT NOT NULL,
    `counter` BIGINT NOT NULL DEFAULT 0,
    `transports` TEXT NULL,
    `device_type` VARCHAR(191) NOT NULL,
    `backed_up` BOOLEAN NOT NULL DEFAULT false,
    `name` VARCHAR(191) NOT NULL,
    `last_used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `passkey_credentials_credential_id_key`(`credential_id`),
    INDEX `passkey_credentials_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `passkey_credentials`
    ADD CONSTRAINT `passkey_credentials_user_id_fkey`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;
