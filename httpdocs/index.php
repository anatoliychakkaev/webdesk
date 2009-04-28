<?php
	
	function lg($str){
		$str = str_replace('\'', '\\\'', $str);
		exec("echo '$str' >> /tmp/weblog");
	}
	
	$path	= empty($_SERVER['PATH_INFO'])?'':$_SERVER['PATH_INFO'];
	$tpl->add('path', $path);
	if (preg_match('/(.*)\\.([^\\.]*)/', $path, $m)) {
		
		$path	= @$m[1];
		$format	= @$m[2];
		
	}else{
		
		$format	= '';
		
	}
	
	$path 	= preg_split('/[\/\\\\]/', $path, null, PREG_SPLIT_NO_EMPTY);
	$path_prefix = '/';
	
	if (isset($path[0]) && $path[0] && $path[0]{0} == '~') {
		// create user by key
		$path_prefix .= $path[0] . '/';
		$user = new user(substr(array_shift($path), 1));
	} else {
		// find another way to init user
		$user = new user(4);
	}
	
	$controller = @$path[0] or	$controller = 'default';
	$screen 	= @$path[1]	or	$screen		= '';
	
	// this behaviour is under big question
	if (preg_match('/^([A-Z]+)([0-9]+)$/', $screen, $entity)) {
		
		$entity_code	= $entity[1];
		$entity_id		= (int) $entity[2];
		$screen 		= @$path[2]	or	$screen	= '';
		
	} else {
		
		$entity_code	= '';
		$entity_id		= 0;
		
	}
	
	$path_prefix .= $controller . '/';
	
	$ctrl_file = 'controller/' . $controller . '.php';
	if (!file_exists($ctrl_file)) {
		exec("echo 'ERROR: Controller [$controller] not found.' >> /tmp/weblog");
		die("<pre>Controller <strong>[$controller]</strong> not found.\n\n");
	}
	
	exec("echo 'Controller [{$GLOBALS['controller']}] loaded.' >> /tmp/weblog");
	require_once $ctrl_file;
	$ctl_class_name = $controller . '_ctl';
	
	if (!class_exists($ctl_class_name)) {
		exit;
	}
	
	$ctl = new $ctl_class_name();
	
	if (isset($ctl->required_role) && $ctl->required_role) {
		if (!$user->has_role($ctl->required_role)) {
			exec("date >> /tmp/weblog");
			exec("echo \"\033[1;31mERROR\033[00m: current user not accessed to controller $controller.\" >> /tmp/weblog");
			exit;
		}
	}
	
	$tpl->add('path_prefix', $path_prefix);
	
	$ctl->path   	=& $path;
	$ctl->screen	=& $screen;
	$ctl->format	=& $format;
	$ctl->tpl		=& $tpl;
	$ctl->user		=& $user;
	$ctl->init();
	exec("echo 'Loading screen [{$screen}].' >> /tmp/weblog");
	$ctl->$screen();
	$tpl->display();

?>
