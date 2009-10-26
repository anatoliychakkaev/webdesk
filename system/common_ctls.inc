<?php

class std_ctl {
	var $screen;
	var $path;
	var $format;
	
	function __parse_path(&$current_index, $path) {
		
		$path_prefix = '';
		$this->screen 	= @$path[$current_index]	or	$this->screen		= '';
		// define entity (if action starts with numer or uppercase letter)
		if (preg_match('/^([A-Z]*)([0-9]+)$/', $this->screen, $entity)) {
			
			$this->entity_code	= $entity[1];
			$this->entity_id		= (int) $entity[2];
			$this->screen 		= @$path[$current_index + 1]	or	$this->screen	= '';
			
			$path_prefix .= $this->entity_code . $this->entity_id . '/';
			
		} else {
			
			$this->entity_code	= '';
			$this->entity_id		= 0;
			
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
		$this->{$this->screen}();
	}
	
	function _relative_redirect($path = '') {
		header('Location: ' . $this->path_prefix . $path);
	}
}

class crud_ctl extends std_ctl {
	/**
	 * Table name
	**/
	var $table;
	
	var $entity_name = 'data';
	
	/**
	 * This field contains primary key of current record
	**/
	var $primary_key;
	
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
			trigger_error('crud controller requires $table field');
		}
		
		//if (file_exists('model/
		
		require_once 'model/orm.inc';
		$this->entity = new universal_entity($this->table);
		
		$this->table_info = db_desc($this->table);
		if (!$this->table_info) trigger_error('Table ' . $this->table . ' not found');
		
		$this->tpl->add('table_info', $this->table_info);
		
		if ($this->entity_id) {
			$this->primary_key = $this->entity_id;
			$this->entity->load($this->entity_id);
			if (!$this->screen) {
				$this->screen = 'view';
			}
		} else {
			if (!$this->screen) {
				$this->screen = 'index';
			}
		}
		
		$this->tpl->add('pk', $this->primary_key);
		
		$cols = $this->table_info->columns;
		foreach ($cols as $key => $value) {
			if (preg_match('/(varchar|[a-z]*int)\\((\\d+)\\)/i', $cols->{$key}['Type'], $typedef)) {
				$cols->{$key}['Size'] = $typedef[2];
				if ($typedef[1] == 'varchar' && $typedef[2] > 255) {
					$cols->{$key}['EffectiveType'] = 'text';
				} else {
					$cols->{$key}['EffectiveType'] = $typedef[1];
				}
			} else {
				$cols->{$key}['EffectiveType'] = $cols->{$key}['Type'];
			}
		}
		
		if ($this->primary_key) {
			$this->data = db_select($this->table, $this->primary_key);
			$this->tpl->add($this->entity_name, $this->data);
			$d = get_object_vars($this->data);
			foreach ($d as $key => $value) {
				$cols->{$key}['Value'] = $value;
			}
		}
		
		$this->table_info->columns = $cols;
		
		$view_name = $this->view_prefix . $this->table . '.' . $this->screen;
		if ($this->tpl->view_defined($view_name)) {
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
			//$id = db_insert($this->table, $_POST);
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
			//db_update($this->table, $this->primary_key, $_POST);
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
			//db_delete($this->table, $this->primary_key);
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

?>
