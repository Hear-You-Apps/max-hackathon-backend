ALTER TABLE `meetings` ADD COLUMN `participation_threshold_percent` TINYINT UNSIGNED NULL;

CREATE TABLE `polls` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `author_id` INTEGER UNSIGNED NULL,
    `question` VARCHAR(2000) NOT NULL,
    `audience` ENUM('all_residents', 'owners') NOT NULL,
    `allow_multiple` BOOLEAN NOT NULL DEFAULT false,
    `ends_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `polls_house_id_ends_at_id_idx`(`house_id`, `ends_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `poll_options` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `poll_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER UNSIGNED NOT NULL,

    INDEX `poll_options_poll_id_sort_order_id_idx`(`poll_id`, `sort_order`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `polls` ADD CONSTRAINT `polls_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `polls` ADD CONSTRAINT `polls_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `poll_options` ADD CONSTRAINT `poll_options_poll_id_fkey` FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
