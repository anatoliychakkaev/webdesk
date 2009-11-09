<?php

class note_ctl extends crud_ctl {
	
	var $table = 'note';
	var $entity_name = 'note';
	
	function index($bind_as = 'index') {
		$sql = '
			SELECT note.*, user.name as author_name
			FROM note INNER JOIN user ON user.id = note.user_id
			ORDER BY id DESC
			LIMIT 20
		';
		$this->tpl->add($bind_as, db_fetch_all($sql));
	}
	
	function my() {
		if ($this->user->logged_in) {
			$sql = '
				SELECT note.*, user.name as author_name
				FROM note INNER JOIN user ON user.id = note.user_id
				WHERE user_id = ' . (int)$this->user->id . '
				ORDER BY id DESC
				LIMIT 20
			';
			$this->tpl->add('index', db_fetch_all($sql));
		}
		$this->tpl->view('note.index');
	}
	
	function create() {
		if ($_POST) {
			$_POST['user_id'] = $this->user->id;
			$id = db_insert($this->table, $_POST);
			if ($id) {
				$this->index('notes');
				$response->html = $this->tpl->fetch('in.notes_list.tpl');
				die(php2js($response));
			} else {
				die('{error: 1}');
			}
		}
	}
}


?>
