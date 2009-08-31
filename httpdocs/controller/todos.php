<?php

class todos_ctl extends crud_ctl {
	
	var $table = 'wd_todo';
	var $entity_name = 'todo';
	
	function index2() {
		$this->tpl->add('index', db_fetch_all('
			SELECT * FROM ' . db_escape($this->table) . '
			WHERE is_closed = 0
			ORDER BY date_created
		'));
	}
	
	function done() {
		$this->tpl->add('index', db_fetch_all('
			SELECT * FROM ' . db_escape($this->table) . '
			WHERE is_closed = 1
			ORDER BY date_closed
		'));
	}
	
}


?>
