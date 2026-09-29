ALTER TABLE `meetings` ADD COLUMN `audience` ENUM('all_residents', 'owners') NOT NULL DEFAULT 'owners';
