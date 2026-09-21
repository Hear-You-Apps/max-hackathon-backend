-- AlterTable
ALTER TABLE `house_memberships` ADD COLUMN `last_left_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `house_join_requests` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
