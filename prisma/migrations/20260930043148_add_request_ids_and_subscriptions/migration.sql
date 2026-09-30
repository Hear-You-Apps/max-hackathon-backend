ALTER TABLE `service_requests` ADD COLUMN `public_id` CHAR(36) NULL;

UPDATE `service_requests` SET `public_id` = LOWER(CONCAT(
    HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', RIGHT(HEX(RANDOM_BYTES(2)), 3),
    '-8', RIGHT(HEX(RANDOM_BYTES(2)), 3), '-', HEX(RANDOM_BYTES(6))
)) WHERE `public_id` IS NULL;

CREATE UNIQUE INDEX `service_requests_public_id_key` ON `service_requests`(`public_id`);

CREATE TABLE `request_subscriptions` (
    `request_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `request_subscriptions_user_id_idx`(`user_id`),
    PRIMARY KEY (`request_id`,`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `request_subscriptions` ADD CONSTRAINT `request_subscriptions_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `request_subscriptions` ADD CONSTRAINT `request_subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
