-- MySQL dump 10.11
--
-- Host: localhost    Database: webdesk
-- ------------------------------------------------------
-- Server version	5.0.77

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `categories` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `comment`
--

DROP TABLE IF EXISTS `comment`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `comment` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `discussion_id` int(10) unsigned NOT NULL,
  `parent_id` int(10) unsigned default NULL,
  `user_id` int(10) unsigned default NULL,
  `content` varchar(4000) NOT NULL,
  `post_date` datetime default NULL,
  `state` tinyint(3) unsigned default NULL COMMENT '1 - waiting moderation, 2 - negative moderated, 3 - positive moderated, 4 - trusted',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=150 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cs_cheat`
--

DROP TABLE IF EXISTS `cs_cheat`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cs_cheat` (
  `id` int(11) NOT NULL auto_increment,
  `title` varchar(100) default NULL,
  `color` char(6) default NULL,
  `short_contents` varchar(1000) default NULL,
  `long_contents` text,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cs_cheatsheet`
--

DROP TABLE IF EXISTS `cs_cheatsheet`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cs_cheatsheet` (
  `id` int(10) NOT NULL auto_increment,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) default NULL,
  `reference` varchar(100) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `discussion`
--

DROP TABLE IF EXISTS `discussion`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `discussion` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `owner_id` int(10) unsigned NOT NULL,
  `owner_type` tinyint(3) unsigned default NULL,
  PRIMARY KEY  (`id`),
  KEY `id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1140 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `help_topic`
--

DROP TABLE IF EXISTS `help_topic`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `help_topic` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `help_topic_content`
--

DROP TABLE IF EXISTS `help_topic_content`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `help_topic_content` (
  `id` int(50) NOT NULL auto_increment,
  `topic_id` int(10) unsigned default NULL,
  `author_id` int(10) unsigned default NULL,
  `create_date` datetime default NULL,
  `state_id` smallint(1) unsigned NOT NULL,
  `approver_id` tinyint(3) unsigned default NULL,
  `text` text,
  PRIMARY KEY  (`id`),
  KEY `id` (`id`,`topic_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `problem`
--

DROP TABLE IF EXISTS `problem`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `problem` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(500) default NULL,
  `deadline` datetime default NULL,
  `description` mediumtext,
  `priority` tinyint(3) unsigned default NULL,
  `state_id` tinyint(3) unsigned default NULL,
  `owner_id` tinyint(3) unsigned default NULL,
  `category_id` tinyint(3) unsigned default NULL,
  `is_actual` enum('0','1') default '1',
  `create_date` datetime default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=30 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `problem_category`
--

DROP TABLE IF EXISTS `problem_category`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `problem_category` (
  `id` tinyint(3) unsigned NOT NULL auto_increment,
  `name` varchar(50) NOT NULL,
  `icon` varchar(50) default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `role` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `solution`
--

DROP TABLE IF EXISTS `solution`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `solution` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `problem_id` int(10) unsigned NOT NULL,
  `date` datetime default NULL,
  `comment` tinytext,
  `is_active` tinyint(3) unsigned default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tag` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(50) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1815 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `topic`
--

DROP TABLE IF EXISTS `topic`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `topic` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `title` varchar(500) default NULL COMMENT 'Ð—Ð°Ð³Ð¾Ð»Ð¾Ð²Ð¾Ðº',
  `content` text,
  `post_date` datetime default NULL COMMENT 'Ð”Ð°Ñ‚Ð° ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ñ',
  `modif_date` datetime default NULL COMMENT 'Ð”Ð°Ñ‚Ð° Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸Ñ',
  `pub_date` datetime default NULL COMMENT 'Ð”Ð°Ñ‚Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ð¸',
  `discussion_id` int(10) unsigned default NULL COMMENT 'ÐšÐ¾Ð½Ñ‚ÐµÐºÑÑ‚ Ð¾Ð±ÑÑƒÐ¶Ð´ÐµÐ½Ð¸Ñ (ÑÐ¾Ð·Ð´Ð°ÐµÑ‚ÑÑ Ñ‚Ñ€Ð¸Ð³Ð³ÐµÑ€Ð¾Ð¼)',
  `is_actual` tinyint(1) NOT NULL default '1' COMMENT 'Ð¤Ð»Ð°Ð³ Ð°ÐºÑ‚ÑƒÐ°Ð»ÑŒÐ½Ð¾ÑÑ‚Ð¸',
  `rating` int(10) unsigned default '0',
  `user_id` int(10) unsigned default NULL,
  `category_id` int(10) unsigned default NULL,
  PRIMARY KEY  (`id`),
  KEY `ix_rating__is_actual` (`is_actual`,`rating`)
) ENGINE=MyISAM AUTO_INCREMENT=1155 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `topic_vote`
--

DROP TABLE IF EXISTS `topic_vote`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `topic_vote` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `user_id` int(10) unsigned default NULL,
  `topic_id` int(10) unsigned default NULL,
  PRIMARY KEY  (`id`),
  KEY `ix_topic_id` (`topic_id`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `topics_tags`
--

DROP TABLE IF EXISTS `topics_tags`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `topics_tags` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `tag_id` int(10) unsigned default NULL,
  `topic_id` int(10) unsigned default NULL,
  PRIMARY KEY  (`id`),
  KEY `ix_tag_id` (`tag_id`),
  KEY `ix_topic_id` (`topic_id`,`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4700 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `user` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `state` smallint(3) unsigned default NULL COMMENT '0 - Guest, 1 - Approved guest, 2 - Unapproved user, 3 - Regular user, 4 - Banned, 5 - Removed',
  `name` varchar(40) NOT NULL,
  `password` varchar(33) default NULL,
  `karma` mediumint(9) default '0',
  `email` varchar(50) default NULL,
  `secret_code` varchar(33) default NULL,
  `allow_cookies` enum('Y','N') default 'Y',
  `avatar` varchar(30) NOT NULL default 'msie.jpg',
  `last_logon` date default NULL,
  `user_key` varchar(50) default NULL,
  `user_key_mode` varchar(10) default 'disabled',
  PRIMARY KEY  (`id`),
  KEY `id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=34 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `user_to_role`
--

DROP TABLE IF EXISTS `user_to_role`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `user_to_role` (
  `user_id` int(10) unsigned NOT NULL,
  `role_id` int(10) unsigned NOT NULL,
  PRIMARY KEY  (`user_id`,`role_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2009-04-28 21:10:28
