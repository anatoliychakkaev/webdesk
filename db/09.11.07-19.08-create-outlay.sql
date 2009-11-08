CREATE TABLE `outlay` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `outlay_category_id` int(10) DEFAULT NULL,
  `user_id` int(10) DEFAULT NULL,
  `value` int(10) DEFAULT NULL,
  `note` varchar(2000) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `outlay_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
