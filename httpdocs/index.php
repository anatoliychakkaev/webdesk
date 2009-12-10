<?php
	
	list($msec, $sec) = split(' ', microtime());
	$timeBegin = $sec + $msec;
	
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
	
	lg('\nURL \033[1;10m' . $_SERVER['PATH_INFO'] . '\033[00m requested at \033[0;34m' . strftime('%c') . '\033[00m');
	
	// log input params
	if ($_POST) {
		lg('POST: ' . php2js($_POST));
	}
	
	// slit path into partitions
	$path 	= preg_split('/[\/\\\\]/', $real_path, null, PREG_SPLIT_NO_EMPTY);
	$path_prefix = '/';
	
	// zero-component of path may be user key (if it starts from ~)
	if (isset($path[0]) && $path[0] && $path[0]{0} == '~') {
		// create user by key
		$path_prefix .= $path[0] . '/';
		$user = new user(substr(array_shift($path), 1));
	} elseif(isset($_SESSION['user_id'])) {
		// find another way to init user
		$user = new user($_SESSION['user_id']);
	} else {
		$user = new user();
	}
	$tpl->add('user', $user);
	
	// define controllers
	$path_offset = 0;
	$parent_ctl = null;

	/**
	 * Firstly, try to find controller class described in file
	 * if not found, try initialize crud controller from database automatically
	 *
	 * @param string $controller - name on controller, interpreted in function 
	 *	as part of filename or part of tablename
	 * @return object controller
	**/
	function get_controller_by_name($controller) {
		$ctrl_file = 'controller/' . $controller . '.php';
		if (file_exists($ctrl_file)) {
		
			exec("echo 'Controller [{$GLOBALS['controller']}] loaded.' >> /tmp/weblog");
			require_once $ctrl_file;
			#TODO: find way to make class name independ of file name
			$ctl_class_name = $controller . '_ctl';
			
			if (!class_exists($ctl_class_name)) {
				exit;
			}
			
			$ctl = new $ctl_class_name();
			
		} else {
			#TODO: add security restrictions (black/white lists) for crud cotroller
			#TODO: improve search algorythm (strict compare instead of "like '%name'")
			$table = db_fetch_value('show tables like "%' . db_escape($controller) . '"');
			if ($table) {
				$ctl = new crud_ctl();
				$ctl->table = $table;
			} else {
				exec("echo 'ERROR: Controller [$controller] not found (requested {$_SERVER['PATH_INFO']}).' >> /tmp/weblog");
				die("<pre>Controller <strong>[$controller]</strong> not found.\n\n");
			}
		}
		
		return $ctl;
	}

	do {
		
		$controller = @$path[$path_offset] or $controller = 'default';
		$path_offset += 1;
		
		$ctl = get_controller_by_name($controller);
		$ctl->parent_ctl = $parent_ctl;
		$ctl->tpl =& $tpl;
		$ctl->user =& $user;
		$ctl->format =& $format;
		
		$path_prefix .= $controller . '/' . $ctl->__parse_path($path_offset, $path);
		$ctl->path_prefix =& $path_prefix;
		$ctl->path = array_slice($path, $path_offset);
		
		$ctl->__init();
		$ctl->__run();
		
		$parent_ctl = $ctl;
		break;
		
	} while ($path_offset < count($path));
	
	$tpl->add('path_prefix', $path_prefix);
	$tpl->add('pp', $path_prefix);
	
	$tpl->display();
	
	list($msec, $sec) = split(' ', microtime());
	$timeEnd = $sec + $msec;
	lg('Total time taken: \033[0;34m' . sprintf('%01.4f', $timeEnd - $timeBegin) . '\033[00m sec, memory usage: ' . preg_replace('/(?<=\d)(?=(\d\d\d)+\b)/', ',', memory_get_usage()) . ' bytes');
	
?>
