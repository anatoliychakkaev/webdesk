<?php

class note_ctl extends crud_ctl {
	
	var $table = 'note';
	var $entity_name = 'note';
	
	function __init() {
		parent::__init();
	}
	
	function index($bind_as = 'index') {
		$sql = '
			SELECT note.*, user.name as author_name
			FROM note LEFT JOIN user ON user.id = note.user_id
			ORDER BY id DESC
			LIMIT 20
		';
		$notes = db_fetch_all($sql);
		foreach ($notes as $i => $note) {
			$notes[$i]->tags = db_fetch_array('
				SELECT tag.name
				FROM tag INNER JOIN note_to_tag n ON n.tag_id = tag.id
				WHERE n.note_id = ' . $note->id . '
			');
		}
		$this->tpl->add($bind_as, $notes);
	}
	
	function by_tag() {
		$tag = @$this->path[1];
		$sql = '
			SELECT note.*, user.name as author_name
			FROM
				note INNER JOIN
				note_to_tag nt ON nt.note_id = note.id INNER JOIN
				tag ON tag.id = nt.tag_id LEFT JOIN
				user ON user.id = note.user_id 
			WHERE tag.name = "' . db_escape($tag) . '"
			ORDER BY id DESC
			LIMIT 20
		';
		$notes = db_fetch_all($sql);
		foreach ($notes as $i => $note) {
			$notes[$i]->tags = db_fetch_array('
				SELECT tag.name
				FROM tag INNER JOIN note_to_tag n ON n.tag_id = tag.id
				WHERE n.note_id = ' . $note->id . '
			');
		}
		$this->tpl->add('index', $notes);
		$this->tpl->view('note.index');
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
				foreach (preg_split('/,\s*/', $_POST['tags']) as $tag) {
					$tag_id = db_fetch_value('SELECT id FROM tag WHERE name = "'. db_escape($tag) . '"');
					if (!$tag_id) {
						$tag_id = db_insert('tag', array('name' => $tag));
					}
					db_insert('note_to_tag', array('note_id' => $id, 'tag_id' => $tag_id));
				}
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
