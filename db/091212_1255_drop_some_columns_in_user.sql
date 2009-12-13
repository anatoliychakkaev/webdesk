ALTER TABLE `user`
DROP COLUMN `karma`,
DROP COLUMN `avatar`,
DROP COLUMN `secret_code`,
DROP COLUMN `user_key_mode`,
DROP COLUMN `allow_cookies`,
DROP INDEX id;
