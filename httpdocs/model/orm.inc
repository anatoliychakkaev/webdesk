<?php

class db_entity { /* {{{ */
	
	var $table = '';
	var $primary_key = 'id';
	var $table_info = false;
	var $has_many = array(); // field name => entity name
	
	var $attributes = array();
	
	function db_entity($initializer = null) { /* {{{ */
		$class_name = get_class($this);
		if ($class_name === 'db_entity') {
			debug_print_backtrace();
			trigger_error('Class db_entity is abstract, cannot be instantiated');
		}
		
		if (!$this->table) {
			$this->table = $class_name;
		}
		
		if (is_null($initializer)) {
			return;
		}
		
		if (is_scalar($initializer)) {
			if (is_numeric($initializer)) {
				$this->load($initializer);
			}
			
			if (is_string($initializer)) {
				trigger_error('Not implemented yet');
			}
			
			trigger_error('Unsupported type');
		} else {
			// this is an object or array -- just set all attributes
			$this->_attr($initializer);
		}
		/* }}} */
	}
	
	function __call($name, $arguments) { /* {{{ */
		// protect private properties
		if ($name{0} === '_') {
			//trigger_error('Method or property ' . $name . ' is private');
		}
		// getters and setters for properties
		if ($this->has($name)) {
			if (count($arguments) === 0) {
				return $this->_attr($name);
			}
			return $this->_attr($name, $arguments[0]);
		}
		// has many
		/*
		$intities = pluralize($this->table);
		if (isset($this->has_many[$intities])) {
			die('as');
		}
		*/
		return true;
		/* }}} */
	}
	
	function __get($name) {
		return $this->_attr($name);
	}
	
	function __set($name, $value) {
		return $this->_attr($name, $value);
	}
	
	function load_where($where) { /* {{{ */
		if (!$GLOBALS['db']->object_exists($this->table)) {
			trigger_error('Table ' . $this->table . ' not exists');
		}
		if (is_array($where)) {
			$query = array();
			foreach($where as $field => $value) {
				$query[] = '`' . $field . '` = "' . db_escape($value) . '"';
			}
			$where = join(' AND ', $query);
		}
		$data = db_fetch_one('
			SELECT *
			FROM `' . $this->table . '`
			WHERE ' . $where . '
			LIMIT 1
		', true);
		$this->attributes = $data;
		return $this->_loaded = $data ? true : false;
		/* }}} */
	}
	
	function load($id) { /* {{{ */
		if (!$GLOBALS['db']->object_exists($this->table)) {
			trigger_error('Table ' . $this->table . ' not exists');
		}
		$data = db_fetch_one('
			SELECT *
			FROM `' . $this->table . '`
			WHERE `' . $this->primary_key . '` = ' . (int)$id . '
			LIMIT 1
		', true);
		$this->attributes = $data;
		$this->_loaded = true;
		/* }}} */
	}
	
	function is_loaded() { /* {{{ */
		return !empty($this->_loaded);
		/* }}} */
	}
	
	function create($data = null) { /* {{{ */
		if (!is_null($data)) {
			$this->_attr($data);
		}
		if ($this->on_before_create() && $this->on_before_save()) {
			$id = db_insert($this->table, $this->attributes);
			if ($id) {
				$this->_attr($this->primary_key, $id);
				if ($this->on_after_create()) {
					return $id;
				}
				//db_delete($this->table, $id);
			}
		}
		return false;
		/* }}} */
	}
	
	function update($data = null) { /* {{{ */
		if (!$this->_is_updatable()) {
			return false;
		}
		if (!is_null($data)) {
			$this->_attr($data);
		}
		if ($this->on_before_save()) {
			if (db_update($this->table,	$this->_attr($this->primary_key), $this->attributes)) {
				$this->on_after_update();
				return true;
			}
		} else {
			return false;
		}
		/* }}} */
	}
	
	function save($data = null) { /* {{{ */
		if ($this->_is_updatable()) {
			$this->create($data);
		} else {
			$this->update($data);
		}
		/* }}} */
	}
	
	function delete() { /* {{{ */
		if ($this->has('deleted')) {
			db_update($this->table, $this->_attr($this->primary_key), array(
				'deleted' => 1,
				'deleted_at' => db_date()
			));
		} else {
			db_delete($this->table, $this->_attr($this->primary_key));
		}
		/* }}} */
	}
	
	/**
	 * update ONLY passed attributes
	 * on_after_update trigger not executed
	 */
	function update_attributes($attributes) { /* {{{ */
		if (!$this->_is_updatable()) {
			return false;
		}
		if (is_scalar($attributes)) {
			debug_print_backtrace();
			trigger_error('Object or assoc array is required');
		}
		$this->_attr($attributes);
		return db_update($this->table, $this->_attr($this->primary_key), $attributes);
		/* }}} */
	}
	
	function update_attribute($name, $value) { /* {{{ */
		return $this->update_attributes(array($name => $value));
		/* }}} */
	}
	
	function set_attributes($attrubutes) {
		$this->_attr($attrubutes);
	}
	
	/**
	 * alias for isset
	 */
	function has($attr, $check_dependent = false) { /* {{{ */
		$has_attribute = isset($this->attributes[$attr]);
		if (!$check_dependent) {
			return $has_attribute;
		}
		trigger_error('Not implemented yet');
		/* }}} */
	}
	
	/**
	 * alias for empty
	 */
	function has_value($attr) { /* {{{ */
		return !empty($this->attributes[$attr]);
		/* }}} */
	}
	
	/**
	 * _attr - magic function which allow:
	 *
	 * when no arguments passed: return all attributes
	 * when one object of array passed: setter for all passed attributes
	 * when one string passed: attribute getter
	 * when two arguments passed: attribute setter
	 *
	 * PLEASE NOTE: this function can not set primary key of object
	 */
	function _attr($data_or_name = false, $value = '') { /* {{{ */
		switch (func_num_args()) {
		case 0: // return all attributes as object
			
			$attr = new stdClass();
			foreach ($this->attributes as $k => $v) {
				$attr->$k = $v;
			}
			return $attr;
		case 1: // misc
			
			// return all attributes as array (true) or object (false)
			if (is_bool($data_or_name)) {
				if ($data_or_name) {
					return $this->attributes;
				} else {
					return $this->_attr();
				}
			}
			// return value of attribute by his name or null if not exists
			if (is_scalar($data_or_name)) {
				return isset($this->attributes[$data_or_name]) ?
					$this->attributes[$data_or_name] :
					null;
			}
			
			// set all attributes (except primary key)
			$pk = $this->primary_key;
			if (is_object($data_or_name)) {
				$data_or_name = get_object_vars($data_or_name);
			}
			if (is_array($data_or_name)) {
				if (isset($this->attributes[$pk])) {
					$data_or_name[$pk] = $this->attributes[$pk];
				}
				foreach ($data_or_name as $k => $v) {
					$this->attributes[$k] = $v;
				}
				return true;
			}
			break;
		case 2: // set one attribute
			
			$this->attributes[$data_or_name] = $value;
			return true;
			break;
		default:
			
			trigger_error('Unsupported count of arguments');
			break;
		}
		/* }}} */
	}
	
	function _is_updatable() {
		return $this->has_value($this->primary_key);
	}
	
	function as_object() {
		return $this->_attr(true);
	}
	
	function as_array() {
		return $this->_attr();
	}
	
	function desc() { /* {{{ */
		if ($this->table_info) {
			return $this->table_info;
		}
		$this->table_info = db_desc($this->table);
		$cols = $this->table_info->columns;
		foreach ($cols as $key => $value) {
			if (preg_match('/(varchar|[a-z]*int)\\((\\d+)\\)/i', $cols->{$key}['Type'], $typedef)) {
				$cols->{$key}['Size'] = $typedef[2];
				if ($typedef[1] == 'varchar' && $typedef[2] > 255) {
					$ef_type = 'text';
				} else {
					$ef_type = $typedef[1];
				}
			} else {
				$ef_type = $cols->{$key}['Type'];
			}
			$cols->{$key}['EffectiveType'] = $ef_type;
		}
		
		if ($this->has_value($this->primary_key)) {
			
			foreach ($cols as $key => $value) {
				$cols->{$key}['Value'] = $this->$key;
			}
		}
		
		$this->table_info->columns = $cols;
		return $this->table_info;
		/* }}} */
	}
	
	function on_before_save() {
		return true;
	}
	
	function on_after_create() {
		return true;
	}
	
	function on_after_update() {
		return true;
	}
	
	/* }}} */
}

class universal_entity extends db_entity { /* {{{ */
	
	function universal_entity($table) {
		$this->table = $table;
		parent::db_entity();
	}
	
	/* }}} */
}

/* :folding=explicit: */
?>
