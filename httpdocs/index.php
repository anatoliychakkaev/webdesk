<?php
	
	$path	= empty($_SERVER['PATH_INFO'])?'':$_SERVER['PATH_INFO'];
	if (preg_match('/(.*)\\.([^\\.]*)/', $path, $m)) {
		
		$path	= @$m[1];
		$format	= @$m[2];
		
	}else{
		
		$format	= '';
		
	}
	
	$path 	= preg_split('/[\/\\\\]/', $path, null, PREG_SPLIT_NO_EMPTY);
	
	if (isset($path[0]) && $path[0] && $path[0]{0} == '~') {
		// create user by key
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
	
	$ctrl_file = 'controller/' . $controller . '.php';
	if (file_exists($ctrl_file)) {
		
		require_once $ctrl_file;
		$ctl_class_name = $controller . '_ctl';
		if (class_exists($ctl_class_name)) {
			$ctl = new $ctl_class_name();
			
			if (isset($ctl->required_role) && $ctl->required_role) {
				if (!$user->has_role($ctl->required_role)) {
					die('no access');
				}
			}
			
			$ctl->path   	=& $path;
			$ctl->screen	=& $screen;
			$ctl->format	=& $format;
			$ctl->tpl		=& $tpl;
			$ctl->user		=& $user;
			$ctl->init();
			$ctl->$screen();
			$tpl->display();
		} else {
			die($ctl_class_name . ' not exists');
		}
		
	} else {
		
		echo "<pre>Controller <strong>[$controller]</strong> not found.\n\n";
		var_dump($path, $controller, $screen, $format, $entity_code, $entity_id);
		
	}

?>
