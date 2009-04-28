<?php


class user {
	
	var $state;
	var $secret_code;
	var $name;
	var $avatar;
	var $last_logon;
	var $last_comment;
	var $logged;
	
	function user() {
		
	}
	
}

function register_guest($post_field_name='username'){/* {{{ */
	global $db;
	$name = htmlspecialchars(			// убираем тэги
			preg_replace('/\s+/',' ',	// группы пробелов
			trim(						// концевые пробелы
			cm_post($post_field_name,'str','Уважаемый, %username%, Вы не представились!'))));
	if($name!='anonimous'){
		/* $q = $db->q2assoc("SELECT count(*) as cnt FROM user WHERE name = '$name' AND state<4;",true);
		if($q['cnt']>0)error('Это имя уже занято, выберите другое.'); */
		check_username($name);
	}
	$_SESSION['user'] = array(
		'name'=>$name,
		'state'=>0, // guest
		'logged'=>true
	);
	$passport = md5(time() + 'salt' + $name);
	setcookie('passport',$passport,time()+86400*366,'/');
	$ua = mb_strtolower($_SERVER['HTTP_USER_AGENT']);
	$avatar = 'msie.jpg';
	if(mb_strpos($ua,'opera')!==false){
		$avatar = 'op.png';
	}elseif(mb_strpos($ua,'chrome')!==false){
		$avatar = 'chrome.png';
	}elseif(mb_strpos($ua,'firefox')!==false){
		$avatar = 'firefox.png';
	}elseif(mb_strpos($ua,'safari')!==false){
		$avatar = 'safari.jpg';
	}
	$_SESSION['user']['avatar'] = $avatar;
	$db->query("
		INSERT INTO user (state, secret_code, name, avatar, last_logon)
		VALUES (0, '$passport', '$name', '$avatar', now());
	");
	$_SESSION['user']['id'] = mysql_insert_id();
	setcookie('user',$_SESSION['user']['id'],time()+86400*365,'/');
	return $_SESSION['user']['id'];
	/* }}} */
}

function check_username($name){/* {{{ */
	$q = $GLOBALS['db']->q2assoc("SELECT count(*) as cnt FROM user WHERE name = '$name' AND state<4;",true);
	if($q['cnt']>0)error('Это имя уже занято, выберите другое.');
	/* }}} */
}

function load_userdata($id){/* {{{ */
	$q = $GLOBALS['db']->q2assoc("SELECT * FROM user WHERE id = '$id' AND state<5 LIMIT 1;",true);
	$q['logged'] = true;
	unset($q['password']);
	$_SESSION['user'] = $q;
	/* }}} */
}

switch(cm_fetch_var('q')){
	case 'RegisterGuest': /* {{{ */
		$id = register_guest('Login');
		if($id){
			echo '{errcode:0}';
		};
		/* }}} */
	break;
	case 'RegisterUser':/* {{{ */
		if(empty($_SESSION['user']) || $_SESSION['user']['id'])
			register_guest('name');
		
		$db->query("UPDATE user SET state = 3,email='".cm_post('email','str')."', password='".md5(cm_post('pass','str').' '.$_SESSION['user']['id'])."' WHERE id = ".$_SESSION['user']['id']);
		$_SESSION['user']['state'] = 3;
		echo '{errcode:0}';
		/* }}} */
	break;
	case 'Logon':	/* {{{ */
		$name = cm_post('Login','str');
		$pass = cm_post('Password','str');
		$q = $db->q2assoc("SELECT * FROM user WHERE name = '$name' AND state<5 LIMIT 1;",true);
		// we find user?
		if(!$q)error('Пользователь не найден');
		// check user state
		if($q['state']<>3){
			switch($q['state']){
				case 0:
				case 1:
					error('Гости не могут использовать форму входа');
				case 2:
					error('Для завершения процедуры регистрации необходимо получить письмо со ссылкой на активацию аккаунта. Только после этого можно использовать форму входа');
				case 4:
					error('Этот пользователь забанен');
				case 5:
					error('Этот пользователь удален');
				default:
					error('Статус пользователя не допускает логон');
			}
		}
		// check password
		if(md5($pass.' '.$q['id'])==$q['password']){
			unset($q['password']);
			$q['logged'] = true;
			$_SESSION['user'] = $q;
			echo '{errcode:0}';
		}else{
			error('Пароль не подошел '.md5($pass.' '.$q['id']).' '.$q['password']);
		}
		/* }}} */
	break;
	case 'Logout':/* {{{ */
		$_SESSION['user']['logged']=false;
		echo '{errcode:0}';
		/* }}} */
	break;
	case 'SaveProfile':/* {{{ */
		$name = cm_post('name','str');
		$email = cm_post('email','str');
		if(empty($_SESSION['user']) || empty($_SESSION['user']['id'])){
			error('Сессия отвалилась, вроде');
			break;
		}
		
		if($_SESSION['user']['name']!=$name)
			check_username($name);
		
		$db->query("UPDATE user SET name = '$name', email = '$email' WHERE id = ".$_SESSION['user']['id']);
		load_userdata($_SESSION['user']['id']);
		echo '{errcode:0}';
		/* }}} */
	break;
	case 'ChangePassword':/* {{{ */
		$x = $db->q2assoc('SELECT password FROM user WHERE id = '.$_SESSION['user']['id'],true);
		if($x['password']!=md5(cm_post('cur_pass','str').' '.$_SESSION['user']['id']))error('Текущий пароль введен неверно');
		$db->query("UPDATE user SET password='".md5(cm_post('pass','str').' '.$_SESSION['user']['id'])."' WHERE id = ".$_SESSION['user']['id']);
		echo '{errcode:0}';
		/* }}} */
	break;
}
?>
