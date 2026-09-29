CREATE TABLE `poll_votes` (
    `poll_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `option_id` INTEGER UNSIGNED NOT NULL,

    INDEX `poll_votes_poll_id_option_id_idx`(`poll_id`, `option_id`),
    PRIMARY KEY (`poll_id`, `user_id`, `option_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_poll_id_fkey` FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `poll_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
