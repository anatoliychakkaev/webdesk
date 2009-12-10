CREATE TABLE `note_to_tag` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tag_id` int(10) unsigned DEFAULT NULL,
  `note_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_tag_id` (`tag_id`),
  KEY `ix_note_tag` (`note_id`,`tag_id`),
  KEY `ix_note_id` (`note_id`)
);
