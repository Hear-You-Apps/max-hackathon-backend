-- CreateTable
CREATE TABLE `meeting_participations` (
    `meeting_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `will_attend` BOOLEAN NOT NULL,

    INDEX `meeting_participations_meeting_id_will_attend_idx`(`meeting_id`, `will_attend`),
    PRIMARY KEY (`meeting_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `meeting_participations` ADD CONSTRAINT `meeting_participations_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_participations` ADD CONSTRAINT `meeting_participations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
