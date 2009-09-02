<?php

class std_ctl {
	var $screen;
	var $path;
	var $format;
	
	function init () {
		
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
	function init() {
		
		if (!$this->table) trigger_error('crud controller requires $table field');
		
		$this->table_info = db_desc($this->table);
		if (!$this->table_info) trigger_error('Table ' . $this->table . ' not found');
		
		$this->tpl->add('table_info', $this->table_info);
		
		if ($this->entity_id) {
			$this->primary_key = $this->entity_id;
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
		
		parent::init();
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
			$id = db_insert($this->table, $_POST);
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
			db_update($this->table, $this->primary_key, $_POST);
			$this->_relative_redirect('view');
		}
		
	}
	
	/**
	 * action /ctl/entity/remove
	 * accept POST, GET
	**/
	function remove() {
		if ($_POST) {
			db_delete($this->table, $this->primary_key);
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
			$sql .= ' WHERE `' . $this->parent_ctl->entity_name . '_id` = ' . 
				(int)$this->parent_ctl->entity_id;
		}
		$this->tpl->add('index', db_fetch_all($sql));
	}
}

?>
