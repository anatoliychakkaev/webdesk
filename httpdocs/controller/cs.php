<?php

// :folding=explicit:tabSize=4:

class cs_ctl extends std_ctl { /* {{{ */
	
	var $cheatsheet;
	
	function init() {
		
		if (!$this->screen) {
			$this->screen = 'cheatsheets';
		}
		
		switch (count($this->path)) {
		case 2:
			$this->screen = 'view_cheatsheet';
			$this->tpl->add('cheatsheet', db_fetch_one('
				SELECT * FROM cs_cheatsheet cs INNER JOIN cs_cheat c ON cs.id = c.cheatsheet_id  WHERE name = "' . db_escape($this->path[1]) . '"
				'));
			die('SELECT * FROM cs_cheatsheet cs INNER JOIN cs_cheat c ON cs.id = c.cheatsheet_id  WHERE name = "' . db_escape($this->path[1]) . '"');
		}
	}
	
	function cheatsheets() {
		$this->tpl->add('cheatsheets', db_fetch_all('
			SELECT * 
			FROM cs_cheatsheet
			WHERE user_id = ' . $this->user->id . '
			
		'));
		$this->tpl->view('cheatsheet/list');
	}
	
	function new_cheatsheet() {
		if ($_POST) {
			$_POST['user_id'] = $this->user->id;
			db_insert('cs_cheatsheet', $_POST);
		}
		$this->tpl->view('cheatsheet/cheatsheet_new');
	}
	
	function view_cheatsheet() {
		$this->tpl->view('cheatsheet/cheatsheet');
	}
	
	function edit_cheatsheet() {
		if ($_POST) {
			db_update('cs_cheatsheet', $this->cheatsheet->id, $_POST);
		}
	}
	
	function delete_cheatsheet() {
		if ($_POST) {
			db_delete('cs_cheatsheet', $this->cheatsheet->id);
		}
	}
	
	function new_cheat() {
		
	}
	
	function view_cheat() {
		
	}
	
	function edit_cheat() {
		
	}
	
	function delete_cheat() {
		
	}
	
}
/*

install:

CREATE TABLE `cs_cheatsheet` (
  `id` int(10) NOT NULL auto_increment,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) default NULL,
  `reference` varchar(100) default NULL,
  PRIMARY KEY  (`id`)
);

CREATE TABLE `cs_cheat` (
  `id` int(11) NOT NULL auto_increment,
  `title` varchar(100) default NULL,
  `color` char(6) default NULL,
  `short_contents` varchar(1000) default NULL,
  `long_contents` text,
  PRIMARY KEY  (`id`)
);

*/
?>
