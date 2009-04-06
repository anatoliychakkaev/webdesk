<?php
	
	$path	= empty($_SERVER['PATH_INFO'])?'':$_SERVER['PATH_INFO'];
	if (preg_match('/(.*)\\.([^\\.]*)/', $path, $m)) {
		
		$path	= @$m[1];
		$format	= @$m[2];
		
	}else{
		
		$format	= '';
		
	}
	
	$path 	= preg_split('/[\/\\\\]/', $path, null, PREG_SPLIT_NO_EMPTY);
	
	$controller = @$path[0] or	$controller = 'default';
	$screen 	= @$path[1]	or	$screen		= '';
	
	if (preg_match('/^([A-Z]+)([0-9]+)$/', $screen, $entity)) {
		
		$entity_code	= $entity[1];
		$entity_id		= (int) $entity[2];
		$screen 		= @$path[2]	or	$screen		= '';
		
	} else {
		
		$entity_code	= '';
		$entity_id		= 0;
		
	}
	
	$ctrl_file = 'controller/' . $controller . '.php';
	if (file_exists($ctrl_file)) {
		
		require_once $ctrl_file;
		
	} else {
		
		echo "<pre>Controller <strong>[$controller]</strong> not found.\n\n";
		var_dump($path, $controller, $screen, $format, $entity_code, $entity_id);
		
	}

?>
