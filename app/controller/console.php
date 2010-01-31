<?php

function userErrorHandler($errno, $errmsg, $filename, $linenum, $vars) { 
	$dt = date("Y-m-d H:i:s"); 
	$errortype = array (1=>"Error",2=>"Warning",4=>"Parsing Error",8=>"Notice",16=>"Core Error",32=>"Core Warning",64=>"Compile Error",128=>"Compile Warning",256 =>"User Error",512 =>"User Warning",1024=>"User Notice");
	$user_errors = array(E_USER_ERROR, E_USER_WARNING, E_USER_NOTICE);
	$err = array(
		"datetime"=>$dt,
		"errornum"=>$errno,
		"errortype"=>$errortype[$errno],
		"errormsg"=>$errmsg,
		"scriptname"=>$filename,
		"scriptlinenum"=>$linenum
	);
	if (in_array($errno, $user_errors))$err["vartrace"]=wddx_serialize_value($vars,"Variables");;
	echo '<pre>';
	foreach($err as $k=>$v){
		echo "$k: \t $v\n";
	}
	echo '</pre>';
	exit;
}

$old_error_handler = set_error_handler("userErrorHandler");

switch($screen){
	case '':
		$code = isset($_POST['code'])?$_POST['code']:'';
		echo '<form method="POST" action="/console"><textarea name="code" cols="80" rows="10">' .
			$code . '</textarea><br/><input type="submit" /></form>';
		if(!$code)break;
		
		ob_start();
		$res = eval($code);
		$output = ob_get_contents();
		ob_end_clean();
		if($res === true){
			echo $output;
		}else{
			echo 'error';
			//trigger_error('Eval parse error');
		}
	break;
}
?>
