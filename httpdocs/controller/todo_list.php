<?php

class todo_list_ctl extends crud_ctl {
	
	var $table = 'wd_todo_list';
	var $entity_name = 'todo_list';
	
	function view() {
		$this->_relative_redirect('todos');
	}
	
}


?>
