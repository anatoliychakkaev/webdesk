<?php

// :folding=explicit:tabSize=4:collsapseFolds=0:

//require_once 'todo.class.inc';
class todo_handler { /* {{{ */
	
	/**
	 * @param $problem_id int
	 * @return object problem
	 */
	function get_problem ($problem_id) { /* {{{ */
		/* TODO: Check owner */
		return db_fetch_one('
			SELECT
				p.id,
				p.name,
				p.deadline,
				p.description,
				p.priority,
				p.state_id,
				p.owner_id,
				p.is_actual,
				p.create_date,
				s.date as sol_date,
				s.comment as sol_comment,
				s.id as sol_id,
				s.is_active,
				c.icon as cat_icon,
				c.id as cat_id,
				c.name as cat_name
			FROM
				problem p LEFT JOIN 
				solution s ON p.id = s.problem_id LEFT JOIN
				problem_category c ON p.category_id = c.id
			WHERE
				p.id = ' . (int) $problem_id . '
			LIMIT 1;
		');
		/* }}} */
	}
	
	/**
	 * @param $data array (assoc) Problem
	 * @return int problem_id if success and 0 if error
	 *
	 */
	function create_problem ($data) { /* {{{ */
		
		$make_decision = isset($data['decide_problem']);
		$data['owner_id'] = $this->user_id;
		$data['state_id'] = $make_decision?2:1;
		
		$id = db_insert('problem', $data);
		
		if (!$id) {
			$this->error('Can not insert data in problems table');
			return 0;
		}
		
		if ($make_decision) {
			db_insert('solution', array(
				'problem_id' => $id,
				'date' => now()
				)
			);
		}
		
		return $id;
		/* }}} */
	}
	
	/**
	 * @param $data array (assoc) Problem
	 *
	 */
	function update_problem ($data) { /* {{{ */
		
		return db_update('problem', $data);
		
		/* }}} */
	}
	
	/**
	 * @param $problem_id array or integer or string of int separated by commas
	 */
	function delete_problem ($problem_id) { /* {{{ */
		/* TODO: check owner */
		if (is_numeric($problem_id)) {
			
			$ids_arr = array($problem_id);
			
		} elseif(is_string($problem_id)) {
			
			$ids_arr = split(',', $problem_id);
			foreach ($ids_arr as $l=>$r) {
				$ids_arr[$l]=(int)$r;
			}
			
		} elseif (!is_array($problem_id)) {
			
			trigger_error('Integer, string of comma separated integers or array of integers expected', E_USER_ERROR);
			
		}
		
		return db_execute("
			UPDATE Problem
			SET 
				is_actual = '0',
				state_id = 6
			WHERE 
				id IN (" . join(',', $ids_arr) . ");
		");
		/* }}} */
	}
	
	function get_problems () {
		return db_fetch_all('
			SELECT
				p.*
			FROM
				problem p left join 
				solution s on s.problem_id = p.id left join 
				problem_category c on p.category_id = c.id
			WHERE
					owner_id = ' . $user_id . '
				AND(
					state_id <> 6
				AND
					s.date IS NULL
				OR
					(
						s.date >= CURDATE()
					OR
						(
							s.date < CURDATE()
						AND
							state_id IN (2)
						)
					)
				)
			ORDER BY p.create_date, s.`date`,s.ID
		');
	}
	
	function get_categories () {
		
		return db_fetch_all('SELECT * FROM problem_category');
		
	}
	/* }}} */
}

class todo_ctl extends std_ctl { /* {{{ */
	
	/**
	 * @var $handler object of class todo_handler
	 */
	var $handler;
	
	function todo_ctl () {
		
		$this->handler = new todo_handler();
		
	}
	
	function problem ($problem_id = 0) {
		
		$problem = $this->handler->get_problem($problem_id);
		$this->tpl->add($problem);
		$this->view('todo/problem');
		
	}
	
	/**
	 * Add problem[ with decision]
	 */
	function problem_add () {		/* {{{ */
		
		if ($_POST) {
			$id = $this->handler->create_problem($_POST);
			if (!$this->handler->is_error()) {
				
				// goto problem screen
				return $this->problem($id);
				
			} else {
				$this->tpl->add('error', $this->handler->get_error());
				$this->tpl->add('problem', $_POST);
			}
		} else {
			$this->tpl->add('problem', $this->handler->get_blank_problem());
		}
		
		$this->tpl->view('todo/problem.add');
		
	/* }}} */
	}
	
	/**
	 * @accept POST
	 * @path /ctl/P00000N/edit
	 */
	function problem_edit () {		/* {{{ */
		
		if ($_POST) {
			$this->handler->update_problem($_POST);
			// goto problem screen
			return $this->problem($_POST['problem_id']);
		} else {
			$this->handler->get_problem();
		}
	/* }}} */
	}
	
	/**
	 * @accept POST
	 * @path /ctl/P00000N/delete
	 */
	function problem_delete () {	/* {{{ */
		$ids = cm_post('PID','str');
		if(strlen($ids)==0){
			echo '{errcode:1}';
			break;
		}
		$this->handler->delete_problem($ids);
		echo '{errcode:0, NewStateID:6}';
		/* }}} */
	}
	
	/**
	 * @accept POST
	 * @path /ctl
	 */
	function problems () {			/* {{{ */
		$user_id = 1; //$_SESSION['user']['id'];
		$this->tpl->add('problems', $this->handler->get_problems());
		$this->tpl->add('categories', $this->handler->get_categories());
		/* }}} */
	}
	
	/**
	 * @accept POST
	 * @path /ctl/P00000N/success
	 */
	function problem_success () {	/* {{{ */
		
		$isfull = cm_get('IsFull');
		$isroll = cm_get('IsRollback');
		if ($isroll) {
			$state = 2;
		} else {
			$state = $isfull?4:7;
		}
		db_execute('
			UPDATE problem
			SET state_id = ' . $state . '
			WHERE id = (SELECT problem_id FROM solution WHERE id = ' . cm_get('SolutionID') . ');
		');
		db_execute('
			UPDATE solution
			SET 
				is_active = '.($isroll?1:0).',
				`date` = now()
			WHERE id = ' . cm_get('SolutionID') . ' AND is_active = ' . ($isroll?0:1) . ';
		');
		echo '{errcode:0,NewStateID:'.$state.'}';
		/* }}} */
	}
	
	/**
	 * @accept POST
	 * @path /ctl/P00000N/history
	 */
	function problem_history () {	/* {{{ */
		$r = db_fetch_all('
			SELECT
				'.$problem_rows.'
			FROM
				problem p left join solution s on s.problem_id = p.id
				left join problem_category c on p.category_id = c.id
			WHERE
					owner_id = '.(int)$_SESSION['user']['id'].'
				AND
					state_id IN (4, 7)
			ORDER BY p.priority ASC, s.date ASC
		');
		echo php2js($r);
		/* }}} */
	}
	
	/**
	 * @accept POST
	 * @path /ctl/P00000N/create_solution
	 */
	function solution_add () {		/* {{{ */
		$d = cm_get('Date', 'date');
		$ids = cm_get('ProblemID','str');
		if(strlen($ids)==0){
			echo '{errcode:1}';
			break;
		}
		$ids_arr = split(',',$ids);
		$union = array();
		foreach($ids_arr as $id){
			$union[] = 'SELECT '.$id.',\''.cm_get('Date','date').'\',1';
		}
		
		db_execute('
			UPDATE problem
			SET state_id = 2
			WHERE id IN ('.$ids.') AND state_id <>7;');
		db_execute('
			UPDATE solution
			SET is_active = 0
			WHERE problem_id IN ('.$ids.');');
		db_execute('
			INSERT INTO solution(
				`problem_id`,
				`date`,
				`is_active`
			)
			'.implode(' UNION ',$union).';');
		$r = $db->q2assoc("
			SELECT
				0 AS errcode,
				$problem_rows
			FROM 
				problem p INNER JOIN solution s ON p.id = s.problem_id
				left join problem_category c on p.category_id = c.id
			WHERE s.is_active = '1' AND p.id IN ($ids);
		");
		echo php2js($r);
	/* }}} */
	}
	
	/**
	 * Edit solution M for problem N
	 * @accept POST
	 * @path /ctl/P00000N/S00000M/edit
	 */
	function solution_save () {		/* {{{ */
		db_execute('
			UPDATE solution
			SET
				`date` = \''.cm_get('Date','date').'\'
				'.(isset($_POST['Comment'])?',`Comment` = \''.cm_post('Comment','str').'\'':'').'
			WHERE 
				`id` = '.cm_get('SolutionID').';
		');
		echo '{errcode:0}';
		/* }}} */
	}
	
	/**
	 * Remove solution M for problem N
	 * @accept POST
	 * @path /ctl/P00000N/S00000M/delete
	 */
	function solution_delete () {	/* {{{ */
		$ids = cm_get('SolID','str');
		if(strlen($ids)==0){
			echo '{errcode:1}';
			break;
		}
		$ids_arr = split(',',$ids);
		
		
		db_execute('
			UPDATE problem
			SET state_id = 1
			WHERE ID IN (
				SELECT problem_id
				FROM solution
				WHERE id IN ('.$ids.')
			);');
		db_execute('
			DELETE FROM solution
			WHERE id IN ('.$ids.');');
		
		echo '{errcode:0,NewStateID:1}';
		/* }}} */
	}
	
	// TODO: remove to another ctl
	
	//{{{ 
	
	function HelpTopic () {			/* {{{ */
		$n = cm_get('Name','str');
		
		// get topic id
		$r = $db->q2assoc('
			SELECT ht.id
			FROM help_topic ht
			WHERE name = \''.$n.'\'
			LIMIT 1;'
		,true);
		$topic_id = (int)$r['id'];
		if(!$topic_id){
			echo php2js(array('name'=>$n));
			break;
		}
		// get author's topic content edition
		$r = $db->q2assoc('
			SELECT id FROM
				help_topic_content
			WHERE
				topic_id = '.$topic_id.'
			AND
				state_id = 1
			AND
				author_id = '.$_SESSION['user']['id'].'
			LIMIT 1;'
		,true);
		$max_id = (int)$r['id'];
		
		$r = $db->q2assoc('
			SELECT ht.*, htc.text as content, '.$max_id.' as not_approved
			FROM
				help_topic ht INNER JOIN help_topic_content htc
				ON '.($max_id?'htc.topic_id = ht.id':'htc.id = ht.content_id').'
			WHERE
				'.($max_id?'htc.id = '.$max_id:'ht.id = '.$topic_id).'
			LIMIT 1;'
		,true);
		
		$r['name'] = $n;
		echo php2js($r);
		/* }}} */
	}
	
	function SaveHelpTopic () {		/* {{{ */
		if(empty($_POST['name']))break;
		$c = cm_post('Content','str');
		$uid = (int)$_SESSION['user']['id'];
		$name = cm_post('name','str');
		$x = $db->q2assoc('SELECT * FROM help_topic WHERE name = \''.$name.'\';',true);
		if($x){
			$topic_id = (int)$x['id'];
		}else{
			db_execute('INSERT INTO help_topic (name) VALUES (\''.$name.'\')');
			$topic_id = (int)mysql_insert_id();
		}
		$r = $db->q2assoc('
			SELECT id FROM
				help_topic_content
			WHERE
				topic_id = '.$topic_id.'
			AND
				state_id = 1
			AND
				author_id = '.$uid.'
			LIMIT 1;'
		,true);
		if($r){
			db_execute('
				UPDATE help_topic_content
				SET
					`text` = \''.$c.'\',
					`create_date` = now()
				WHERE
					`id` = '.$topic_id);
		}else{
			db_execute('
				INSERT INTO help_topic_content(`topic_id`,`text`, `author_id`, `state_id`, `approver_id`, `create_date`)
				VALUES ('.$topic_id.',\''.$c.'\','.$uid.',1,null,now())
			');
		}
		echo '{errcode:0}';
		/* }}} */
	}
	
	function Categories () {		/* {{{ */
		cm_query_n_pack('select id, name from problem_category');
		/* }}} */
	}
	
	function ModifiedTopics () {	/* {{{ */
		echo cm_pack_query_to_json('
			SELECT
				ht.ID, ht.Name, ht.ContentID as CurrentContentID,
				htc.ID as ContentID, htc.StateID, htc.AuthorID, htc.DateCreate
			FROM
				HelpTopic ht
			INNER JOIN
				HelpTopicContent htc
			ON
				(htc.TopicID=ht.ID AND htc.StateID=1)
			OR
				(ht.ContentID=htc.ID AND htc.StateID=2 AND EXISTS(
					SELECT * FROM HelpTopicContent htc2 WHERE htc2.TopicID=ht.ID AND htc2.StateID=1
				))
			ORDER BY
				htc.TopicID, htc.DateCreate
		');
		/* }}} */
	}
	
	// }}}
	/* }}} */
}

?>
