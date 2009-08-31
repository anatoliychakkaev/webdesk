<?php /* :folding=explicit:tabSize=4:indentSize=4: */

function config($name, $value = null) {
	global $config;
	
	if ($value) {
		return $config->$name = $value;
	} else {
		if (empty($config->$name)) {
			lg('Parameter ' . $name . ' not defined in config', 'warning');
		}
		return isset($config->$name) ? $config->$name : '';
	}
}

function lg($message, $type = 'message'){
	$message = str_replace('\'', '\\\'', $message);
	switch ($type) {
	case 'message':
		exec("echo '$message' >> /tmp/weblog");
		break;
	case 'error':
		exec("echo \"\033[1;31mERROR\033[00m: $message.\" >> /tmp/weblog");
		break;
	case 'warning':
		exec("echo \"\033[1;31mWARNING\033[00m: $message.\" >> /tmp/weblog");
		break;
	}
}

function rds2 ($str) {/* {{{ */
	return mb_convert_encoding($str,'utf-8','windows-1251');
	/* }}} */
}

function cm_get_module_path ($name) {/* {{{ */
	$path = '../modules/';
	for($d=opendir($path);$f=readdir($d);){
		if($f=='.'||$f=='..'||!is_dir($path . $f))continue;
		$f.='/';
		if(file_exists($path . $f . $name . ' . js')){
			$path.=$f;
			break;
		}
	}
	return $path;
	/* }}} */
}

function call_module ($parameters) {/* {{{ */
	$name = $parameters['name'];
	$path = cm_get_module_path($name);
	$js = $path . $name . '.js';
	$ht = $path . $name . '.html';
	/*
	if(file_exists($js))echo 'globals.modules["'.$name . '"] = ' . file_get_contents($js).';';
	if(file_exists($ht))echo 'globals.modules["'.$name . '"].html = "' . str_replace("\n",'',str_replace("\r",'',str_replace('"','\\"',file_get_contents($ht)))).'";';
	*/
	if (file_exists($ht)) {
		 
		// load as file
		$module = new SimpleXMLElement($ht, null, true);
		$header = $module->xpath('//table[@id="columns"]/thead/tr/th');
		$cols = array();
		foreach($header as $node) {$cols[] = (string)$node;}
		echo '<pre>';
		print_r($cols);exit;
	}
	/* }}} */
}



/*
	Function: cm_access
	Возвращает истину если юзер имеет разрешение $acid
	
	Parameters:
	$acid - Идентификатор привелегии
	
	Returns:
	bool
	
*/
function cm_access ($acid) {/* {{{ */
	if(!in_array($acid, $_SESSION['accessedActions'])){
		echo '{errcode:-3,caption:"Access error",message:"Your permissions do not allow this action"}';
		exit;
	}
	/* }}} */
}

/*
	Function: sp_call
	Запускает хранимую процедуру с задаными параметрами
	
	Parameters:
	$sp_name str - Идентификатор привелегии
	$params array - Ассоциативный массив параметров
	$errcode str - Название параметра с кодом ошибки
	
	Returns:
	false если произошла ошибка (пишет в поток вывода json-объект с ошибкой)
	если не произошло ошибки - array(
		'sp'=>Object sp,
		'datasets'=>array(
			array( // dataset1
				array('Field1'=>value,'Field2'=>value,...)
				array('Field1'=>value,'Field2'=>value,...)
				...
			)[,
			array( // dataset2
				array('Field1'=>value,'Field2'=>value,...)
				array('Field1'=>value,'Field2'=>value,...)
				...
			)[,...]
			]
		),
		'out'=>array(
			//$sp->getOutParams()
		)
	)
	
	See Also:
    <sp>
*/
function sp_call($sp_name, $params=array(), $errcode=0){//{{{
	$sp = new sp($sp_name);
	foreach($params as $key=>$val){
		$sp->param($key, $val);
	}
	if($errcode){
		$sp->param($errcode,0);
	}
	$qr = $sp->exe();
	$results = array();
	do{
		$result = array();
		while($row = mssql_fetch_assoc($qr)){
			$result[] = $row;
		}
		$results[] = $result;
	}while(mssql_next_result($qr));
	$c = count($results);
	if($c && is_array($results[$c-1]) && count($results[$c-1])==1)$sp->out_vars = $results[$c-1][0];
	if($errcode && $sp->out($errcode)>0){
		$sp->handle_errcode($errcode);
		mssql_free_result($qr);
		return false;
	}else{
		$x = array(
			'sp'=>$sp,
			'datasets'=>$results,
			'out'=>$sp->getOutParams()
		);
		mssql_free_result($qr);
		return $x;
	}
	//}}}
}

/* 
	Class: sp
		Класс для вызова хранимой процедуры
*/
class sp{/* {{{ */
	var $name = '';
	var $params = array();
	var $proc;
	var $result;
	var $autoconvert = false;
	var $use_bind = false;
	var $debug = false;
	var $bind_all_params = false;
	var $out_vars = 0;
	var $spid_refresh = false;
	var $preparing_sql = '';
	var $finalization_sql = '';
	var $sql_history_id = 0;

	function sp ($name) {/* {{{ */
		$this->name = $name;
		/* }}} */
	}

	function param ($name, $value, $type=SQLINT4, $out=false) {/* {{{ */
		$name = '@'.$name;
		$this->params[$name]['Value'] = $value;
		$this->params[$name]['Type'] = $type;
		$this->params[$name]['Out'] = $out;
		/* }}} */
	}

	function getSQL () {
		$s="\nselect";$d='';$i=1;$sql = 'exec '.$this->name;$first = true;$f = true;
		$qr = mssql_query("exec sp_sproc_columns @procedure_name = '".$this->name."'");
		while($rrr = mssql_fetch_assoc($qr)){//{{{
			$_ctype = 		$rrr['COLUMN_TYPE'];	// int тип параметра
			$_cname = 		$rrr['COLUMN_NAME'];	// str имя параметра
			$_datatype = 	$rrr['TYPE_NAME'];		// str тип параметра
			$_datalen =		$rrr['LENGTH'];			// int длина типа
			$_nullable = 	$rrr['NULLABLE'];		// int 0 | 1
			$_def = 		$rrr['COLUMN_DEF'];		// mix значение по умолчанию
			$_out =			$_ctype == 2;			// bool выходной ли параметр
			$_val = isset($this->params[$_cname]) ? $this->params[$_cname]['Value']:$_def;
			//$_val = str_replace("'","''", $_val);
			if($_ctype == 5) continue; // for @RETURN_VALUE (may be later)
			if(!$this->bind_all_params)
			if(empty($this->params[$_cname])) continue; // если не нужны все параметры
			$this->params[$_cname]['Out'] = $_out;
			if($_out){
				$d.="declare @P$i ";
				switch($_datatype){//{{{
					case 'int':
					case 'bit':
					case 'tinyint':
						settype($_val,'integer');
					case 'float':
						$d.="$_datatype\nset @P$i=".$_val."\n";
					break;
					case 'image':
					case 'varchar':
					case 'char':
						if($this->autoconvert)$_val = wds($_val);
						$d.= "$_datatype($_datalen)\nset @P$i='".$_val."'\n";
					break;
					case 'datetime':
						if($this->autoconvert)$_val = wds($_val);
						$d.= "$_datatype\nset @P$i='".$_val."'\n";
					break;
				}//}}}
				if(!$f)$s.=','; else $f=false;
				$s.=' @P'.$i . ' as ' . substr($_cname,1);
			}
			if(!$first)$sql.=','; else $first = false;
			$sql.="\n".' '.$_cname;
			if($_out){
				$sql.=" = @P$i output";
			}else{//{{{
				$sql.=' = ';
				switch($_datatype){
					case 'int':
					case 'bit':
					case 'tinyint':
						settype($_val,'integer');
					case 'float':
						if($_datatype=='float')settype($_val,'float');
						$sql.=$_val;
					break;
					case 'datetime':
					case 'image':
					case 'varchar':
					case 'char':
					case 'text':
						if($this->autoconvert)
							$sql.='\'' . wds($_val).'\'';
						else
							$sql.='\''.$_val . '\'';
					break;
				}
			}//}}}
			if($_out)$i++;
			// endwhile }}}
		}// endwhile
		if($i>1)$sql = $d . $sql . $s;
		$result = $this->preparing_sql . ' '.$sql . ' '.$this->finalization_sql;
		/* if(empty($_SESSION['sql_history']))$_SESSION['sql_history'] = array();
		$this->sql_history_id = count($_SESSION['sql_history']);
		$_SESSION['sql_history'][$this->sql_history_id] = $result; */
		return $result;
	}

	function exe () { /* {{{ */
		//* версия с использованием биндов
		if($this->use_bind){//{{{
			$this->proc = mssql_init($this->name, $GLOBALS['con']);
			$qr = mssql_query("sp_sproc_columns @procedure_name = '".$this->name);
			while($rrr = mssql_fetch_assoc($qr)){//{{{
				$_ctype = 		$rrr['COLUMN_TYPE'];	// int тип параметра
				$_cname = 		$rrr['COLUMN_NAME'];	// str имя параметра
				$_datatype = 	$rrr['TYPE_NAME'];		// str тип параметра
				$_datalen =		$rrr['LENGTH'];			// int длина типа
				$_nullable = 	$rrr['NULLABLE'];		// int 0 | 1
				$_def = 		$rrr['COLUMN_DEF'];		// mix значение по умолчанию
				$_out =			$_ctype == 2;			// bool выходной ли параметр
				$_val = isset($this->params[$_cname]) ? $this->params[$_cname]['Value']:$_def;
				$_val = str_replace('\'','\\\'', $_val);
				// calculate $_type SQL*
				switch($_datatype){//{{{
					case 'int':
						settype($_val,'integer');
						$_type = SQLINT4;
					break;
					case 'float':
						settype($_val,'float');
						$_type = SQLFLT8;
					break;
					case 'image':
					case 'datetime':
					case 'varchar':
					default:
						$_type = SQLVARCHAR;
					break;
				}//}}}
				if(empty($this->params[$_cname])) continue;//$this->params[$_cname] = Array();
				$this->params[$_cname]['Value'] = $_val;
				if($_ctype == 5) continue; // for @RETURN_VALUE (may be later)
				mssql_bind(
					$this->proc,
					$_cname,
					$this->params[$_cname]['Value'],
					$_type,
					$_out
				);
			}//}}}
			$this->result = mssql_execute($this->proc) or die(mssql_get_last_message());
			return $this->result; //*/
			//}}}
		}else{//{{{
			//*/ версия с mssql_query
			$sql = $this->getSQL();
			/* $sql = 'CREATE PROCEDURE #pr1 AS '.$sql;
			mssql_query($sql);
			$sql = 'EXEC #pr1 DROP PROCEDURE #pr1';
			$this->spid_refresh = false; */
			if($this->spid_refresh)
				$sql = 'UPDATE tEMS_Sessions SET spid = @@spid, EndDate = null WHERE ID = '.$GLOBALS['GLOB_SessionId'].' '.$sql;
			if($this->debug) echo cm_smart_escape($sql);
			$this->result = mssql_query($sql);
			if(!$this->result) die('{errcode:101,message:"Can\'t execute query",lm:"' . str_replace('\'','\'\'',mssql_get_last_message()).'"}');
			return $this->result;//*/
			//}}}
		}
		/* }}} */
	}
	
	function sul ($key='id', $value='name') {
		$qr = $this->exe();
		$rows = array();
		while($res = mssql_fetch_assoc($qr)){
			$rows[] = php2js(array('id'=>$res[$key],'name'=>$res[$value]));
		}
		echo implode(',', $rows);
	}
	
	function out ($name, $fetch_next = false) {/* {{{ */
		if($this->use_bind){//* версия с использованием биндов
			return $this->params[$name]['Value'];
		}else{
			// версия с mssql_query
			if($this->result){
				if($fetch_next || $this->out_vars == 0){
					$this->out_vars = mssql_fetch_assoc($this->result);
				}
				return $this->out_vars[$name];
			}else{
				return -22;
			}
		}
		/* }}} */
	}

	function nxt () { /* {{{ */
		return mssql_next_result($this->result);
		/* }}} */
	}

	function handle_errcode ($name, $no_return=true) {/* {{{ */
		header("content-type:text/html;charset:utf-8");
		$errcode = $this->out($name);
		settype($errcode,'int');
		$msg = '';
		$cap = '';
		if($errcode==0){
			$msg = 'Action successfull';
			$cap = 'Done';
		}else{
			$qr = mssql_query('SELECT     Caption, Message, ID
				FROM         DAOsys_ErrorMessage
				WHERE     (ID = '.$errcode . ')');
			if(mssql_num_rows($qr)){
				$res=mssql_fetch_assoc($qr);
				$msg = rds2($res['Message']);
				$cap = rds2($res['Caption']);
			}else{
				$msg = 'Unknown errcode: '.$errcode;
			}
		}
		$ret = array();
		$ret['errcode'] = $errcode;
		if($errcode){
			$ret['message'] = $msg;
			$ret['caption'] = $cap;
			$ret['sql'] = $this->sql_history_id;
			$ret['lm'] = mssql_get_last_message();
			$ret['php_errors'] = $GLOBALS['GLOB_Error'];
		}
		if($no_return)
			echo php2js($ret);
		else
			return $ret;
		/* }}} */
	}
	
	function getOutParams ($deletePrefix=false) {
		//while($this->nxt()){}
		$ret = array();
		foreach($this->params as $k=>$v){
			if(!$v['Out'])continue;
			$k = str_replace('@','', $k);
			$val = $this->out($k);
			$k2 = $deletePrefix?preg_replace('/[^_]*_/i','', $k):$k;
			$ret[$k2] = $val;
		}
		return $ret;
	}
	
	function free () {
		mssql_free_result($this->result);
	}
	/* }}} */
}

/**
	Class: db
		Враппер базы данных. Я не хотел писать этот враппер. Жизнь заставила.
		Ну раз уж он есть, то пусть будет как можно проще.
*/
class db{/* {{{ */
	var $db = null;
	var $qr = null;
	var $sql = '';
	var $time = 0;
	var $queries = 0;
	var $history = array();
	
	function db () {
		$this->db = mysql_connect(config('DB_SERVER'), config('DB_LOGIN'), config('DB_PASSWORD'));
		if(!is_resource($this->db))
			error('Can\'t connect on ' . config('DB_SERVER') . ' for login ' . config('DB_LOGIN'));
		mysql_select_db(config('DB_NAME'), $this->db) or
			error('Can\'t select db ' . config('DB_NAME'));
		$this->query("SET NAMES 'utf8'");
	}
	
	function query ($sql) {/* {{{ */
		$this->sql = $sql;
		$this->queries++;
		
		list($msec, $sec) = explode(" ",microtime());
		$beg = $msec+$sec;
		
		$this->qr = mysql_query($sql, $this->db) or	error('Error in query',22);
		
		list($msec, $sec) = explode(" ",microtime());
		$end = $msec+$sec;
		
		$this->time+= $end - $beg;
		
		$this->history[] = array(
			'time'=>$this->time,
			'sql'=>$this->sql
		);
		
		return $this->qr;
		/* }}} */
	}
	
	function free () {/* {{{ */
		mysql_free_result($this->qr);
		/* }}} */
	}
	
	function q2assoc ($sql, $normalize=false) {/* {{{ */
		$this->query($sql);
		$ds = array();
		if($normalize && mysql_num_rows($this->qr)==1){
			return mysql_fetch_assoc($this->qr);
		}
		while($res = mysql_fetch_assoc($this->qr)){
			$ds[] = $res;
		}
		$this->free();
		return $ds;
		/* }}} */
	}
	
	function q2js ($sql, $normalize=false) {/* {{{ */
		$ds = $this->q2assoc($sql);
		$cnt = count($ds);
		if($cnt<=1 && $normalize)return php2js($ds[0]);
		$arr = array();
		$cols = array();
		if($cnt){
			foreach($ds[0] as $column=>$value)$cols[]=$column;
		}
		foreach($ds as $row){
			$row = array_values($row);
			$arr[] = php2js($row);
		}
		return "{columns:".php2js($cols).",data:[".implode(",", $arr).']}';
		/* }}} */
	}
	/* }}} */
}

function error ($message='', $errcode=1) {
	global $db;
	$res = array(
		'errcode' => $errcode,
		'message' => $message,
		'lm' => mysql_error($db->db)."\n".$db->sql,
		
		'php_errors' => $GLOBALS['GLOB_Error']
	);
	if(empty($_GET['nojsonerrors']))
		die(php2js($res));
	else{
		echo '<pre>' . mysql_error($db->db).'</pre>';
		echo '<pre>'.$db->sql . '</pre>';
		exit;
	}
}
/**
	Function: cm_fetch_var
		вычисляет значение параметра из
		POST, если не задано, то из
		GET, если не задано, то из
		SESSION, если не задано, то из
		COOKIE, если не задано, то false
		
	Parameters:
		$name str - название переменной
*/
function cm_fetch_var ($name) {/* {{{ */
	if(isset($_POST[$name]))return $_POST[$name];
	if(isset($_GET[$name]))return $_GET[$name];
	if(isset($_SESSION[$name]))return $_SESSION[$name];
	if(isset($_COOKIE[$name]))return $_COOKIE[$name];
	return false;
	/* }}} */
}

/**
	Function: php2js
		Преобразует php-массив
		в JSON объект
*/
function php2js ($a=false) {/* {{{ */
	if(is_null($a)) return 'null';
	if($a === false) return 'false';
	if($a === true) return 'true';
	if(is_scalar($a)){
		if(is_float($a)){
			// Always use "." for floats.
			$a = str_replace(",", ".", strval($a));
			return $a;
		}elseif(is_numeric($a)){
			return $a;
		}elseif(is_string($a)){
			$jsonReplaces = array(
				array("\\", "/", "\n", "\t", "\r", "\b", "\f", '"'),
				array('\\\\', '\\/', '\\n', '\\t', '\\r', '\\b', '\\f', '\"')
			);
			if(strlen($a))
				return '"' . str_replace($jsonReplaces[0], $jsonReplaces[1], $a).'"';
			else
				return '""';
		}else{
			return $a;
		}
	}
	$isList = true;
	$i=0;
	foreach($a as $k=>$v){
		if($k!==$i++){
			$isList = false;
			break;
		}
	}
	/* for($i = 0, reset($a); $i < count($a); $i++, next($a)){
		if (key($a) !== $i){
			$isList = false;
			break;
		}
	} */
	$result = array();
	if($isList){
		foreach($a as $v) $result[] = php2js($v);
		return '[' . join(',', $result).']';
	}else{
		foreach($a as $k => $v) $result[] = php2js($k).':' . php2js($v);
		return '{' . join(',', $result).'}';
	}
	/* }}} */
}


function ct ($str) {/* {{{ */
	if(is_numeric($str))
		return 'item'.$str;
	else
		return $str;
	/* }}} */
}

function decode_unicode_url ($str) {/* {{{ */
	$res = '';
	$i = 0;
	$max = strlen($str)-6;
	while ($i<=$max){
		$character = $str[$i];
		if ($character == '%' && $str[$i + 1] == 'u'){
			$value = hexdec(substr($str, $i + 2, 4));
			$i += 6;
			if ($value < 0x0080) // 1 byte: 0xxxxxxx
				$character = chr($value);
			else if ($value < 0x0800) // 2 bytes: 110xxxxx 10xxxxxx
				$character =chr((($value & 0x07c0) >> 6) | 0xc0)
				.chr(($value & 0x3f) | 0x80);
			else // 3 bytes: 1110xxxx 10xxxxxx 10xxxxxx
				$character =chr((($value & 0xf000) >> 12) | 0xe0)
				.chr((($value & 0x0fc0) >> 6) | 0x80)
				.chr(($value & 0x3f) | 0x80);
		}else $i++;
		$res .= $character;
	}
	return urldecode($res.substr($str, $i));
	/* }}} */
}

function pr_die ($struct) {/* {{{ */
	echo '<pre>';
	print_r($struct);
	echo '</pre>';
	die();
	/* }}} */
}

/**
	Function: cm_get
		Получает GET-параметр, экранированый для использования в sql запросе,
		либо вызове х.п. через класс $sp
	
	Parameters:
		$key str - название параметра
		$type str opt def int - тип параметра
		
		если тип строковый - пробуем определить кодировку и если определяем utf-8
		тогда перекодируем utf в win1251
		
	See also:
		<cm_post>
		<cm_ses>
*/
function cm_get ($key, $type='int') {/* {{{ */
	$r = $_GET[$key];
	switch($type){
		case 'int':
		case 'integer':
			settype($r,'int');
			return $r;
		break;
		case 'float':
			settype($r,'double');
			return $r;
		break;
		case 'date':
		case 'str':
			settype($r,'string');
			//$enc = mb_detect_encoding(preg_replace('/^[^а-я]*/','', $r).' ','utf-8,windows-1251');
//			if(strtolower($enc)=='utf-8')
	//			$r = mb_convert_encoding($r,'windows-1251','utf-8');
			return str_replace("'","''", $r);
		break;
		case 'check':
			return ($r=='on')?1:0;
		break;
	}
	return $r;
	/* }}} */
}

/** 
	Function: cm_post
		Получает POST-параметр, экранированый для использования в sql запросе,
		либо вызове х.п. через класс $sp
	See also:
		<cm_get>
		<cm_ses>
*/
function cm_post ($key, $type='int', $error_message='') {/* {{{ */
	if(empty($_POST[$key]) && $error_message != '')error($error_message);
	$r = $_POST[$key];
	switch($type){
		case 'int':
		case 'integer':
			settype($r,'int');
			return $r;
		break;
		case 'float':
			settype($r,'double');
			return $r;
		break;
		case 'date':
		case 'str':
			settype($r,'string');
			/* $enc = mb_detect_encoding($r . ' ','windows-1251,utf-8');
			if(strtolower($enc)=='utf-8')
				$r = mb_convert_encoding($r,'windows-1251','utf-8'); */
			return str_replace(array("'","\\"),array("''","\\\\"), $r);
		break;
		case 'check':
			return ($r=='on')?1:0;
		break;
	}
	return $r;
	/* }}} */
}

/** 
	Function: cm_ses
		Получает SESSION[section]-параметр, экранированый для использования в sql запросе,
		либо вызове х.п. через класс $sp
	See also:
		<cm_get>
		<cm_post>
*/
function cm_ses ($section, $key, $type='int') {/* {{{ */
	$r = $_SESSION[$section][$key];
	switch($type){
		case 'int':
		case 'integer':
			settype($r,'int');
			return $r;
		break;
		case 'float':
			settype($r,'double');
			return $r;
		break;
		case 'date':
		case 'str':
			settype($r,'string');
			$r = cm_unescape($r);
			return str_replace("'","''", $r);
		break;
		case 'check':
			return ($r=='on')?1:0;
		break;
	}
	return $r;
	/* }}} */
}

function cm_query_n_pack ($sql, $debug=false) {/* {{{ */
	/* global $db;
	$res = $db->q2assoc($sql);
	$r = array();
	foreach($res as $k=>$v){
		
	} */
	//$debug=true;
	$qr = mysql_query($sql);
	if($debug)echo '<pre>';
	$rows = array();
	while($res = mysql_fetch_assoc($qr)){
		$items = array();
		foreach($res  as $key=>$val){
			if(!is_numeric($val))$val = '"'.($debug?$val:($val)).'"';
			$items[]= $key . ':'.$val;
		}
		$rows[] = '{' . implode(',', $items).'}';
		
		//$rows[] = $res;
	}
	mysql_free_result($qr);
	/* if(count($rows)==1)
		echo php2js($rows[0]);
	else
		echo php2js($rows); */
	echo (implode(',', $rows));
	/* }}} */
}

function cm_remove_comments ($input) {/* {{{ Удаление комментов из js. Автор - А.Терентьев */
  $s='';
  $b=$com=false;
  $arr=explode("\n", $input);
  $outarr=array();

  foreach($arr as $i=>$str){
	//$str = trim($str);
    if($str=='')continue;
    $j=0;
    if($com){
      while(($j<(strlen($str)-1))&&(($str[$j] != '*')||($str[$j+1]!='/')))$j++;
      if($j<(strlen($str)-1)){
        $com = false;
        $j = $j+2;
      }else{
        $j = strlen($str);
      }
    }
    while($j < strlen($str)){
      if(($str[$j] == '\'')||($str[$j] == '"')){
        $k = $j + 1;
          $s.=$str[$j];
        while(($k < strlen($str))&&($str[$k] != $str[$j])){
          if(($k + 1 < strlen($str))&&($str[$k] == '\\')){
            $s.=$str[$k];
            $k++;
          }
          $s.=$str[$k];
          $k++;
        }
        $j = $k;
      };
      if(($j>=(strlen($str)-1))||($str[$j]!='/')){
        $s.=$str[$j];
        $j++;
        continue;
      };
      switch($str[$j+1]){
        case '*':
          $com = true;
          if(($j + 2 < strlen($str))&&($str[$j + 2]!='@')){
            $j+=2;
            while(($j < strlen($str))&&(($str[$j]!='*')||($str[$j+1] != '/')))$j++;
            if($j < strlen($str)){
              $com = false;
              $j+= 2;
            }else{
              $j = strlen($str) + 1;
            }
          }else{
            if($j + 2 <= strlen($str)){
              $s .= '/*@';
              $j+=3;
              $com = false;
            }else $j =  2 + strlen($str);
          }
        break;

        case '/':
          $j = strlen($str) + 1;
        break;

        default:
          if($j < strlen($str)){
            $s .= $str[$j];
            $j++;
          }
          while(($j < strlen($str))&&($str[$j] != '/')){
            $s .= $str[$j];
           // echo $str[$j] . '  ';
            if(($j < (strlen($str) - 1))&&($str[$j] == '\/')){
              //echo '1';
              $s .= $str[$j + 1];
              $j++;
            }
            $j++;
          }
          if($j < strlen($str)){
            $s .= $str[$j];
            $j++;
          }
        break;
      }
    }
	$s = trim($s);
    if(($s!='')&&(!$b)){
       $outarr[] = $s;
       $s = '';
    }
  }
  return implode("\n", $outarr);
  /* }}} */
};

?>
