<?php

class database {
	
	var $_connection;
	
	function connect($server, $database_name, $user, $password) {
		$this->_connection = mysql_connect($server, $user, $password)
			or trigger_error('Cannot connect');
		mysql_select_db($database_name, $this->_connection)
			or trigger_error('Cannot select database');
		
		return $this->_connection;
	}
	
	function query($sql) {
		lg('\033[1;32mquery: \033[00m' . trim(preg_replace('/\\s+/', ' ', $sql)));
		$q = mysql_query($sql, $this->_connection);
		if(!$q) $this->error($sql);
		return $q;
	}
	
	function execute($sql) {
		lg('\033[1;34mexecute: \033[00m' . trim(preg_replace('/\\s+/', ' ', $sql)));
		$q = mysql_query($sql, $this->_connection);
		if (!$q) {
			$this->error($sql);
		}
		if (is_resource($q)) {
			mysql_free_result($q);
		}
		return true;
	}
	
	function error($sql) {
		global $format;
		
		$message = '';
		
		switch (@$format) {
		case 'html':
		case '':
		default:
			$message  = "<strong>MySQL error #" . mysql_errno() . ":</strong>\n";
			$message .= mysql_error() . "\n\n<strong>On query:</strong>\n" . $sql;
			break;
		case 'json':
			$message = '{"type":"db","code":' . (int)mysql_errno() . ',"message":"' .
			str_replace('"', '\\"', mysql_error()) .
			'","sql":"' .
			str_replace('"', '\\"', $sql) .
			'"}';
		}
		exec("date >> /tmp/weblog");
		exec($message);
		die($message);
	}
	
	function fetch_all($sql, $assoc = false) {
		$fetcher = $assoc?'mysql_fetch_assoc':'mysql_fetch_object';
		
		$q = $this->query($sql);
		
		$t = array();
		while ($r = $fetcher($q)) {
			$t[] = $r;
		}
		
		if(is_resource($q)) mysql_free_result($q);
		
		return $t;
	}
	
	function select($table, $key, $primary_key_name = 'id') {
		return $this->fetch_one('
			SELECT *
			FROM `' . $this->escape($table) . '`
			WHERE `' . $this->escape($primary_key_name) . '` = ' . (int)$key . '
			LIMIT 1
		');
	}
	
	function fetch_one($sql, $assoc = false) {
		$r = $this->fetch_all($sql, $assoc);
		return isset($r[0]) ? $r[0] : false;
	}
	
	function fetch_value($sql, $field_name = false) {
		$r = $this->fetch_one($sql, $field_name?false:true);
		if (!$r) {
			return null;
		}
		if ($field_name) {
			return @$r->$field_name;
		} else {
			$a = array_values($r);
			return $a[0];
		}
	}
	
	function fetch_array($sql, $value = false, $key = false) {
		$r = $this->fetch_all($sql, $value?false:true);
		$s = array();
		foreach ($r as $row) {
			
			if (!$value) {
				
				$row = array_values($row);
				if (count($row)>1) {
					$s[$row[0]] = $row[1];
				} else {
					$s[] = $row[0];
				}
			} else {
			
				if ($key) {
					$s[$row->$key] = $row->$value;
				} else {
					$s[] = $row->$value;
				}
			}
		}
		
		return $s;
	}
	
	function escape($string) {
		return is_float($string) ? str_replace(',', '.', (string)$string) : mysql_real_escape_string($string);
	}
	
	function desc($table) {
		$qr = mysql_query('DESC ' . $this->escape($table), $this->_connection) or die('error!');
		$cols_full = new stdClass();
		$cols_names = array();
		$pri = false;
		while ($res = mysql_fetch_assoc($qr)) {
			$cols_full->{$res['Field']} = $res;
			$cols_names[] = $res['Field'];
			if ($res['Key'] === 'PRI') {
				$pri = $res['Field'];
			}
		}
		$table = new stdClass();
		$table->col_names = $cols_names;
		$table->pk = $pri;
		$table->columns = $cols_full;
		
		return $table;
	}
	
	function date($timestamp = null) {
		if (!$timestamp) {
			$timestamp = time();
		}
		return date('Y-m-d H:i:s', $timestamp);
	}
	
	function insert($table, $data) {
		$desc = $this->desc($table);
		if (!$desc->pk) trigger_error('Primary key required for $this->insert (table ' . $table . ')');
		if (is_object($data)) $data = get_object_vars($data);
		if (!is_array($data)) trigger_error('Array or object required as second parameter');
		$columns = array();
		$values = array();
		$data['created_at'] = $this->date();
		if (isset($data[$desc->pk])) {
			unset($data[$desc->pk]);
		}
		foreach ($data as $column => $value) {
			if (!in_array($column, $desc->col_names)) continue;
			$columns[] = $this->escape($column);
			$value = $this->escape($value);
			if (!is_numeric($value)) $value = '"' . $value . '"';
			$values[] = $value;
		}
		if (!count($columns)) trigger_error('No matched columns');
		$sql = 'INSERT INTO ' . $this->escape($table) . ' 
		(' . join(', ', $columns) . ') 
		VALUES (' . join(', ', $values) . ')';
		$x = $this->execute($sql);
		
		return $x?mysql_insert_id():false;
	}
	
	function update($table, $pk, $data) {
		$desc = $this->desc($table);
		if (!$desc->pk || !$pk) {
			trigger_error('Primary key required for $this->update (table ' . $table . ')');
		}
		if (is_object($data)) {
			$data = get_object_vars($data);
		}
		if (!is_array($data)) {
			trigger_error('Array or object required as second parameter');
		}
		$data['updated_at'] = $this->date();
		$update_columns = array();
		foreach ($data as $column => $value) {
			if (!in_array($column, $desc->col_names) || $column === $desc->pk) {
				continue;
			}
			$value = $this->escape($value);
			if (!is_numeric($value)) {
				$value = '"' . $value . '"';
			}
			$update_columns[] = '`' . $this->escape($column) . '` = ' . $value;
		}
		if (!count($update_columns)) {
			trigger_error('No matched columns');
		}
		
		$sql = 'UPDATE ' . $this->escape($table) . 
		' SET ' . join($update_columns, ',') . 
		' WHERE `' . $desc->pk  . '` = ' . (int)$pk;
		return $this->execute($sql);
	}
	
	function delete($table, $pk) {
		$desc = $this->desc($table);
		if (!$desc->pk || !$pk) {
			trigger_error('Primary key required for $this->delete (table ' . $table . ')');
		}
		return $this->execute('DELETE FROM ' . $this->escape($table) . ' WHERE ' . $desc->pk . ' = ' . (int)$pk);
	}
	
	function object_exists($table, $columns = null) {
		if ($this->fetch_one('SHOW TABLES LIKE "' . $table . '"')) {
			if (!$columns) {
				return true;
			} else {
				$desc = $this->desc($table);
				if (is_string($columns)) {
					return isset($desc->col_names[$columns]);
				} else {
					return count(array_intersect($desc->col_names, $columns)) == count(array_unique($columns));
				}
			}
		} else {
			return false;
		}
	}
	
	function get_entity($entity_name) {
		if (file_exists("model/$entity_name.inc")) {
			require_once "$entity_name.inc";
			return new $entity_name();
		} else {
			require_once 'model/orm.inc';
			return new universal_entity($entity_name);
		}
	}
}

$db = new database();
$db->connect($config->db_server, $config->db_name, $config->db_user, $config->db_password);

/* global aliases */

function db_desc($table) {
	return $GLOBALS['db']->desc($table);
}

function db_fetch_all($sql, $assoc = false) {
	return $GLOBALS['db']->fetch_all($sql, $assoc);
}

function db_fetch_one($sql, $assoc = false) {
	return $GLOBALS['db']->fetch_one($sql, $assoc);
}

function db_fetch_array($sql, $value = false, $key = false) {
	return $GLOBALS['db']->fetch_array($sql, $value, $key);
}

function db_fetch_value($sql, $field_name = false) {
	return $GLOBALS['db']->fetch_value($sql, $field_name);
}

function db_select($table, $key, $primary_key_name = 'id') {
	return $GLOBALS['db']->select($table, $key, $primary_key_name);
}

function db_insert($table, $data) {
	return $GLOBALS['db']->insert($table, $data);
}

function db_update($table, $pk, $data) {
	return $GLOBALS['db']->update($table, $pk, $data);
}

function db_delete($table, $pk) {
	return $GLOBALS['db']->delete($table, $pk);
}

function db_escape($string) {
	return $GLOBALS['db']->escape($string);
}

function db_date($timestamp = null) {
	return $GLOBALS['db']->date($timestamp);
}

function db_get_entity($entity_name) {
	return $GLOBALS['db']->get_entity($entity_name);
}

?>
