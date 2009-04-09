<?php

// :folding=explicit:tabSize=4:

class std_ctl {
	var $screen;
	var $path;
	var $format;
	
	function init (&$path, &$screen, &$format) {
		global $tpl;
		
		$this->path  	=& $path;
		$this->screen	=& $screen;
		$this->format	=& $format;
		
		$this->tpl   	=& $tpl;
	}
	
}

class crud_ctl extends std_ctl {
	var $table;
	var $primary_key;
	
	function create () {
		
		$this->primary_key = db_insert($this->table, $_POST);
		$this->read();
	}
	
	function read () {
		
	}
	
	function update () {
		
		db_update($this->table, $this->primary_key, $_POST);
		$this->read();
	}
	
	function delete () {
		
		db_delete($this->table, $this->primary_key);
	}
	
}

class db_ctl extends std_ctl {
	
	var $db_name;
	var $tbl_name;
	
	function init (&$path, &$screen, &$format) { /* {{{ */
		
		parent::init($path, $screen, $format);
		
		switch (count($path)) {
		case 1:
			$screen			= 'server';
			break;
		case 2:
			$screen			= 'database';
			$this->db_name	= $path[1];
			break;
		case 3:
			$screen			= 'table';
			$this->db_name	= $path[1];
			$this->tbl_name	= $path[2];
			break;
		default:
			$this->db_name	= $path[1];
			$this->tbl_name	= $path[2];
			$screen			= $path[3];
			break;
		}
		
		if ($this->db_name) {
			$this->tpl->add('database', $this->db_name);
		}
		
		if ($this->tbl_name) {
			$this->tpl->add('table', $this->tbl_name);
		}
		/* }}} */
	}
	
	/**
	 * MySQL server contents
	 *
	 */
	function server () { /* {{{ */
		
		$this->tpl->add(
			'databases',
			db_fetch_array('SHOW DATABASES')
		);
		$this->tpl->view('db.server');
		/* }}} */
	}
	
	/**
	 * Database server contents (list of tables)
	 *
	 */
	function database () { /* {{{ */
		
		$this->tpl->add(
			'tables',
			db_fetch_array('SHOW TABLES FROM `' . db_escape($this->db_name) . '`;')
		);
		$this->tpl->view('db.database');
		/* }}} */
	}
	
	/**
	 * Table columns
	 *
	 */
	function table () { /* {{{ */
		
		$full_tbl_name = '`' . db_escape($this->db_name) . '`.`' . db_escape($this->tbl_name) . '`';
		$this->tpl->add(
			'columns',
			db_fetch_all('DESCRIBE ' . $full_tbl_name)
		);
		
		$this->tpl->add(
			'create',
			db_fetch_value('SHOW CREATE TABLE ' . $full_tbl_name, 'Create Table')
		);
		$this->tpl->view('db.table');
		/* }}} */
	}
	
	/**
	 * Table data
	 *
	 */
	function data () { /* {{{ */
		
		$full_tbl_name = '`' . db_escape($this->db_name) . '`.`' . db_escape($this->tbl_name) . '`';
		$page = (int) @$_GET['page'] or $page = 0;
		$iop = 10;
		
		$data = new stdClass();
		$data->total_row_count = db_fetch_value('SELECT count(*) FROM ' . $full_tbl_name);
		$data->rows = db_fetch_all('
			SELECT *
			FROM ' . $full_tbl_name . '
			LIMIT ' . $iop*$page . ', ' . $iop
		);
		
		$data->current_page = $page;
		$data->pages_count = ceil($data->total_row_count / $iop);
		$data->columns = db_fetch_array('DESCRIBE ' . $full_tbl_name, 'Field');
		
		$this->tpl->add('data', $data, 'grid_rows');
		$this->tpl->view('db.table_data');
		/* }}} */
	}
}

?>
