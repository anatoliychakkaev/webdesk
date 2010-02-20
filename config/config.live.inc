<?php

require_once 'classes/config.inc';

$config = new Config();

$config->environment	= 'production';

// common settings
$config->base_path		= realpath(dirname(__FILE__) . '/..');
$config->site_name		= 'Webdesk';

// database connection
$config->db_server		= 'localhost';
$config->db_user		= 'be';
$config->db_password	= '';
$config->db_name		= 'webdesk_live';
require_once	'db.inc';

// session
$config->session_name	= 'WDLIVESESS';
$config->session_path	= '/var/www/sessions';
$config->security_token_secret = 'A$D`0)n#Pьd8';
require_once	'session.inc';

// templator
$config->smarty_dir		= $config->base_path . '/smarty';
$config->template_dir	= $config->base_path . '/httpdocs/view';
require_once	'template.inc';
$tpl = new Template();

// locale
setlocale(LC_ALL, 'ru_RU.utf8');

// error handling
$config->display_errors	= 1;
$config->log_errors		= 1;

// commons
require_once	'classes/user.inc';
require_once	'common_ctls.inc';
require_once	'common_functions.php';

?>
