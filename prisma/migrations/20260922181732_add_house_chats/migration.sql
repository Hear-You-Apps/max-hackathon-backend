-- CreateTable
CREATE TABLE `house_chats` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('chat', 'channel') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `sort_order` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `house_chats_house_id_sort_order_id_idx`(`house_id`, `sort_order`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `house_chats` ADD CONSTRAINT `house_chats_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
