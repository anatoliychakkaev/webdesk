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

function config_or_default($name, $default) {
	global $config;
	return isset($config->$name) ? $config->$name : $default;
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

function pluralize($str) {
	require_once 'pluralize.inc';
	$infl = new Inflect();
	return $infl->pluralize($str);
}

function singularize($str) {
	require_once 'pluralize.inc';
	$infl = new Inflect();
	return $infl->singuarize($str);
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
 *	Function: wd_fetch_var
 *		вычисляет значение параметра из
 *		POST, если не задано, то из
 *		GET, если не задано, то из
 *		SESSION, если не задано, то из
 *		COOKIE, если не задано, то false
 *		
 *	@param string $name - название переменной
**/
function wd_fetch_var($name, $default = false) {/* {{{ */
	if (isset($_POST[$name])) {
		return $_POST[$name];
	}
	if (isset($_GET[$name])) {
		return $_GET[$name];
	}
	if (isset($_SESSION[$name])) {
		return $_SESSION[$name];
	}
	if (isset($_COOKIE[$name])) {
		return $_COOKIE[$name];
	}
	return $default;
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
	$r = empty($_GET[$key]) ? '' : $_GET[$key];
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
