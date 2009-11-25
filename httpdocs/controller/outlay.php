<?php

class outlay_ctl extends crud_ctl {
	
	var $table = 'outlay';
	
	/*
	function __parse_path(&$current_index, $path) {
		$pp = parent::__parse_path(&$current_index, $path);
		
		return $pp;
	}
	*/
	
	function __init() {
		// parent init should be called first
		parent::__init();
		
		// hook deefault view into weekly action
		if ($this->screen == 'index') {
			$this->screen = 'weekly';
		}
		
		// assign common attributes (required for all actions)
		$this->tpl->add_secondary('outlay_categories', db_fetch_array('
			SELECT id, name
			FROM outlay_category',
			'name', 'id'));
	}
	
	function weekly() {
		$year_week = cm_get('year_week', 'string') or
		$year_week = date('Y_W');
		list($year, $week) = split('_', $year_week);
		if (empty($_GET['go'])) {
			$offset = 1;
		} else {
			$offset = $_GET['go'] == 'prev' ? 2 : 0;
		}
		$time = strtotime($year . '0104 +' . ($week - $offset) . ' weeks');
		$date = db_date($time);
		
		$sql_breakdown = '
			SELECT SUM(outlay.value) AS sum, c.name
			FROM
				outlay INNER JOIN
				outlay_category c ON c.id = outlay.outlay_category_id
			WHERE
				WEEK(TIMESTAMPADD(DAY, -1, outlay.created_at)) =
				WEEK(TIMESTAMPADD(DAY, -1, "' . $date . '"))
			GROUP BY
				c.name
		';
		$this->tpl->add('breakdown', db_fetch_all($sql_breakdown));
		
		$sql = '
			SELECT outlay.*, c.name, user.name as author_name
			FROM
				outlay INNER JOIN
				outlay_category c ON c.id = outlay.outlay_category_id LEFT JOIN
				user ON user.id = outlay.user_id
			WHERE
				WEEK(TIMESTAMPADD(DAY, -1, outlay.created_at)) =
				WEEK(TIMESTAMPADD(DAY, -1, "' . $date . '"))
			ORDER BY DAY(outlay.created_at) ASC, c.name ASC
		';
		
		$this->tpl->add('index', db_fetch_all($sql));
		$this->tpl->add('year_week', date('Y_W', $time));
		$this->tpl->add('week', date('W', $time));
		$this->tpl->view('outlay.index');
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

/* :collapseFolds=2: */
?>
