CREATE TABLE `wd_todo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `description` varchar(700) NOT NULL DEFAULT '',
  `date_created` datetime NOT NULL DEFAULT '0000-00-00',
  `date_closed` datetime NOT NULL DEFAULT '0000-00-00',
  `is_closed` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ix_is_closed` (`is_closed`)
);
