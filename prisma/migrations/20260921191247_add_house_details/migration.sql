-- AlterTable
ALTER TABLE `houses` ADD COLUMN `payment_url` VARCHAR(2048) NULL,
    ADD COLUMN `year_built` SMALLINT UNSIGNED NULL;

-- CreateTable
CREATE TABLE `house_contacts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('dispatcher', 'emergency', 'plumber', 'electrician', 'representative', 'passport_office', 'other') NOT NULL DEFAULT 'other',
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(64) NULL,
    `address` VARCHAR(500) NULL,
    `working_hours` VARCHAR(255) NULL,
    `messenger_url` VARCHAR(2048) NULL,
    `sort_order` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `house_contacts_house_id_sort_order_id_idx`(`house_id`, `sort_order`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `house_events` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('water_outage', 'power_outage', 'cleaning', 'maintenance', 'other') NOT NULL DEFAULT 'other',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NULL,
    `location` VARCHAR(500) NULL,
    `is_cancelled` BOOLEAN NOT NULL DEFAULT false,

    INDEX `house_events_house_id_is_cancelled_starts_at_id_idx`(`house_id`, `is_cancelled`, `starts_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `house_contacts` ADD CONSTRAINT `house_contacts_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `house_events` ADD CONSTRAINT `house_events_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
