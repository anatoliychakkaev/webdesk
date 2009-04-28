<?php

class discussion {
	
	function discussion() {
		
	}
	
	function post_comment($user, $data) {/* {{{ */
		
		$discussion_id	= @$data['discussion_id']	or error('Missing discussion context');
		$content      	= @$data['content']     	or error('Missing text of commentary');
		$parent_id    	= @$data['parent_id'];
		$state        	= 1;
		
		// get this code out of here (to global code)
		if(empty($_SESSION['user'])){ // guest user registration {{{
			// check name
			require_once('user.php');
			register_guest();
			/* }}} */
		}
		
		switch($_SESSION['user']['state']){
			case 0: // guest
			case 2: // unapproved user
				$content = htmlspecialchars($content);
				if ($_SESSION['user']['last_comm_time'] &&
				time() - $_SESSION['user']['last_comm_time'] < 300){
					error('Гости могут комментировать не чаще одного раза в пять минут!');
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
		
		$user_id = $_SESSION['user']['id'];
		
		$data = new stdClass();
		$data->discussion_id	= $discussion_id;
		$data->post_date    	= time();
		$data->content      	= $content;
		$data->parent_id    	= $parent_id;
		$data->state        	= $state;
		$data->user_id      	= $user_id;
		
		$comment_id = db_insert('comment', $data);
		
		$comment_id = mysql_insert_id();
		// email notification
		
		return $comment_id;
		/* }}} */
	}
	
	function discussion_comments($dis_id,&$coms,&$top){/* {{{ */
		global $db;
		$coms = $db->q2assoc("
			SELECT c.*,u.name as user_name,u.avatar
			FROM comment c INNER JOIN user u ON c.user_id = u.id
			WHERE c.discussion_id = $dis_id
			ORDER BY c.post_date;
		");
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
}

?>
