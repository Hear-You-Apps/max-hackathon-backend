-- CreateTable
CREATE TABLE `meetings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `author_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `format` ENUM('in_person', 'absentee', 'mixed') NOT NULL DEFAULT 'absentee',
    `location` VARCHAR(500) NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `is_cancelled` BOOLEAN NOT NULL DEFAULT false,

    INDEX `meetings_house_id_is_cancelled_ends_at_id_idx`(`house_id`, `is_cancelled`, `ends_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_questions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `meeting_id` INTEGER UNSIGNED NOT NULL,
    `title` TEXT NOT NULL,
    `sort_order` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `meeting_questions_meeting_id_sort_order_id_idx`(`meeting_id`, `sort_order`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_votes` (
    `question_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `choice` ENUM('for', 'against', 'abstain') NOT NULL,

    PRIMARY KEY (`question_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_questions` ADD CONSTRAINT `meeting_questions_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_votes` ADD CONSTRAINT `meeting_votes_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `meeting_questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_votes` ADD CONSTRAINT `meeting_votes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

