-- Только для локальной БД из docker-compose.yml. Повторный запуск не дублирует записи.
USE sovet_doma;
START TRANSACTION;

INSERT IGNORE INTO houses
  (id, address, management_company_name, apartments_count, entrances_count, year_built)
VALUES
  (8000001, 'Санкт-Петербург, Лиговский проспект, 84', 'Демо УК «Центр»', 72, 4, 1986);

INSERT IGNORE INTO house_invitations (id, house_id, code, expires_at)
VALUES (8000001, 8000001, 'LIG-84-C9', DATE_ADD(NOW(), INTERVAL 365 DAY));
UPDATE house_invitations
SET expires_at = DATE_ADD(NOW(), INTERVAL 365 DAY), revoked_at = NULL
WHERE id = 8000001 AND house_id = 8000001;

-- Отрицательные max_id не принадлежат реальным аккаунтам MAX.
INSERT IGNORE INTO users (id, max_id, first_name, last_name, notifications_enabled)
VALUES
  (8000001, -8000001, 'Марина', 'Демо', 0),
  (8000002, -8000002, 'Игорь', 'Демо', 0),
  (8000003, -8000003, 'Галина', 'Демо', 0),
  (8000004, -8000004, 'Олег', 'Демо', 0),
  (8000005, -8000005, 'Новый', 'Житель', 0);

INSERT IGNORE INTO house_memberships (id, user_id, house_id, status, display_name)
VALUES
  (8000001, 8000001, 8000001, 'approved', 'Марина Демо'),
  (8000002, 8000002, 8000001, 'approved', 'Игорь Демо'),
  (8000003, 8000003, 8000001, 'approved', 'Галина Демо'),
  (8000004, 8000004, 8000001, 'approved', 'Олег Демо');

INSERT IGNORE INTO house_member_roles (membership_id, role)
VALUES
  (8000001, 'resident'), (8000001, 'house_admin'),
  (8000002, 'resident'), (8000002, 'organizer'),
  (8000003, 'resident'), (8000003, 'house_council'),
  (8000004, 'resident');

INSERT IGNORE INTO apartments (id, house_id, number)
VALUES
  (8000001, 8000001, '12'),
  (8000002, 8000001, '13'),
  (8000003, 8000001, '14');

INSERT IGNORE INTO apartment_memberships
  (membership_id, apartment_id, house_id, relationship, verification_status)
VALUES
  (8000001, 8000001, 8000001, 'owner', 'verified'),
  (8000002, 8000002, 8000001, 'owner', 'verified'),
  (8000003, 8000003, 8000001, 'owner', 'verified'),
  (8000004, 8000003, 8000001, 'tenant', 'verified');

INSERT IGNORE INTO house_join_requests
  (id, user_id, house_id, apartment_number, display_name, relationship, status)
VALUES (8000001, 8000005, 8000001, '15', 'Новый Житель', 'owner', 'pending');

INSERT IGNORE INTO house_contacts
  (id, house_id, type, name, phone, working_hours, sort_order)
VALUES
  (8000001, 8000001, 'dispatcher', 'Диспетчерская УК', '+7 (812) 000-00-01', 'круглосуточно', 1),
  (8000002, 8000001, 'emergency', 'Аварийная служба', '+7 (812) 000-00-02', 'круглосуточно', 2),
  (8000003, 8000001, 'plumber', 'Сантехник', '+7 (812) 000-00-03', 'пн–пт 9:00–18:00', 3),
  (8000004, 8000001, 'electrician', 'Электрик', '+7 (812) 000-00-04', 'пн–пт 9:00–18:00', 4),
  (8000005, 8000001, 'representative', 'Совет дома', NULL, NULL, 5),
  (8000006, 8000001, 'passport_office', 'Паспортный стол', '+7 (812) 000-00-06', 'пн, ср, пт 9:00–17:00', 6);

INSERT IGNORE INTO house_events
  (id, house_id, type, title, description, starts_at, ends_at, is_cancelled)
VALUES
  (8000001, 8000001, 'water_outage', 'Отключение горячей воды', 'Плановые работы', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 6 HOUR, 0),
  (8000002, 8000001, 'power_outage', 'Проверка электросетей', 'Проверка оборудования', DATE_ADD(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR, 0),
  (8000003, 8000001, 'cleaning', 'Уборка подъездов', 'Влажная уборка', DATE_ADD(NOW(), INTERVAL 1 DAY), NULL, 0),
  (8000004, 8000001, 'maintenance', 'Обслуживание лифта', 'Плановые работы', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 0),
  (8000005, 8000001, 'other', 'Субботник во дворе', 'Сбор у первого подъезда', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, 0),
  (8000006, 8000001, 'other', 'Отменённое собрание соседей', NULL, DATE_ADD(NOW(), INTERVAL 3 DAY), NULL, 1);
UPDATE house_events SET starts_at = DATE_ADD(NOW(), INTERVAL 2 DAY), ends_at = DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 6 HOUR WHERE id = 8000001;
UPDATE house_events SET starts_at = DATE_ADD(NOW(), INTERVAL 4 DAY), ends_at = DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR WHERE id = 8000002;
UPDATE house_events SET starts_at = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE id = 8000003;
UPDATE house_events SET starts_at = DATE_SUB(NOW(), INTERVAL 5 DAY) WHERE id = 8000004;
UPDATE house_events SET starts_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id = 8000005;
UPDATE house_events SET starts_at = DATE_ADD(NOW(), INTERVAL 3 DAY) WHERE id = 8000006;

-- Ссылки показывают формат записи, демо-чаты в MAX не создаются этим файлом.
INSERT IGNORE INTO house_chats (id, house_id, type, name, description, url, sort_order)
VALUES
  (8000001, 8000001, 'chat', 'Демо: общий чат дома', 'Ссылка ведёт к боту проекта', 'https://max.ru/t364_hakaton_max_bot', 1),
  (8000002, 8000001, 'chat', 'Демо: чат подъезда', 'Ссылка ведёт к боту проекта', 'https://max.ru/t364_hakaton_max_bot', 2),
  (8000003, 8000001, 'channel', 'Демо: новости УК', 'Ссылка ведёт к боту проекта', 'https://max.ru/t364_hakaton_max_bot', 3);

INSERT IGNORE INTO meetings
  (id, house_id, author_id, title, description, format, location, starts_at, ends_at, participation_threshold_percent, audience)
VALUES
  (8000001, 8000001, 8000001, 'Установка шлагбаума во дворе', 'Обсудим въезд и обслуживание', 'absentee', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY), 50, 'owners'),
  (8000002, 8000001, 8000002, 'Освещение детской площадки', 'Встреча во дворе', 'in_person', 'У первого подъезда', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR, 60, 'all_residents'),
  (8000003, 8000001, 8000003, 'Ремонт кровли', 'Итоги обсуждения и голосования', 'mixed', 'Холл первого подъезда', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 'owners');
UPDATE meetings SET starts_at=DATE_SUB(NOW(), INTERVAL 1 DAY), ends_at=DATE_ADD(NOW(), INTERVAL 14 DAY) WHERE id=8000001;
UPDATE meetings SET starts_at=DATE_ADD(NOW(), INTERVAL 3 DAY), ends_at=DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR WHERE id=8000002;
UPDATE meetings SET starts_at=DATE_SUB(NOW(), INTERVAL 20 DAY), ends_at=DATE_SUB(NOW(), INTERVAL 13 DAY) WHERE id=8000003;

INSERT IGNORE INTO meeting_questions (id, meeting_id, title, sort_order)
VALUES
  (8000001, 8000001, 'Установить шлагбаум за счёт средств дома', 0),
  (8000002, 8000001, 'Утвердить расходы на обслуживание', 1),
  (8000003, 8000002, 'Установить шесть фонарей', 0),
  (8000004, 8000003, 'Утвердить смету ремонта кровли', 0);
INSERT IGNORE INTO meeting_votes (question_id, user_id, choice)
VALUES
  (8000001, 8000001, 'yes'), (8000001, 8000002, 'no'),
  (8000002, 8000001, 'abstain'), (8000004, 8000001, 'yes'),
  (8000004, 8000002, 'yes');
INSERT IGNORE INTO meeting_participations (meeting_id, user_id, will_attend)
VALUES (8000002, 8000001, 1), (8000002, 8000004, 1), (8000003, 8000002, 0);

INSERT IGNORE INTO polls (id, house_id, author_id, question, audience, allow_multiple, ends_at)
VALUES
  (8000001, 8000001, 8000001, 'Какой цвет выбрать для подъезда?', 'all_residents', 0, DATE_ADD(NOW(), INTERVAL 10 DAY)),
  (8000002, 8000001, 8000002, 'Что улучшить во дворе?', 'owners', 1, DATE_ADD(NOW(), INTERVAL 12 DAY)),
  (8000003, 8000001, 8000003, 'Когда удобнее проводить уборку?', 'all_residents', 0, DATE_SUB(NOW(), INTERVAL 3 DAY));
UPDATE polls SET ends_at=DATE_ADD(NOW(), INTERVAL 10 DAY) WHERE id=8000001;
UPDATE polls SET ends_at=DATE_ADD(NOW(), INTERVAL 12 DAY) WHERE id=8000002;
UPDATE polls SET ends_at=DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE id=8000003;

INSERT IGNORE INTO poll_options (id, poll_id, title, sort_order)
VALUES
  (8000001, 8000001, 'Светло-серый', 0),
  (8000002, 8000001, 'Бежевый', 1),
  (8000003, 8000001, 'Голубой', 2),
  (8000004, 8000002, 'Скамейки', 0),
  (8000005, 8000002, 'Освещение', 1),
  (8000006, 8000002, 'Велопарковка', 2),
  (8000007, 8000003, 'Будни', 0),
  (8000008, 8000003, 'Выходные', 1);
INSERT IGNORE INTO poll_votes (poll_id, user_id, option_id)
VALUES
  (8000001, 8000001, 8000001), (8000001, 8000004, 8000002),
  (8000002, 8000001, 8000004), (8000002, 8000001, 8000005),
  (8000003, 8000002, 8000008), (8000003, 8000004, 8000007);

INSERT IGNORE INTO service_requests
  (id, public_id, house_id, author_id, title, description, category, location_type, apartment_id, location_text, visibility, status)
VALUES
  (8000001, 'd0d0d0d0-0000-4000-8000-000000000001', 8000001, 8000001, 'Не работает домофон', 'У первого подъезда не открывается дверь', 'electrician', 'entrance', NULL, 'Подъезд 1', 'house', 'submitted'),
  (8000002, 'd0d0d0d0-0000-4000-8000-000000000002', 8000001, 8000002, 'Течёт труба', 'На лестнице между этажами', 'plumber', 'entrance', NULL, 'Подъезд 2', 'house', 'in_review'),
  (8000003, 'd0d0d0d0-0000-4000-8000-000000000003', 8000001, 8000001, 'Не горит свет во дворе', 'Не работает фонарь у входа', 'electrician', 'yard', NULL, 'У первого подъезда', 'house', 'in_progress'),
  (8000004, 'd0d0d0d0-0000-4000-8000-000000000004', 8000001, 8000003, 'Починили лифт', 'Нужно подтвердить результат', 'management', 'entrance', NULL, 'Подъезд 3', 'house', 'resolved'),
  (8000005, 'd0d0d0d0-0000-4000-8000-000000000005', 8000001, 8000004, 'Уборка на этаже', 'Работы закончены', 'duty', 'apartment', 8000003, NULL, 'private', 'closed'),
  (8000006, 'd0d0d0d0-0000-4000-8000-000000000006', 8000001, 8000002, 'Шум от соседей', 'Заявку отменили после обсуждения', 'management', 'apartment', 8000002, NULL, 'house', 'cancelled');

INSERT IGNORE INTO request_events (id, request_id, status, comment)
VALUES
  (8000001, 8000001, 'submitted', NULL),
  (8000002, 8000002, 'submitted', NULL),
  (8000003, 8000002, 'in_review', 'Диспетчер принял заявку'),
  (8000004, 8000003, 'submitted', NULL),
  (8000005, 8000003, 'in_review', 'Заявка принята'),
  (8000006, 8000003, 'in_progress', 'Электрик выйдет завтра'),
  (8000007, 8000004, 'submitted', NULL),
  (8000008, 8000004, 'in_review', NULL),
  (8000009, 8000004, 'in_progress', NULL),
  (8000010, 8000004, 'resolved', 'Лифт проверен'),
  (8000011, 8000005, 'submitted', NULL),
  (8000012, 8000005, 'closed', 'Работы приняты'),
  (8000013, 8000006, 'submitted', NULL),
  (8000014, 8000006, 'cancelled', 'Не относится к УК');
INSERT IGNORE INTO request_subscriptions (request_id, user_id)
VALUES (8000003, 8000004);

COMMIT;
