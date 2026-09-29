ALTER TABLE `users` ADD COLUMN `notifications_enabled` BOOLEAN NOT NULL DEFAULT false;

UPDATE `users` AS u
SET `notifications_enabled` =
    EXISTS (
        SELECT 1 FROM `house_memberships` AS hm
        WHERE hm.`user_id` = u.`id`
          AND (hm.`notify_meetings` = true OR hm.`notify_requests` = true)
    )
    OR EXISTS (
        SELECT 1 FROM `house_join_requests` AS jr
        WHERE jr.`user_id` = u.`id`
          AND (jr.`notify_meetings` = true OR jr.`notify_requests` = true)
    );

ALTER TABLE `house_memberships` DROP COLUMN `notify_meetings`, DROP COLUMN `notify_requests`;
ALTER TABLE `house_join_requests` DROP COLUMN `notify_meetings`, DROP COLUMN `notify_requests`;
