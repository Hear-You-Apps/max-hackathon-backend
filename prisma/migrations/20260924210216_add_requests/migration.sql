-- CreateTable
CREATE TABLE `service_requests` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `author_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('management', 'electrician', 'plumber', 'duty') NOT NULL,
    `location_type` ENUM('apartment', 'entrance', 'yard') NOT NULL,
    `apartment_id` INTEGER UNSIGNED NULL,
    `location_text` VARCHAR(500) NULL,
    `visibility` ENUM('private', 'house') NOT NULL DEFAULT 'private',
    `status` ENUM('submitted', 'in_review', 'in_progress', 'resolved', 'closed', 'cancelled') NOT NULL DEFAULT 'submitted',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `service_requests_house_id_author_id_created_at_id_idx`(`house_id`, `author_id`, `created_at`, `id`),
    INDEX `service_requests_house_id_visibility_created_at_id_idx`(`house_id`, `visibility`, `created_at`, `id`),
    UNIQUE INDEX `service_requests_id_house_id_key`(`id`, `house_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_events` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('submitted', 'in_review', 'in_progress', 'resolved', 'closed', 'cancelled') NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `request_events_request_id_created_at_id_idx`(`request_id`, `created_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stored_files` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `owner_id` INTEGER UNSIGNED NULL,
    `request_id` INTEGER UNSIGNED NULL,
    `storage_key` VARCHAR(36) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stored_files_storage_key_key`(`storage_key`),
    INDEX `stored_files_house_id_owner_id_request_id_idx`(`house_id`, `owner_id`, `request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_apartment_id_house_id_fkey` FOREIGN KEY (`apartment_id`, `house_id`) REFERENCES `apartments`(`id`, `house_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_events` ADD CONSTRAINT `request_events_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stored_files` ADD CONSTRAINT `stored_files_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stored_files` ADD CONSTRAINT `stored_files_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stored_files` ADD CONSTRAINT `stored_files_request_id_house_id_fkey` FOREIGN KEY (`request_id`, `house_id`) REFERENCES `service_requests`(`id`, `house_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

