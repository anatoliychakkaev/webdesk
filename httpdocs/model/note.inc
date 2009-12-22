<?php

require_once 'orm.inc';

class note extends db_entity {
	var $has_many = array(
		'tags' => array(
			'name' => 'tag',
			'through' => 'note_to_tag',
			'order' => 'note_to_tag.id ASC'
		)
	);
}
?>
