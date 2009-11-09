<?php
// :folding=explicit:

class user {
	
	var $logged_in = false;
	
	function user($init_by = null) { /* {{{ */
		
		if (is_null($init_by)) {
			return;
		}
		
		if (is_scalar($init_by)) {
			// user can be init by string key or by int id
			if (is_numeric($init_by)) {
				$where_what = 'id = "' . (int) $init_by . '"';
			} elseif (is_string($init_by)) {
				$where_what = 'user_key = "' . db_escape($init_by) . '" AND
					user_key_mode = "enabled"';
			} else {
				// what else? maybe array or object -- think about it
				trigger_error('Numeric or string param expected');
			}
			$u = $this->fetch_userdata($where_what);
			if (!$u) {
				trigger_error('User not found ');
			}
		} else {
			if (is_object($init_by)) {
				$u = get_object_vars($init_by);
			} elseif (is_array($init_by)) {
				$u = $init_by;
			} else {
				trigger_error('Unexpected user initializer');
			}
		}
		$this->set_userdata($u, false);
		/* }}} */
	}
	
	function fetch_userdata($where_what) {
		return db_fetch_one('
			SELECT *
			FROM user
			WHERE 
				' . $where_what . '
			LIMIT 1
		');
	}
	
	function set_userdata($data, $remove_user_id = true) {
		if (is_object($data)) {
			$data = get_object_vars($data);
		}
		if ($remove_user_id && isset($data['id'])) {
			unset($data['id']);
		}
		if (isset($data['password'])) {
			$data['password'] = $this->encode_password($data['password']);
		}
		foreach ($data as $k => $v) {
			$this->$k = $v;
		}
	}
	
	function register($data) {
		if (is_object($data)) {
			$data = get_object_vars($data);
		}
		$this->set_userdata($data);
		if ($this->userdata_valid()) {
			$this->id = db_insert('user', $this);
			lg('User registered');
			return true;
		} else {
			lg('Userdata is not valid', 'error');
			return false;
		}
	}
	
	function userdata_valid() {
		if (empty($this->email) || 
			$this->fetch_userdata('email = "' . db_escape($this->email) . '"')) {
			return false;
		}
		if (empty($this->name)) {
			$this->name = preg_replace('/\\@.*/', '', $this->email);
		}
		return true;
	}
	
	function has_role($role_name) { /* {{{ */
		
		return db_fetch_value('
			SELECT count(*)
			FROM 
				role INNER JOIN user_to_role u ON role.id = u.role_id
			WHERE
				u.user_id = ' . $this->id . '
				AND
				role.name = "' . db_escape($role_name) . '"
		');
		
		/* }}} */
	}
	
	function login($data) { /* {{{ */
		if (is_object($data)) {
			$data = get_object_vars($data);
		}
		if (isset($data['email'], $data['password'])) {
			$u = $this->fetch_userdata('email = "' . db_escape($data['email']) .
				'" AND password = "' . $this->encode_password($data['password']) . '"');
			if ($u) {
				$_SESSION['user_id'] = $u->id;
				$this->update_attributes(array('logged_in' => 1,
					'last_logon' => db_date()));
				return true;
			}
			lg('User not found', 'error');
			return false;
		}
		lg('Post data incomplete (email and password required)');
		return false;
		/* }}} */
	}
	
	function logout() {
		$this->update_attribute('logged_in', 0);
	}
	
	function encode_password($password) {
		return md5($password . config_or_default('salt', 'default~s!a@l#t$'));
	}
	
	function update_attribute($name, $value) { /* {{{ */
		if (empty($this->id)) {
			return false;
		}
		if ($name == 'id') {
			trigger_error('This attribute cannot be updated');
		}
		$this->$name = $value;
		db_update(
			'user',
			$this->id,
			array(
				$name => $value
			)
		);
		/* }}} */
	}
	
	function update_attributes($attributes) { /* {{{ */
		if (empty($this->id)) {
			return false;
		}
		foreach ($attributes as $name => $value) {
			if ($name == 'id') {
				unset($attributes[$name]);
			} else {
				$this->$name = $value;
			}
		}
		db_update(
			'user',
			$this->id,
			$attributes
		);
		/* }}} */
	}
}

?>
