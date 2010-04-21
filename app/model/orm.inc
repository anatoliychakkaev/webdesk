<?php

class db_entity { /* {{{ */
	
	var $table = '';
	var $primary_key = 'id';
	var $table_info = false;
	var $has_many = array(); // field name => entity name
	var $_loaded = false;
	
	var $attributes = array();
	
	function db_entity($initializer = null) { /* {{{ */
		$class_name = get_class($this);
		if ($class_name === get_class()) {
			debug_print_backtrace();
			trigger_error('Class ' . get_class() . ' is abstract, cannot be instantiated');
		}
		
		if (!$this->table) {
			$this->table = $class_name;
		}
		
		if (!db_object_exists($this->table) && db_object_exists(config('db_prefix') . $this->table)) {
			$this->table = config('db_prefix') . $this->table;
		}
		lg($this->table);
		
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
		// build collection
		$matches = array();
		if (preg_match('/^find(_all|)(_by_(.*))?$/', $name, $matches)) { /* {{{ */
			if (($has_conditions = isset($matches[2]))) {
				$conditions = preg_split('/_and_/', $matches[3]);
			}
			// find by id
			if ($matches[0] === 'find' ||  $has_conditions &&
				count($conditions) === 1 && $conditions[0] === 'id'
			) {
				$class_name = get_class($this);
				return new $class_name($arguments[0]);
			}
			if ($has_conditions) {
				$query_conditions = array();
				$parameters = array();
				foreach ($conditions as $i => $condition) {
					$query_conditions[$condition] = $arguments[$i];
				}
				$parameters = @$arguments[$i + 1];
			} else {
				$query_conditions = @$arguments[0];
				$parameters = @$arguments[1];
			}
			// find collection by query
			if ($matches[1]) {
				return $this->records_where($query_conditions, $parameters);
			}
			// find one by query
			else {
				return $this->record_where($query_conditions, $parameters);
			}
			/* }}} */
		}
		// has many
		if (isset($this->has_many[$name])) {
			$table = $this->has_many[$name];
			if (is_string($table)) {
				$entity = db_get_entity($table);
				return $entity->records_where(
					array($this->table . '_id' => $this->id)
				);
			} elseif (is_array($table)) {
				$entity = db_get_entity($table['name']);
				if (isset($table['through'])) {
					$_thr = $table['through'];
					$_tab = $table['name'];
					return $entity->records_where(
						array($this->table . '_id' => $this->id),
						array(
							'join' => "INNER JOIN `$_thr` ON `$_tab`.`id` = `$_thr`.`{$_tab}_id`",
							'columns' => "`$_tab`.*",
							'order' => @$table['order']
						)
					);
				}
			}
		}
		return;
		/* }}} */
	}
	
	function records_by_query($sql) {
		$records = db_fetch_all($sql);
		$result = array();
		foreach ($records as $record) {
			$obj = db_get_entity($this->table);
			$obj->set_attributes($record);
			$result[] = $obj;
		}
		return $result;
	}
	
	function records_where($conditions = null, $parameters = null) { /* {{{ */
		$query_conditions = array(1);
		if (is_array($conditions)) {
			foreach ($conditions as $key => $value) {
				$query_conditions[] = '`' . db_escape($key) . '` = "' . db_escape($value) . '"';
			}
		}
		if (is_null($parameters)) {
			$parameters = array(
				'columns' => '*'
			);
		}
		if (empty($parameters['columns'])) {
			$parameters['columns'] = '*';
		}
		$sql = '
			SELECT ' . $parameters['columns'] . '
			FROM `' . $this->table . '` ' . @$parameters['join'] . '
			WHERE ' . join(' AND ', $query_conditions) . '
		';
		if (!empty($parameters['order'])) {
			$sql .= ' ORDER BY ' . $parameters['order'];
		}
		if (!empty($parameters['group'])) {
			$sql .= ' GROUP BY ' . $parameters['GROUP'];
		}
		if (!empty($parameters['limit'])) {
			if (!empty($parameters['offset'])) {
				$sql .= ' LIMIT ' . $parameters['offset'] . ', ' . $parameters['limit'];
			} else {
				$sql .= ' LIMIT ' . $parameters['limit'];
			}
		}
		return $this->records_by_query($sql);
		/* }}} */
	}
	
	function record_where($conditions = null, $parameters = null) {
		if (is_null($parameters)) {
			$parameters = array('limit' => '1');
		} else {
			$parameters['limit'] = 1;
		}
		return records_where($conditions, $parameters);
	}
	
	function __get($name) {
		if ($this->has($name)) {
			return $this->_attr($name);
		} else {
			return $this->$name();
		}
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
			trigger_error('Table ' . $this->table . ' not exists in ' . get_class($this));
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
	
	function set_attributes($attributes) {
		$this->_attr($attributes);
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
				//lg(get_class($this) . '::' . $data_or_name . ' = ' . $this->attributes[$data_or_name]);
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
		if (!$this->table_info) {
			return false;
		}
		$cols = $this->table_info->columns;
		foreach ($cols as $key => $value) {
			$typedef = array();
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
