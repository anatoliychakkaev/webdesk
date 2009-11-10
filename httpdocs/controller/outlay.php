<?php

class outlay_ctl extends crud_ctl {
	
	var $table = 'outlay';
	
	function __init() {
		$this->tpl->add('outlay_categories', db_fetch_array('
			SELECT id, name
			FROM outlay_category',
			'name', 'id'));
		return parent::__init();
	}

	function index() {
		$sql = '
			SELECT outlay.*, c.name, user.name as author_name
			FROM
				outlay INNER JOIN
				outlay_category c ON c.id = outlay.outlay_category_id LEFT JOIN
				user ON user.id = outlay.user_id
			WHERE WEEK(TIMESTAMPADD(DAY, -1, outlay.created_at)) = WEEK(NOW())
			ORDER BY outlay.created_at ASC
		';
		$this->tpl->add('index', db_fetch_all($sql));
	}
	
	function create() {
		if ($_POST) {
			$_POST['user_id'] = $this->user->id;
			$id = db_insert($this->table, $_POST);
			$this->_relative_redirect('index');
		}
	}
	
	function edit() {
		$this->tpl->add('outlay', db_fetch_one('SELECT * FROM outlay WHERE id = ' . $this->entity_id));
		parent::edit();
	}
}


?>
