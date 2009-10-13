<?php

class note_ctl extends crud_ctl {
	
	var $table = 'note';
	var $entity_name = 'note';
	
	function index() {
		$sql = '
			SELECT *
			FROM note
			WHERE user_id = ' . (int)$this->user->id . '
			ORDER BY id DESC
			LIMIT 20
		';
		$this->tpl->add('index', db_fetch_all($sql));
	}
	
}


?>
