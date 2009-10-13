<?php
/**
 * Smarty plugin
 * @package Smarty
 * @subpackage plugins
 */


/**
 * Smarty date modifier plugin
 * Purpose:  converts timestamp (unix) to form "X min ago", "X sec ago" in russian language
 * Type:     modifier<br>
 * Name:     timeago<br>
 * @author   Anatoliy Chakkaev
 * @param string
 * @return string
 */
function smarty_modifier_timeago($datetime) {
	$word = array(
		's' => array('cекунду', 'секунды', 'секунд'),
		'm' => array('минуту', 'минуты', 'минут'),
		'h' => array('час', 'часа', 'часов')
	);
	$timestamp = strtotime($datetime) or
	$timestamp = $datetime;
	$sec = time() - $timestamp;
      
	if ($sec <= 0) {
		return 'Только что';
	}
	
	if ($sec < 60) {
		$mod_sec = $sec % 10;
		if (4 < $sec && $sec < 21 || $mod_sec > 4) {
			return $sec . ' ' . $word['s'][2] . ' назад';
		}
		if ($sec % 10 === 1) {
			return $sec . ' ' . $word['s'][0] . ' назад';
		}
		return $sec . ' ' . $word['s'][1] . ' назад';
	}
	
	$min = floor($sec / 60);
	if ($min < 60) {
		$mod_min = $min % 10;
		if (4 < $min && $min < 21 || $mod_min > 4) {
			return $min . ' ' . $word['m'][2] . ' назад';
		}
		if ($min % 10 === 1) {
			return $min . ' ' . $word['m'][0] . ' назад';
		}
		return $min . ' ' . $word['m'][1] . ' назад';
	}
	
	$h = floor($min / 60);
	if ($h < 20) {
		$mod_h = $h % 10;
		if (4 < $h && $h < 21 || $mod_h > 4) {
			return $h . ' ' . $word['h'][2] . ' назад';
		}
		if ($h % 10 === 1) {
			return $h . ' ' . $word['h'][0] . ' назад';
		}
		return $h . ' ' . $word['h'][1] . ' назад';
	}
	setlocale(LC_ALL, 'ru_RU.utf8');
	return strftime('%e %b %Y %H:%M', $timestamp);
}

?>
