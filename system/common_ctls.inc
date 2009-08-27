<?php

class std_ctl {
	var $screen;
	var $path;
	var $format;
	
}

class crud_ctl extends std_ctl {
	/**
	 * Table name
	**/
	var $table;
	
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
	 * action /ctl/create
	 * accept POST, GET
	**/
	function create() {
		
		if ($_POST) {
			$this->primary_key = db_insert($this->table, $_POST);
			$this->read();
		} else {
			$this->tpl->view($this->view_prefix . 'create.' . $this->table);
		}
		
	}
	
	/**
	 * action /ctl/entity, /ctl/entity/view
	 * accept GET
	**/
	function read() {
		
		$this->tpl->add($this->table, db_select($this->table, $this->primary_key));
		$this->tpl->view($this->view_prefix . 'view.' . $this->table);
		
	}
	
	/**
	 * action /ctl/entity/update
	 * accept POST, GET
	**/
	function update() {
		
		if ($_POST) {
			db_update($this->table, $this->primary_key, $_POST);
			$this->read();
		} else {
			$this->tpl->add($this->table, db_select($this->table, $this->primary_key));
			$this->tpl->view($this->view_prefix . 'update.' . $this->table);
		}
	}
	
	/**
	 * action /ctl/entity/remove
	 * accept POST, GET
	**/
	function remove() {
		if ($_POST) {
			db_delete($this->table, $this->primary_key);
		} else {
			$this->tpl->add($this->table, db_select($this->table, $this->primary_key));
			$this->tpl->view($this->view_prefix . 'remove.' . $this->table);
		}
	}
	
	/**
	 * /ctl/
	 * accept GET
	**/
	function index() {
		
		$this->tpl->view($this->view_prefix . 'index.' . $this->table);
		
	}
}

?>
