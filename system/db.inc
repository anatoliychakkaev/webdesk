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
	
	function db_fetch_one($sql, $assoc = false) {
		
		$r = db_fetch_all($sql, $assoc);
		
		return @$r[0];
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
			$cols->{$res['Field']} = $res;
			$cols_names[] = $res['Field'];
			if ($res['Key'] == 'PRI') {
				$pri = $res['Field'];
			}
		}
		$table = new stdClass();
		$table->columns = $cols_full;
		$table->col_names = $cols_names;
		$table->pk = $pri;
		return $table;
	}
	
	function db_insert($table, $data) {
		$desc = db_desc($table);
		if (!$desc->pk) trigger_error('Primary key required for db_insert (table ' . $table . ')');
		if (is_object($data)) $data = get_object_vars($data);
		if (!is_array($data)) trigger_error('Array or object required as second parameter');
		$columns = array();
		$values = array();
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
	
	mysql_connect($config->db_server, $config->db_user, $config->db_password) or die('Can not connect');
	
	if(isset($config->db_name) && $config->db_name) mysql_select_db($config->db_name)  or die('Can not select database');
	
?>
