<?php

class db_entity {
	
	var $table = '';
	var $primary_key = 'id';
	
	var $attributes = array();
	
	function db_entity($initializer = null) {
		$class_name = get_class();
		if ($class_name === 'db_entity') {
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
			$this->_attr($initializer);
		}
		
	}
	
	function __call($name, $arguments) {
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
	}
	
	function load($id){
		$data = db_fetch_one('
			SELECT *
			FROM `' . $this->table . '`
			WHERE `' . $this->primary_key . '` = ' . (int)$id . '
			LIMIT 1
		', true);
		$this->_attr($data);
	}
	
	function create($data) {
		$this->_attr($data);
		if ($this->on_before_save()) {
			$id = db_insert($this->table, $this->attributes);
			if ($id) {
				$this->_attr($this->primary_key, $id);
				if ($this->on_after_create()) {
					return $id;
				}
				db_delete($this->table, $id);
			}
		}
		return false;
	}
	
	function update($data) {
		$this->_attr($data);
		if ($this->on_before_save()) {
			if (db_update($this->table,	$this->_attr($this->primary_key), $this->attributes)) {
				$this->on_after_update();
				return true;
			}
		} else {
			return false;
		}
	}
	
	function delete() {
		if ($this->has('deleted')) {
			db_update($this->table, $this->_attr($this->primary_key), array(
				'deleted' => 1,
				'deleted_at' => db_date()
			));
		} else {
			db_delete($this->table, $this->_attr($this->primary_key));
		}
	}
	
	function has($attr, $check_dependent = false) {
		$has_attribute = isset($this->attributes[$attr]);
		if (!$check_dependent) {
			return $has_attribute;
		}
		trigger_error('Not implemented yet');
	}
	
	function _attr($data_or_name = false, $value = '') {
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
			
			// set all atributes (except primary key)
			$pk = $this->primary_key;
			if (is_object($data_or_name)) {
				if (isset($this->attributes[$pk])) {
					$data_or_name->$pk = $this->attributes[$pk];
				}
				$this->attributes = get_object_vars($data_or_name);
				return true;
			}
			if (is_array($data_or_name)) {
				if (isset($this->attributes[$pk])) {
					$data_or_name[$pk] = $this->attributes[$pk];
				}
				$this->attributes = $data_or_name;
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
	}
	
}

class universal_entity extends db_entity {
	
	function universal_entity($table) {
		$this->table = $table;
		parent::__constructor();
	}
	
}

?>
