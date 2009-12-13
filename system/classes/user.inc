<?php

require_once 'model/orm.inc';

class user extends db_entity { /* {{{ */
	
	function user($init_by = null) { /* {{{ */
		
		parent::__construct();
		
		if (is_null($init_by)) {
			return;
		}
		
		if (is_scalar($init_by)) {
			// user can be init by string key or by int id
			if (is_numeric($init_by)) {
				$this->load($init_by);
			} elseif (is_string($init_by)) {
				$this->load_where('user_key = "' . db_escape($init_by) . '"');
			} else {
				// what else? maybe array or object -- think about it
				trigger_error('Numeric or string param expected');
			}
		} else {
			$this->set_attributes($init_by);
		}
		
		/* }}} */
	}
	
	function filter_attribute($name, $value) { /* {{{ */
		switch ($name) {
		case 'password':
			return $this->encode_password($value);
		default:
			return $value;
		}
		/* }}} */
	}
	
	function register($data) { /* {{{ */
		if (is_object($data)) {
			$data = get_object_vars($data);
		}
		if ($this->create($data)) {
			lg('User registered');
			return true;
		} else {
			lg('Userdata is not valid', 'error');
			return false;
		}
		/* }}} */
	}
	
	function on_before_create() {/* {{{ */
		lg('on before create');
		if (!$this->email) {
			lg('email not provided');
			return false;
		}
		if (db_fetch_one('SELECT * FROM user WHERE email = "' . db_escape($this->email) . '" LIMIT 1')) {
			lg('email is not unique', 'error');
			return false;
		}
		if (empty($this->name)) {
			$this->name = preg_replace('/\\@.*/', '', $this->email);
		}
		return true;
		/* }}} */
	}
	
	function on_before_save() {/* {{{ */
		lg('on before save');
		if ($this->has('password')) {
			$this->password = $this->encode_password($this->password);
		}
		return true;
		/* }}} */
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
			$conditions = array(
				'email' => $data['email'],
				'password' => $this->encode_password($data['password'])
			);
			if ($this->load_where($conditions)) {
				$_SESSION['user_id'] = $this->id;
				$this->update_attributes(array('logged_in' => 1, 'last_logon' => db_date()));
				return true;
			}
			lg('User not found', 'error');
			return false;
		}
		lg('Post data incomplete (email and password required)');
		return false;
		/* }}} */
	}
	
	function logout() {/* {{{ */
		$this->update_attribute('logged_in', 0);
		/* }}} */
	}
	
	function encode_password($password) {/* {{{ */
		return md5($password . config_or_default('salt', 'default~s!a@l#t$'));
		/* }}} */
	}
	
	/* }}} */
}

/* :folding=explicit: */
?>
