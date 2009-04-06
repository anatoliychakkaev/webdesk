<?php
	
	/* echo mail('rpm1602@gmail.com', 'Test', 'Test message', 'from: rpm1602@gmail.com' );
	exit; */
	$tpl->add('config', $config);
	//$res = mysql_query('select * from information_schema.TABLES');
	//echo '<pre>';
	//print_r(db_fetch_array('SELECT * FROM information_schema.TABLES x WHERE x.TABLE_SCHEMA="webdesk"', 'TABLE_NAME'));
	//print_r(db_fetch_array('SELECT * FROM webdesk.categories WHERE 1', 'name', 'id'));
	switch (count($path)) {
	case 1:
		$screen		= 'server';
		break;
	case 2:
		$screen		= 'database';
		$db_name	= $path[1];
		break;
	case 3:
		$screen		= 'table';
		$db_name	= $path[1];
		$table_name	= $path[2];
		break;
	default:
		$db_name	= $path[1];
		$table_name	= $path[2];
		$screen		= $path[3];
		break;
	}
	
	switch ($screen) {
	case 'server':
		
		$tpl->add('databases', db_fetch_array('SHOW DATABASES'));
		$tpl->view('db.server');
		break;
	case 'database':
		
		$tpl->add('database', $db_name);
		$tpl->add('tables', db_fetch_array('SHOW TABLES FROM `' . db_escape($db_name) . '`;'));
		$tpl->view('db.database');
		break;
	case 'table':
		
		$tpl->add('database', $db_name);
		$tpl->add('table', $table_name);
		$full_table_name = '`' . db_escape($db_name) . '`.`' . db_escape($table_name) . '`';
		$tpl->add('columns', db_fetch_all('DESCRIBE ' . $full_table_name));
		
		$tpl->add('create', db_fetch_value('SHOW CREATE TABLE ' . $full_table_name, 'Create Table'));
		$tpl->view('db.table');
		break;
	case 'data':
		
		$tpl->add('database', $db_name);
		$tpl->add('table', $table_name);
		$full_table_name = '`' . db_escape($db_name) . '`.`' . db_escape($table_name) . '`';
		$page = (int) @$_GET['page'] or $page = 0;
		$iop = 10;
		
		$data = new stdClass();
		$data->total_row_count = db_fetch_value('SELECT count(*) FROM ' . $full_table_name);
		$data->rows = db_fetch_all('SELECT * FROM ' . $full_table_name . ' LIMIT ' . $iop*$page . ', ' . $iop);
		$data->current_page = $page;
		$data->pages_count = ceil($data->total_row_count / $iop);
		$data->columns = db_fetch_array('DESCRIBE ' . $full_table_name, 'Field');
		
		$tpl->add('data', $data, 'grid_rows');
		$tpl->view('db.table_data');
		break;
	}
	$tpl->display();
?>
