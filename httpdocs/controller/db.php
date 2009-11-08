<?php

// :folding=explicit:tabSize=4:

class db_ctl extends std_ctl { /* {{{ */
	
	// defined in supercontroller
	var $path;
	var $screen;
	var $format;
	
	// roles accessed to this ctl
	//var $required_role = 'admin';
	
	// handled by this controller
	var $db_name;
	var $tbl_name;
	
	function __parse_path($path_offset, $path) { /* {{{ */
		
		switch (count($path)) {
		case 1:
			$this->screen	= 'server';
			break;
		case 2:
			$this->screen	= 'database';
			$this->db_name	= $path[1];
			break;
		case 3:
			$this->screen	= 'table';
			$this->db_name	= $path[1];
			$this->tbl_name	= $path[2];
			break;
		default:
			$this->db_name	= $path[1];
			$this->tbl_name	= $path[2];
			$this->screen	= $path[3];
			break;
		}
		
		$path_offset += count($path);
		
		if ($this->db_name) {
			$this->tpl->add('database', $this->db_name);
		}
		
		if ($this->tbl_name) {
			$this->tpl->add('table', $this->tbl_name);
			$this->full_tbl_name = '`' . db_escape($this->db_name) . '`.`' . db_escape($this->tbl_name) . '`';
		}
		
		return join('/', $path);
		
		/* }}} */
	}
	
	/**
	 * MySQL server contents
	 * 
	 * @path: /ctl
	 * @accept: get
	 * @view: db.server
	 *
	**/
	function server() { /* {{{ */
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
	 * @path: /ctl/$db_name
	 * @accept: get
	 * @view: db.database
	 *
	**/
	function database() { /* {{{ */
		
		$this->tpl->add(
			'tables',
			db_fetch_array('SHOW TABLES FROM `' . db_escape($this->db_name) . '`;')
		);
		$this->tpl->view('db.database');
		/* }}} */
	}
	
	/**
	 * Table columns
	 * @path: /ctl/$db_name/$tbl_name
	 * @accept: get
	 * @view: db.table
	 *
	**/
	function table() { /* {{{ */
		
		$this->tpl->add(
			'columns',
			db_fetch_all('DESCRIBE ' . $this->full_tbl_name)
		);
		
		$this->tpl->add(
			'create',
			db_fetch_value('SHOW CREATE TABLE ' . $this->full_tbl_name, 'Create Table')
		);
		$this->tpl->view('db.table');
		/* }}} */
	}
	
	/**
	 * Table data
	 * @path: /ctl/$db_name/$tbl_name/data
	 * @accept: get
	 * @view: db.table_data
	 *
	**/
	function data() { /* {{{ */
		
		$page = (int) @$_GET['page'] or $page = 0;
		$iop = 10;
		
		$data = new stdClass();
		$data->total_row_count = db_fetch_value('SELECT count(*) FROM ' . $this->full_tbl_name);
		$data->rows = db_fetch_all('
			SELECT *
			FROM ' . $this->full_tbl_name . '
			LIMIT ' . $iop * $page . ', ' . $iop
		);
		
		$data->current_page = $page;
		$data->pages_count = ceil($data->total_row_count / $iop);
		$data->columns = db_fetch_array('DESCRIBE ' . $this->full_tbl_name, 'Field');
		
		$this->tpl->add('data', $data, 'grid_rows');
		$this->tpl->view('db.table_data');
		/* }}} */
	}
	
	/* }}} */
}

?>
