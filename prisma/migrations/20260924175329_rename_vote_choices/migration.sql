ALTER TABLE `meeting_votes`
  MODIFY `choice` ENUM('for', 'against', 'abstain', 'yes', 'no') NOT NULL;

UPDATE `meeting_votes` SET `choice` = 'yes' WHERE `choice` = 'for';
UPDATE `meeting_votes` SET `choice` = 'no' WHERE `choice` = 'against';

ALTER TABLE `meeting_votes`
  MODIFY `choice` ENUM('yes', 'no', 'abstain') NOT NULL;
