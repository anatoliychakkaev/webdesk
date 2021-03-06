<?php

class std_ctl {
	var $screen;
	var $path;
	var $format;
	
	function __parse_path(&$current_index, $path) {
		
		$path_prefix = '';
		$this->screen 	= @$path[$current_index]	or	$this->screen		= '';
		// define entity (if action starts with numer or uppercase letter)
		$entity = array();
		if (preg_match('/^([A-Z]*)([0-9]+)$/', $this->screen, $entity)) {
			
			$this->entity_code	= $entity[1];
			$this->entity_id		= (int) $entity[2];
			$this->screen 		= @$path[$current_index + 1]	or	$this->screen	= '';
			
			$path_prefix .= $this->entity_code . $this->entity_id . '/';
			
		} else {
			
			$this->entity_code	= '';
			$this->entity_id		= 0;
			
		}
		if ($this->entity_id) {
			$current_index += 1;
		}
		if ($this->screen && method_exists($this, $this->screen)) {
			$current_index += 1;
		}
		return $path_prefix;
	}
	
	function __init() {
		
		/* if ($_POST && (
			empty($_POST['security_token']) || 
			empty($_SESSION['security_token']) || 
			$_SESSION['security_token'] != $_POST['security_token']
		)) {
			trigger_error('Security token expected on every POST');
		}
		
		$this->security_token = md5(config('security_token_secret') . time());
		$_SESSION['security_token'] = $this->security_token;
		$this->tpl->add('security_token', $this->security_token); */
	}

	function __run() {
		if (method_exists($this, $this->screen)) {
			$this->{$this->screen}();
		}
	}
	
	function _relative_redirect($path = '') {
		lg('redirect to ' . $this->path_prefix . $path);
		header('Location: ' . $this->path_prefix . $path);
		exit;
	}
}

class crud_ctl extends std_ctl {
	/**
	 * Table name
	**/
	var $table;
	
	var $entity_name;
	
	/**
	 * WTF???
	 * todo: explain and move to std_ctl
	**/
	var $view_prefix = '';
	
	/**
	 *
	**/
	function __init() {
		
		if (!$this->table) {
			$entity_name = preg_replace('/_ctl$/', '', get_class($this));
			$this->table = $entity_name;
			$this->entity_name = $entity_name;
		} elseif (!$this->entity_name) {
			$entity_name = $this->table;
			$this->entity_name = $entity_name;
		} else {
			$entity_name = $this->entity_name;
		}
		
		$entity = db_get_entity($entity_name);
		
		if ($this->entity_id) {
			$entity->load($this->entity_id);
		}
		
		$this->entity = $entity;
		$this->tpl->add($entity_name, $entity->as_array());
		
		if (!$this->screen) {
			$this->screen = $this->entity_id ? 'view' : 'index';
		}
		
		$this->tpl->add('table_info', $this->entity->desc());
		$this->tpl->add('pk', $this->entity_id);
		
		$view_name = $this->view_prefix . $entity_name . '.' . $this->screen;
		if ($this->tpl->view_defined($view_name, $checked_files)) {
			$this->tpl->view($view_name);
		} else {
			$this->tpl->add('custom_view', $view_name);
			$this->tpl->view('crud/' . $this->screen);
		}
		
		parent::__init();
	}

	/**
	 * action /ctl/create
	 * accept POST, GET
	**/
	function create() {
		if ($_POST) {
			if ($this->parent_ctl && $this->parent_ctl->entity_name && $this->parent_ctl->entity_id) {
				$_POST[$this->parent_ctl->entity_name . '_id'] = $this->parent_ctl->entity_id;
			}
			$id = $this->entity->create($_POST);
			$this->_relative_redirect($id . '/view' . ($this->format ? '.' . $this->format : ''));
		} else {
			
		}
		
	}
	
	/**
	 * action /ctl/entity, /ctl/entity/view
	 * accept GET
	**/
	function view() {
		
	}
	
	/**
	 * action /ctl/entity/edit
	 * accept POST, GET
	**/
	function edit() {
		
		if ($_POST) {
			$this->entity->update($_POST);
			$this->_relative_redirect('view');
		}
		
	}
	
	/**
	 * action /ctl/entity/remove
	 * accept POST, GET
	**/
	function remove() {
		if ($_POST) {
			$this->entity->delete();
			$this->_relative_redirect('..');
		}
	}
	
	/**
	 * /ctl/
	 * accept GET
	**/
	function index() {
		
		$sql = 'SELECT * FROM ' . db_escape($this->table);
		if ($this->parent_ctl && $this->parent_ctl->entity_name && $this->parent_ctl->entity_id) {
			$parent_fk = $this->parent_ctl->entity_name . '_id';
			$this_fk = $this->entity_name . '_id';
			$parent_link_table = config('db_prefix') . $this->parent_ctl->entity_name . '_to_' . $this->entity_name;
			$parent_link_table_alter = config('db_prefix') . $this->entity_name . '_to_' . $this->parent_ctl->entity_name;
			lg('aaaaaaaaaaaa "' . db_object_exists($this->table, $parent_fk) . '" '. $this->table . ' ' . $parent_fk);
			if (db_object_exists($this->table, $parent_fk)) {
				$sql .= ' WHERE `' . $parent_fk . '` = ' . (int)$this->parent_ctl->entity_id;
			} elseif (db_object_exists($parent_link_table, array($parent_fk, $this_fk))) {
				$sql .= ' WHERE EXISTS (SELECT * FROM `' . $parent_link_table . 
				'` x WHERE x.`' . $parent_fk . '` = ' . (int)$this->parent_ctl->entity_id . ' AND ' . $this->table . '.id = x.' . $this_fk . ')';
			} elseif (db_object_exists($parent_link_table_alter, array($parent_fk, $this_fk))) {
				$sql .= ' WHERE EXISTS (SELECT * FROM `' . $parent_link_table_alter . 
				'` x WHERE x.`' . $parent_fk . '` = ' . (int)$this->parent_ctl->entity_id . ' AND ' . $this->table . '.id = x.' . $this_fk . ')';
			} else {
				lg("Can not find master entity ({$this->parent_ctl->entity_name}) for slave entity ({$this->entity_name}): field $parent_fk in table $this->table not found, also not found table $parent_link_table or $parent_link_table_alter with columns ($parent_fk, $this_fk)", 'error');
			}
			
		}
		$this->tpl->add('index', db_fetch_all($sql));
	}
}

class auth_ctl extends std_ctl {
	
	function register() {
		if ($_POST) {
			if ($this->user->register($_POST)) {
				$this->login();
			}
		}
		$this->tpl->view('user.register');
	}
	
	function login() {
		if ($_POST) {
			if ($this->user->login($_POST)) {
				$redirect = wd_fetch_var('redirect', '/note');
				header('Location: ' . $redirect);
				exit;
			}
		}
		$this->tpl->view('user.login');
	}
	
	function logout() {
		$this->user->logout();
		header('Location: /system/login');
		exit;
	}
	
	function activate() {
		
	}
	
	function reset_password() {
		
	}
}

?>
