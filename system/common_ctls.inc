<?php

class std_ctl {
	var $screen;
	var $path;
	var $format;
	
/* 	function init (&$path, &$screen, &$format) {
		global $tpl;
		
		$this->path  	=& $path;
		$this->screen	=& $screen;
		$this->format	=& $format;
		
		$this->tpl   	=& $tpl;
	} */
	
}

class crud_ctl extends std_ctl {
	var $table;
	var $primary_key;
	var $view_prefix = '';
	
	function create () {
		
		$this->primary_key = db_insert($this->table, $_POST);
		$this->read();
	}
	
	function read () {
		
	}
	
	function update () {
		
		if ($_POST) {
			db_update($this->table, $this->primary_key, $_POST);
			$this->read();
		} else {
			$this->tpl->view($this->view_prefix . 'update.' . $this->table);
		}
	}
	
	function delete () {
		
		db_delete($this->table, $this->primary_key);
	}
	
}

?>
