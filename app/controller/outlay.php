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
		
		$this->tpl->add_secondary('outlay_notes', db_fetch_array('
			SELECT DISTINCT note
			FROM outlay'));
		
	}
	
	function weekly() {
		$year_week = cm_get('year_week', 'string') or
		$year_week = date('Y_W');
		list($year, $week) = split('_', $year_week);
		$year = (int) $year;
		$week = (int) $week;
		
		if (isset($_GET['go'])) {
			$week += $_GET['go'] == 'prev' ? -1 : 1;
			if ($week == 0) {
				$year--;
				$week = 53;
			} elseif ($week == 54) {
				$year++;
				$week = 1;
			}
		}
		lg($week . ' week of ' . $year . ' year');
		$first_jan = mktime(0, 0, 0, 1, 1, $year);
		$weekday_first_jan = (int) strftime('%w', $first_jan);
		$delta = 4 - $weekday_first_jan;
		
		if ($delta < 0) {
			$delta = $delta + 7;
		}
		
		$first_week_start = $first_jan + ($delta - 3) * 86400;
		$nth_week_start = $first_week_start + 86400 * 7 * ($week - 1);
		$nth_week_end = $nth_week_start + 86400 * 7 - 1;
		$date_start = db_date($nth_week_start);
		$date_end = db_date($nth_week_end);
		$sql_breakdown = '
			SELECT SUM(outlay.value) AS sum, c.name
			FROM
				outlay INNER JOIN
				outlay_category c ON c.id = outlay.outlay_category_id
			WHERE
				outlay.created_at BETWEEN "' . $date_start . '" AND "' . $date_end . '"
			GROUP BY
				c.name
		';
		$this->tpl->add('breakdown', db_fetch_all($sql_breakdown));
		
		$sql = '
			SELECT
				outlay.*,
				c.name,
				user.name as author_name,
				DAY(outlay.created_at) as weekday
			FROM
				outlay INNER JOIN
				outlay_category c ON c.id = outlay.outlay_category_id LEFT JOIN
				user ON user.id = outlay.user_id
			WHERE
				outlay.created_at BETWEEN "' . $date_start . '" AND "' . $date_end . '"
			ORDER BY
				MONTH(outlay.created_at),
				weekday ASC,
				c.name ASC,
				outlay.created_at
		';
		
		$outlay_records = db_fetch_all($sql);
		$weekdata = array();
		$prev_weekday = -1;
		$day->total = 0;
		$day->last_record_time = 0;
		$day->items = array();
		$cat->total = 0;
		$cat->items = array();
		$prev_cat = '';
		foreach ($outlay_records as $outlay) {
			// add old category to day, if new cat or new day
			if ($prev_cat && $outlay->name !== $prev_cat || $prev_weekday !== -1 && $prev_weekday !== $outlay->weekday) {
				$day->total += $cat->total;
				$day->items[] = $cat;
				$last_record_time = $cat->items[count($cat->items) - 1]->created_at;
				if ($day->last_record_time < $last_record_time) {
					$day->last_record_time = $last_record_time;
				}
				$cat = new stdClass();
				$cat->total = 0;
				$cat->items = array();
			}
			// add old day to week, if new day
			if ($prev_weekday !== -1 && $prev_weekday !== $outlay->weekday) {
				$last_cat = $day->items[count($day->items) - 1];
				$last_record_time = $last_cat->items[count($last_cat->items) - 1]->created_at;
				if ($day->last_record_time < $last_record_time) {
					$day->last_record_time = $last_record_time;
				}
				$weekdata[] = $day;
				$day = new stdClass();
				$day->total = 0;
				$day->items = array();
			}
			$cat->total += $outlay->value;
			$cat->items[] = $outlay;
			$prev_weekday = $outlay->weekday;
			$prev_cat = $outlay->name;
		}
		if ($prev_cat) {
			$day->total += $cat->total;
			$day->items[] = $cat;
			$last_record_time = $cat->items[count($cat->items) - 1]->created_at;
			if ($day->last_record_time < $last_record_time) {
				$day->last_record_time = $last_record_time;
			}
		}
		if ($prev_weekday !== -1) {
			$weekdata[] = $day;
		}
		
		$this->tpl->add('index', $outlay);
		$this->tpl->add('weekdata', $weekdata);
		$this->tpl->add('year', $year);
		//die(date('Y_W', $first_week_start));
		$this->tpl->add('week', $week);
		$this->tpl->view('outlay.index');
	}
	
	function create() {
		if ($_POST) {
			$_POST['user_id'] = $this->user->id;
			if (isset($_POST['mixed_value']) && strlen($_POST['mixed_value']) && preg_match('/^(\\d+[.,]?\\d*)\\s+([^:]+):?\\s*(.*)$/', $_POST['mixed_value'], $matches)) {
				$_POST['value'] = (float) str_replace(',', '.', $matches[1]);
				$_POST['note'] = trim($matches[3]);
				$category_name = trim($matches[2]);
				$catetory_id = db_fetch_value('
					SELECT id
					FROM outlay_category
					WHERE `name` = "' . db_escape($category_name) . '"
					LIMIT 1
				');
				if (!$catetory_id) {
					$catetory_id = db_insert('outlay_category', array('name' => $category_name));
				}
				$_POST['outlay_category_id'] = $catetory_id;
				$id = db_insert($this->table, $_POST);
			}
			$this->_relative_redirect('index');
		}
	}
	
	function report() {
		$categories = db_fetch_all('SELECT * FROM outlay_category');
		$summary->label = 'Все расходы';
		$summary->data = db_fetch_all('
			SELECT year(`created_at`) as year, month(`created_at`) as month, sum(value) as sum
			FROM outlay
			GROUP BY year(created_at), month(created_at)
		');
		$reports = array($summary);
		foreach ($categories as $category) {
			$c = new stdClass();
			$c->label = $category->name;
			$c->data = db_fetch_all('
				SELECT year(`created_at`) as year, month(`created_at`) as month, sum(`value`) as sum
				FROM `outlay`
				WHERE `outlay_category_id` = ' . (int)$category->id . '
				GROUP BY year(`created_at`), month(`created_at`)
			');
			$reports[] = $c;
		}
		foreach ($reports as $r => $report) {
			foreach ($report->data as $i => $p) {
				$reports[$r]->data[$i]->time = mktime(0, 0, 0, $p->month, 1, $p->year);
			}
		}
		$this->tpl->add('reports', $reports);
	}
	
	function edit() {
		$this->tpl->add('outlay', db_fetch_one('SELECT * FROM outlay WHERE id = ' . $this->entity_id));
		parent::edit();
	}
}

/* :collapseFolds=2: */
?>
