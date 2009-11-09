ALTER TABLE user ADD COLUMN `logged_in` tinyint(1) NOT NULL DEFAULT '0' AFTER `user_key_mode`;
