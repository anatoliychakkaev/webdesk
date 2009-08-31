<?php
	
	// get and save full path
	$real_path	= empty($_SERVER['PATH_INFO'])?'':$_SERVER['PATH_INFO'];
	$tpl->add('path', $real_path);
	
	// define format from characters after last point
	if (preg_match('/(.*)\\.([^\\.]*)/', $real_path, $m)) {//todo: refactor this regexp
		
		$real_path = @$m[1];
		$format	= @$m[2];
		
	}else{
		
		$format	= '';
		
	}
	
	// slit path into partitions
	$path 	= preg_split('/[\/\\\\]/', $real_path, null, PREG_SPLIT_NO_EMPTY);
	$path_prefix = '/';
	
	// zero-component of path may be user key (if it starts from ~)
	if (isset($path[0]) && $path[0] && $path[0]{0} == '~') {
		// create user by key
		$path_prefix .= $path[0] . '/';
		$user = new user(substr(array_shift($path), 1));
	} else {
		// find another way to init user
		$user = new user(4);
	}
	
	// define controllers
	$path_offset = 0;
	$parent_ctl = null;
	do {
		
		$controller = @$path[$path_offset] or	$controller = 'default';
		$screen 	= @$path[$path_offset + 1]	or	$screen		= '';
		
		$path_prefix .= $controller . '/';
		
		// define entity (if action starts with numer or uppercase letter)
		if (preg_match('/^([A-Z]*)([0-9]+)$/', $screen, $entity)) {
			
			$entity_code	= $entity[1];
			$entity_id		= (int) $entity[2];
			$screen 		= @$path[$path_offset + 2]	or	$screen	= '';
			
			$path_prefix .= $entity_code . $entity_id . '/';
			
		} else {
			
			$entity_code	= '';
			$entity_id		= 0;
			
		}
		
		
		
		$ctrl_file = 'controller/' . $controller . '.php';
		if (!file_exists($ctrl_file)) {
			exec("echo 'ERROR: Controller [$controller] not found (requested {$_SERVER['PATH_INFO']}).' >> /tmp/weblog");
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
				lg("Current user not accessed to controller $controller.", 'error');
				exit;
			}
		}
		
		$path_offset += 1;
		if ($entity_id) {
			lg('Entity found ' . $entity_id);
			$path_offset += 1;
		}
		// here we make suggestion about screen-path-component
		// for proof we should check existing method $screen of controller
		// if it not - we should decrement $path_offset
		// why do not check method now? because $screen may be changed in init()
		if ($screen) {
			lg('Screen found ' . $screen);
			$path_offset += 1;
		}
		
		$ctl->path   	=& $path;
		$ctl->path_prefix =& $path_prefix;
		$ctl->entity_code = $entity_code;
		$ctl->entity_id	= $entity_id;
		$ctl->screen	=& $screen;
		$ctl->format	=& $format;
		$ctl->tpl		=& $tpl;
		$ctl->user		=& $user;
		$ctl->parent_ctl = $parent_ctl;
		$ctl->init();
		if (method_exists($ctl, $screen)) {
			lg("Loading screen [{$screen}]");
			$ctl->$screen();
		} else {
			// screen not found - we should decrease offset, increased because screen was found
			// suggestion was wrong, maybe screen component - child controller?
			$path_offset -= 1;
		}
		
		$parent_ctl = $ctl;
		
		lg('Path offset is ' . $path_offset);
		
	} while ($path_offset < count($path));
	
	$tpl->add('path_prefix', $path_prefix);
	$tpl->add('pp', $path_prefix);
	
	// output to browser
	$tpl->display();

?>
