<?php

require_once 'classes/curl.inc';


$clime_url = 'http://mycli.me/rating.html?loc=16';
$c = new curl($clime_url);

if (preg_match('/<td\s+?id="city"\s*?>[^<]*<a.*?href="([^"]*)"/im', $c->go(1), $m)) {
	$leader_forecast_url = $m[1];
} else {
	$leader_forecast_url = false;
}


switch ($format) {
case 'json':
	echo '{url: "' . $leader_forecast_url . '"}';
	break;
default:
	header('Location: ' . ($leader_forecast_url?$leader_forecast_url:$clime_url));
	break;
}

?>
