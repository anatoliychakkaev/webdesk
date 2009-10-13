<?php
	
	function db_query($sql) {
		$q = mysql_query($sql);
		if(!$q) db_error($sql);
		return $q;
	}
	
	function db_execute($sql) {
		$q = mysql_query($sql);
		if (!$q) {
			db_error($sql);
		}
		if (is_resource($q)) {
			mysql_free_result($q);
		}
		return true;
	}
	
	function db_error($sql) {
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
	
	function db_fetch_all($sql, $assoc = false) {
		
		$fetcher = $assoc?'mysql_fetch_assoc':'mysql_fetch_object';
		
		$q = db_query($sql);
		
		$t = array();
		while ($r = $fetcher($q)) {
			$t[] = $r;
		}
		
		if(is_resource($q)) mysql_free_result($q);
		
		return $t;
	}
	
	function db_select($table, $key) { //todo: unhardcode id
		
		return db_fetch_one('SELECT * FROM ' . $table . ' WHERE id = ' . (int)$key);
	}
	
	function db_fetch_one($sql, $assoc = false) {
		
		$r = db_fetch_all($sql, $assoc);
		
		return isset($r[0]) ? $r[0] : false;
	}
	
	function db_fetch_value($sql, $field_name = false) {
		
		$r = db_fetch_one($sql, $field_name?false:true);
		if (is_null($r)) {
			return null;
		}
		if ($field_name) {
			return @$r->$field_name;
		} else {
			$a = array_values($r);
			return $a[0];
		}
	}
	
	function db_fetch_array($sql, $value = false, $key = false) {
		
		$r = db_fetch_all($sql, $value?false:true);
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
	
	function db_escape($string) {
		return mysql_real_escape_string($string);
	}
	
	function db_desc($table) {
		$qr = mysql_query('DESC ' . db_escape($table));
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
	
	function db_date($timestamp = null) {
		if (!$timestamp) {
			$timestamp = time();
		}
		return date('Y-m-d H:i:s', $timestamp);
	}
	
	function db_insert($table, $data) {
		$desc = db_desc($table);
		if (!$desc->pk) trigger_error('Primary key required for db_insert (table ' . $table . ')');
		if (is_object($data)) $data = get_object_vars($data);
		if (!is_array($data)) trigger_error('Array or object required as second parameter');
		$columns = array();
		$values = array();
		$data['date_created'] = db_date();
		foreach ($data as $column => $value) {
			if (!in_array($column, $desc->col_names)) continue;
			$columns[] = db_escape($column);
			$value = db_escape($value);
			if (!is_numeric($value)) $value = '"' . $value . '"';
			$values[] = $value;
		}
		if (!count($columns)) trigger_error('No matched columns');
		
		$sql = 'INSERT INTO ' . db_escape($table) . ' 
		(' . join(', ', $columns) . ') 
		VALUES (' . join(', ', $values) . ')';
		$x = mysql_query($sql);
		
		return $x?mysql_insert_id():false;
	}
	
	function db_update($table, $pk, $data) {
		$desc = db_desc($table);
		if (!$desc->pk || !$pk) trigger_error('Primary key required for db_update (table ' . $table . ')');
		if (is_object($data)) $data = get_object_vars($data);
		if (!is_array($data)) trigger_error('Array or object required as second parameter');
		$data['date_modified'] = db_date();
		$update_columns = array();
		foreach ($data as $column => $value) {
			if (!in_array($column, $desc->col_names) || $column === $desc->pk) continue;
			$value = db_escape($value);
			if (!is_numeric($value)) $value = '"' . $value . '"';
			$update_columns[] = '`' . db_escape($column) . '` = ' . $value;
		}
		if (!count($update_columns)) trigger_error('No matched columns');
		
		$sql = 'UPDATE ' . db_escape($table) . 
		' SET ' . join($update_columns, ',') . 
		' WHERE `' . $desc->pk  . '` = ' . (int)$pk;
		return mysql_query($sql);
	}
	
	function db_delete($table, $pk) {
		$desc = db_desc($table);
		if (!$desc->pk || !$pk) trigger_error('Primary key required for db_delete (table ' . $table . ')');
		return db_execute('DELETE FROM ' . db_escape($table) . ' WHERE ' . $desc->pk . ' = ' . (int)$pk);
	}
	
	function db_object_exists($table, $columns = null) {
		if (db_fetch_one('SHOW TABLES LIKE "' . $table . '"')) {
			if (!$columns) {
				return true;
			} else {
				$desc = db_desc($table);
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
	
	mysql_connect($config->db_server, $config->db_user, $config->db_password) or die('Can not connect');
	
	if(isset($config->db_name) && $config->db_name) mysql_select_db($config->db_name)  or die('Can not select database');
	
?>
