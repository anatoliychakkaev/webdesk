<?php
	
	session_name($config->session_name);
	session_save_path($config->session_path);
	session_start();
	
?>
