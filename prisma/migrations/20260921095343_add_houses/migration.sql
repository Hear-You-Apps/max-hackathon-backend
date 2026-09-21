-- CreateTable
CREATE TABLE `houses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(500) NOT NULL,
    `management_company_name` VARCHAR(255) NULL,
    `admin_contact_url` VARCHAR(2048) NULL,
    `apartments_count` INTEGER UNSIGNED NULL,
    `entrances_count` INTEGER UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `house_memberships` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('approved', 'revoked', 'left') NOT NULL DEFAULT 'approved',
    `revocation_reason` TEXT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `notify_meetings` BOOLEAN NOT NULL DEFAULT false,
    `notify_requests` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `house_memberships_user_id_house_id_key`(`user_id`, `house_id`),
    UNIQUE INDEX `house_memberships_id_house_id_key`(`id`, `house_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `house_member_roles` (
    `membership_id` INTEGER UNSIGNED NOT NULL,
    `role` ENUM('resident', 'organizer', 'house_council', 'house_admin') NOT NULL,

    PRIMARY KEY (`membership_id`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apartments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `number` VARCHAR(32) NOT NULL,

    UNIQUE INDEX `apartments_house_id_number_key`(`house_id`, `number`),
    UNIQUE INDEX `apartments_id_house_id_key`(`id`, `house_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apartment_memberships` (
    `membership_id` INTEGER UNSIGNED NOT NULL,
    `apartment_id` INTEGER UNSIGNED NOT NULL,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `relationship` ENUM('owner', 'tenant') NOT NULL,
    `verification_status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',

    PRIMARY KEY (`membership_id`, `apartment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `house_join_requests` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `house_id` INTEGER UNSIGNED NOT NULL,
    `apartment_number` VARCHAR(32) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `relationship` ENUM('owner', 'tenant') NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `rejection_reason` TEXT NULL,
    `notify_meetings` BOOLEAN NOT NULL DEFAULT false,
    `notify_requests` BOOLEAN NOT NULL DEFAULT false,

    INDEX `house_join_requests_user_id_status_idx`(`user_id`, `status`),
    INDEX `house_join_requests_house_id_status_idx`(`house_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `house_memberships` ADD CONSTRAINT `house_memberships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `house_memberships` ADD CONSTRAINT `house_memberships_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `house_member_roles` ADD CONSTRAINT `house_member_roles_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `house_memberships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apartments` ADD CONSTRAINT `apartments_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apartment_memberships` ADD CONSTRAINT `apartment_memberships_membership_id_house_id_fkey` FOREIGN KEY (`membership_id`, `house_id`) REFERENCES `house_memberships`(`id`, `house_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apartment_memberships` ADD CONSTRAINT `apartment_memberships_apartment_id_house_id_fkey` FOREIGN KEY (`apartment_id`, `house_id`) REFERENCES `apartments`(`id`, `house_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `house_join_requests` ADD CONSTRAINT `house_join_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `house_join_requests` ADD CONSTRAINT `house_join_requests_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
