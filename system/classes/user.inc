<?php

class user {
	
	function user($id) {
		
		if (is_string($id)) {
			$where_what = 'user_key = "' . db_escape($id) . '" AND
				user_key_mode = "enabled"';
		} elseif (is_numeric($id)) {
			$where_what = 'id = "' . (int) $id . '"';
		} else {
			trigger_error('Numeric or string param expected');
		}
		
		$u = db_fetch_one('
			SELECT *
			FROM user
			WHERE 
				' . $where_what . '
			LIMIT 1
		');
		
		if (!$u) trigger_error('User not found');
		
		foreach($u as $k => $v) $this->$k = $v;
	}
	
	function has_role ($role_name) {
		
		return db_fetch_value('
			SELECT count(*)
			FROM 
				role INNER JOIN user_to_role u ON role.id = u.role_id
			WHERE
				u.user_id = ' . $this->id . '
				AND
				role.name = "' . db_escape($role_name) . '"
		');
		
	}
	
}

?>
