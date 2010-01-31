<?php
	
/* :folding=explicit:collapseFolds=1:*/
	
	function post_comment(){/* {{{ */
		$dis_id = cm_post('discussion_id','int','Не указан контекст обсуждения');
		$content = cm_post('content','str','Нет текста комментария');
		$par_id = cm_post('parent_id');
		if (empty($_SESSION['user'])) { // guest user registration {{{
			// check name
			require_once('user.php');
			register_guest();
			/* }}} */
		}
		$state = 1;
		if (isset($_SESSION['user'])) {
			switch ($_SESSION['user']['state']) {
				case 0: // guest
				case 2: // unapproved user
					$content = htmlspecialchars($content);
					if ($_SESSION['user']['last_comm_time'] &&
					time() - $_SESSION['user']['last_comm_time'] < 300){
						//error('Гости могут комментировать не чаще одного раза в пять минут!');
					}
				break;
				case 1: // approved guest
				case 3: // regular user
					$content = preg_replace(array(
							"/<code[^>]*?>(.*)?<\/code[^>]*>/esi",
							'/<(\/)?(script|style)[^>]*>/si',
							'/href\s*=\s*([\'"])\s*javascript([^>]*)?>.*?<\/a>/si'
						),
						array(
							"'<pre>'.htmlentities('\\1').'</pre>'",
							'<\\1pre>',
							'>хреф=\\1жабаскрипт\\2</a>'
						),
						$content);
					$state = 4;
				break;
				case 4: // banned user
					error('Вам нельзя комментировать');
				break;
				default:
					$state = 1;
				break;
			}
			$name = $_SESSION['user']['name'];
		}else{
			error('Ошибка');
		}
		if($_SESSION['user']['state']==0){ // guest commenting
			// check timer (one comment in 5 min)
			if($_SESSION['user'] && 
				$_SESSION['user']['last_comm_time'] &&
				time() - $_SESSION['user']['last_comm_time'] < 300){
				//error('Гости могут комментировать не чаще одного раза в пять минут!');
			}
		}
		// store posting time
		$_SESSION['user']['last_comm_time'] = time();
		db_execute("
			INSERT INTO comment (discussion_id, post_date, content, parent_id, state, user_id)
			VALUES ($dis_id, now(), '$content', $par_id, $state, {$_SESSION['user']['id']})
		");
		$comment_id = mysql_insert_id();
		// email notification
		
		return $comment_id;
		/* }}} */
	}
	
	function discussion_comments($dis_id, &$coms, &$top){/* {{{ */
		global $db;
		$coms = db_fetch_all("
			SELECT	c.*, u.name as user_name, u.avatar
			FROM	comment c INNER JOIN user u ON c.user_id = u.id
			WHERE	c.discussion_id = $dis_id
			ORDER BY c.post_date;
		", true);
		// 1 run: build index
		$index = array();
		foreach($coms as $id=>$com){
			$coms[$id]['cc'] = array();
			$index[$com['id']] = $id;
		}
		// 2 run: build tree
		$top = array();
		foreach($coms as $id=>$com){
			if($com['parent_id']==0)$top[]=$id;
			else $coms[$index[$com['parent_id']]]['cc'][] = $id;
		}
		/* }}} */
	}
	
?>
