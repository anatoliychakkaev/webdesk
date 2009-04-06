<?php

require_once 'classes/config.inc';

$config = new Config();

// common settings
$config->base_path		= realpath(dirname(__FILE__) . '/..');
$config->site_name		= 'Webdesk';

// database connection
$config->db_server		= 'localhost';
$config->db_user		= 'be';
$config->db_password	= '';
$config->db_name		= 'webdesk';
require_once	'db.inc';

// session
$config->session_name	= 'WDSESS';
$config->session_path	= '/var/www/sessions';
require_once	'session.inc';

// templator
$config->smarty_dir		= $config->base_path . '/smarty';
$config->template_dir	= $config->base_path . '/httpdocs/view';
require_once	'template.inc';
$tpl = new Template();

// error handling
$config->display_errors	= 1;
$config->log_errors		= 1;


?>
