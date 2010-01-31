CREATE TABLE `application` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(600) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
);

CREATE TABLE `user_to_application` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11),
  `application_id` int(11),
  PRIMARY KEY (`id`)
);

INSERT INTO `application` (`name`, `title`, `description`, `created_at`)
VALUES
('outlay', 'Расходы', 'Журнал расходов', NOW()),
('note', 'Записи', 'Только позитивные мысли', NOW())
;
