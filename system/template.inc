<?php

class Template {
	
	var $ordinary_vars = array();
	
	var $primary_vars = array();
	
	var $_view = '';
	
	var $_layout = 'default';
	
	var $smarty = false;
	
	function Template() {
		
	}
	
	function require_smarty() {
		if ($this->smarty) return;
		
		global $config;
		require_once $config->smarty_dir . '/libs/Smarty.class.php';
		
		$this->smarty = new Smarty();
		
		$this->smarty->template_dir	= $config->template_dir;
		$this->smarty->compile_dir	= $config->smarty_dir . '/templates_c';
		$this->smarty->cache_dir	= $config->smarty_dir . '/cache';
		$this->smarty->config_dir	= $config->smarty_dir . '/configs';
		
		foreach ($this->ordinary_vars as $name=>$var) {
			$this->smarty->assign($name, $var->value);
		}
		
		foreach ($this->primary_vars as $name=>$var) {
			$this->smarty->assign($name, $var->value);
		}
		
		$this->smarty->register_function('module', 'call_module');
	}
	
	function add($name, &$value, $type = '', $is_primary = true) {
		
		$v = new stdClass();
		$v->type = $type;
		$v->value = $value;
		
		if ($is_primary) {
			$this->primary_vars[$name] = $v;
		} else {
			$this->ordinary_vars[$name] = $v;
		}
		
		if ($this->smarty) {
			$this->smarty->assign_by_ref($name, $value);
		}
	}
	
	function add_secondary($name, &$value, $type = '') {
		$this->add($name, $value, $type, false);
	}
	
	function view($view = '') {
		
		if ($view) {
			$this->_view = $view;
		}
		return $this->_view;
		
	}
	
	function layout($layout_name = 'default') {
		$this->_layout = $layout_name;
	}
	
	function fetch($view) {
		$this->require_smarty();
		return $this->smarty->fetch($view);
	}
	
	function display() {
		global $format;
		if ($this->_view) {
			
			$found = $this->view_defined($this->_view, $checked_files);
			
			if ($found) {
				// use custom smarty template to display variables
				$this->require_smarty();
				lg('Display using smarty: ' . $found);
				$this->smarty->assign('body', $found); // TODO: think about namespace
				$this->smarty->display('layout.' . $this->_layout . '.tpl');
				return true;
			} else {
				lg('View not found in: ' . join(', ', $checked_files));
			}
		}
		
		// use easy way
		echo $this->format_vars($format);
		
	}
	
	function view_defined($view = '', &$checked_files) {
		global $format;
		$v = $view ? $view : $this->_view;
		$base_name	= config('template_dir') . '/' . $v;
		
		$found = '';
		
		if ($format) {
			// try to find format-oriented template
			if (!$found && !is_file($found	= $base_name . '.' . $format . '.tpl')) {
				$checked_files[] = $found;
				$found = '';
			}
		}
		
		if (!$found && !in_array($format, array('json', 'debug'))) {
			// try to find base template
			if (!$found && !is_file($found	= $base_name . '.tpl')) {
				$checked_files[] = $found;
				$found = '';
			}
		}
		
		return $found;
	}
	
	function format_vars($format) {
		
		//$vars = $this->vars_to_string(count($this->primary_vars)?$this->primary_vars:$this->ordinary_vars);
		$vars = count($this->primary_vars)?$this->primary_vars:$this->ordinary_vars;
		
		switch ($format) {
		case 'js':
		case 'json':
			return $this->vars_to_json($vars);
		default:
		case '':
		case 'html':
			
			break;
		case 'xml':
			return $this->vars_to_xml($vars);
		case 'debug':
			echo '<pre>';
			print_r($vars);
			break;
		}
	}
	
	function vars_to_xml($vars) {
		
		$t = '<?xml version="1.0" encoding"UTF-8">
		<data>
		';
		foreach($vars as $name=>$var){
			$t.='<entity>
		';
			$t.='			<name>' . $name . '</name>
			';
			$t.='			<content>' . $this->var_to_xml($var->value) . '</content>
			';
			$t.='</entity>
		';
		}
		$t.='</data>';
		return $t;
	}
	
	function var_to_xml($x){
		
		if(is_scalar($x))return '	<scalar>' . $x . '</scalar>';
		if(is_object($x)){
			$t = '	<object>
		';
			foreach($x as $k=>$v){
				$t.='		<name>' . $k . '</name>
				';
				$t.='		<content>' . $this->var_to_xml($v) . '</content>
				';
			}
			$t .= '	</object>
		';
			return $t;
		}
		if(is_array($x)){
			$t = '	<array>
		';
			foreach($x as $k=>$v){
				$t.='		<name>' . $k . '</name>
				';
				$t.='		<content>' . $this->var_to_xml($v) . '</content>
				';
			}
			$t .= '	</array>
		';
			return $t;
		}
	}
	
	function vars_to_json($vars){
		$vs = array();
		foreach ($vars as $k=>$v) {
			$k = $this->json_encode($k);
			switch ($v->type) {
			default:
				$vs[] = $k . ': ' . $this->json_encode($v->value);
				break;
			}
		}
		return '{' . join(',', $vs) . '}';
	}
	
	function json_encode($a = false) {
		if (is_null($a)) {
			return 'null';
		}
		if ($a === false) {
			return 'false';
		}
		if ($a === true) {
			return 'true';
		}
		
		if (is_scalar($a)) {
			if (is_float($a)) {
				return floatval(str_replace(',', '.', strval($a)));
			}
			
			if (is_string($a)) {
				$jsonReplaces = array(
					array("\\", "/", "\n", "\t", "\r", "\b", "\f", '"'),
					array('\\\\', '\\/', '\\n', '\\t', '\\r', '\\b', '\\f', '\"')
				);
				return '"' . str_replace($jsonReplaces[0], $jsonReplaces[1], $a) . '"';
			} else {
				return $a;
			}
		}
		
		$isList = true;
		for ($i = 0, reset($a); $i < count($a); $i++, next($a)) {
			
			if (key($a) !== $i) {
				$isList = false;
				break;
			}
		}
		
		$result = array();
		if ($isList) {
			
			foreach ($a as $v) {
				$result[] = $this->json_encode($v);
			}
			return '[' . join(',', $result) . ']';
		} else {
			
			foreach ($a as $k => $v) {
				$result[] = $this->json_encode($k) . ': ' . $this->json_encode($v);
			}
			return '{' . join(',', $result) . '}';
		}
	}
	
}

?>
