<?php /* :folding=explicit:collapseFolds=1:*/

$PAGE_LIMIT = 10;
$RATE_LIMIT = 10;

// implicit login {{{
if(empty($_SESSION['user']) && isset($_COOKIE['passport']) && isset($_COOKIE['user'])){
	$_GET['asdasdasd'] = $_COOKIE['passport']; // лениво экранировать отдельно
	$pass = cm_get('asdasdasd','str'); 		// экранируем как гет
	$id = (int) $_COOKIE['user'];
	$user = $db->q2assoc("
		SELECT *
		FROM user
		WHERE id = $id AND secret_code = '$pass';",true);
	if($user && $user['allow_cookies']=='Y'){
		$user['logged'] = true;
		$_SESSION['user'] = $user;
	}else{
		$_SESSION['user'] = array('logged' => false);
	}
}
// }}}


function discussion($discussion_id){/* {{{ */
	global $coms,$db;
	$GLOBALS['AJAX_COMMENTS'] = true;
	unset($_GET['q']);
	
	require_once 'discussion.inc';
	
	discussion_comments($discussion_id,$coms,$top);
	
	/* $coms = $db->q2assoc("SELECT * FROM comment WHERE discussion_id = $discussion_id ORDER BY post_date;");
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
	} */
	
	// print comments
	if(count($top)){
		function get_comments_tree($top){
			global $coms;
			foreach($top as $id){
				$cid = $coms[$id]['id'];
				echo '<div style="margin:20px 0 10px 30px;" class="comment" comment_id="'.$cid.'">'.
					'<img src="/blog/_images/avatar_small/'.$coms[$id]['avatar'].'" style="vertical-align:middle;border:#ccc 1px solid;padding:1px;margin-right:5px;" />'.
					'<a name="comm_'.$cid.'"></a>'.
					'<strong><u>'.$coms[$id]['user_name'].'</u></strong> <span style="font-size:0.8em;color:#666;">'.$coms[$id]['post_date'].'</span><br/>'.
					$coms[$id]['content'].
					'<br/><br/><a href="?reply_to='.$cid.'#comm_'.$cid.'" onclick="answerTo('.$cid.',this);return false;">ответить</a>';
				if(isset($_GET['reply_to']) && $_GET['reply_to'] == $cid){
					echo comment_form($discussion_id,$cid);
					$form_generated = true;
				}
				if(count($coms[$id]['cc']))get_comments_tree($coms[$id]['cc']);
				echo '</div>';
			}
		}
		
		echo '<a name="comments"></a><div class="comments_title">Комментарии</div>';
		echo '<div id="comments">';
		get_comments_tree($top);
		echo '</div>';
	}else{
		echo '<a name="comments"></a><div class="comments_title" style="display:none;" id="cf">Комментарии</div>';
		echo '<div id="comments">';
		echo '</div>';
	}
	// print comment form
	echo '<div class="comments_form_title"><a name="comment_form" onclick="answerTo(0);return false;" href="?reply_to=0#comment_form">Написать комментарий</a></div>';
	echo '<div id="comment_form_home">';
	if($_GET['reply_to']==0)echo comment_form($discussion_id);
	echo '</div>';
	/* }}} */
}


function print_topics_list($where){/* {{{ */
	global $config, $PAGE_LIMIT;
	
	if(isset($_SESSION['user']) && $_SESSION['user']['id']){
		$maybe_lj = 'LEFT JOIN topic_vote tv ON tv.topic_id = t.id AND tv.user_id = '.$_SESSION['user']['id'];
		$maybe_lj2 = ',tv.id as voted';
	}else{
		$maybe_lj = '';
		$maybe_lj2 = '';
	}
	
	// count query
	$count = db_fetch_value("SELECT count(*) as c FROM topic t WHERE is_actual = 1 AND $where;", 'c');
	
	// data query
	$page = isset($_GET['page'])?$_GET['page']:0;
	$skip = $PAGE_LIMIT * $page;
	$tops =  db_fetch_all("
		SELECT t.*, c.name as category_name $maybe_lj2 
		FROM topic t INNER JOIN categories c ON c.id = t.category_id
		$maybe_lj
		WHERE is_actual = 1 AND $where
		ORDER BY t.id DESC LIMIT $skip, $PAGE_LIMIT;", true);
	
	$tt = array();
	foreach ($tops as $t) {
		$tt[] = $t['id'];
	}
	if (count($tt)) {
		$tags = db_fetch_all("
			SELECT tt.topic_id, t.name
			FROM topics_tags tt
				INNER JOIN tag t ON t.id = tt.tag_id
			WHERE tt.topic_id IN (" . join(',', $tt) . ")
			ORDER BY tt.id;
		", true);
	}else{
		$tags = array();
	}
	$res = array();
	foreach($tags as $tag){
		if(empty($res[$tag['topic_id']]))$res[$tag['topic_id']]=array();
		$res[$tag['topic_id']][]='<a href="/read/tag/'.$tag['name'].'/">'.$tag['name'].'</a>';
	}
	foreach($tops as $t){
		$arr = split('<topcut',$t['content']);
		$sc = $arr[0];
		if(count($arr)>1){
			preg_match('/^\s*text="(.*)"|\'(.*)\'/',$arr[1],$m);
			$lnk = '<div style="margin-top:10px;"><a href="/read/post/'.$t['id'].'/">'.($m[1]?$m[1]:'Далее').'  &rarr;</a></div>';
		}else{
			$lnk = '';
		}
		echo '<div class="entry">';
		echo '<div class="rating">'.((int)$t['rating']);
		if(!$t['voted'])echo '<a href="?addvote" onclick="addvote(this,'.$t['id'].'); return false;">+</a>';
		echo '</div>';
		echo '<div class="topic_title" style="margin-left:60px;">'.
		'<a href="/read/category/'.$t['category_id'].'/">'.$t['category_name'].'</a> &rarr; '.
		'<a href="/read/post/'.$t['id'].'/">'.$t['title'].'</a></div>';
		echo '<div class="topic_info">';
		echo '<div class="content">'.$sc.$lnk.'</div>';
		
		if(isset($res[$t['id']]))echo '<div class="tags">'.join(', ',$res[$t['id']]).'</div>';
		echo '<div class="topic_info">Опубликовано '.$t['pub_date'].'</div>';
		echo '</div></div>';
	}
	$i=0;
	if($count>$PAGE_LIMIT){
		//echo '<div style="clear:both;margin-bottom:20px;">';
		$pages_delta = 5;
		for($i=max(0,$page-$pages_delta);$i<=min(ceil($count/$PAGE_LIMIT),$page+$pages_delta);$i++){
			$class = $i==$page?'page_active':'page_go';
			echo '<div class="'.$class.'"><a href="?page='.$i.'">'.($i+1).'</a></div>';
		}
		/* while($i++<ceil($count/$PAGE_LIMIT)){
			$class = $i==$page+1?'page_active':'page_go';
			echo '<div class="'.$class.'"><a href="?page='.($i-1).'">'.$i.'</a></div>';
		} */
		//echo '</div>';
	}
	/* }}} */
}


$param = $path[2];

switch($screen){
	case 'new':			/* Новые {{{ */
		
		print_topics_list("rating<=$RATE_LIMIT");
		$title = 'Новые топики';
		/* }}} */
	break;
	default:
	case '':			/* Захабренные {{{ */
		
		print_topics_list("rating>$RATE_LIMIT");
		$title = 'Избранные топики';
		/* }}} */
	break;
	case 'category':	/* По категории {{{ */
		
		if(!$param)break; // todo: список категорий
		print_topics_list("t.category_id = $param");
		$title = 'Топики по категории';
		/* }}} */
	break;
	case 'tag':			/* По тэгу {{{ */
		
		$tag = mb_strtolower(urldecode($param),'utf-8');
		print_topics_list("EXISTS (
			SELECT * 
			FROM topics_tags tt INNER JOIN tag 
			WHERE tag.name = '$tag' AND tt.topic_id = t.id AND tt.tag_id = tag.id
		)");
		$title = "Топики c тэгом $tag";
		/* }}} */
	break;
	case 'post':		/* {{{ */
		
		settype($param, 'int');
		$topic = db_fetch_one("SELECT t.* FROM topic t WHERE id = $param;", true);
		$c = $topic['content'];//preg_replace(array('/\n(\n)+/','/\n/'),array('</p><p>','<br/>'),trim($topic['content']));
		
		echo '<div class="topic_title">' . $topic['title'] . '</div>';
		echo '<div class="topic_info">';
		echo '<div class="content">' . $c . '</div>';
		$tags = db_fetch_array("
			SELECT t.name FROM topics_tags tt
			INNER JOIN tag t ON t.id = tt.tag_id
			WHERE tt.topic_id = $param
			ORDER BY tt.id;
		", 'name');
		if(count($tags)){
			$x = array();
			foreach($tags as $row)$x[] = '<a href="/read/tag/' . $row . '">' . $row . '</a>';
			echo '<div class="tags">' . join(', ',$x) . '</div>';
		}
		echo '</div>';
		
		if($topic['discussion_id'])discussion($topic['discussion_id']);
		
		$title = $topic['title'];
		/* }}} */
	break;
	case 'profile':		/* {{{ */
		
		if(empty($_SESSION['user']) || empty($_SESSION['user']['id'])){
			echo 'Error ^^';
			break;
		}
		$usr = $db->q2assoc('SELECT * FROM user WHERE id = '.$_SESSION['user']['id'],true);
		print_static('profile_edit_form.html');
		$title = 'Редактирование профиля пользователя '.$_SESSION['user']['name'];
		/* }}} */
	break;
	case 'register':	/* {{{ */
		
		print_static('reg_form.html');
		$title = 'Регистрация';
		/* }}} */
	break;
	default:echo$param;
}


?>
