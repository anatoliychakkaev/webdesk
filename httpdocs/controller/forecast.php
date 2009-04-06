<?php

class curl {
	
	var $c;
	var $url;
	
	function curl ($url) {
		$this->c = curl_init();
		//curl_setopt($this->c,CURLOPT_PROXY,'192.168.x.x:8000'); // это прокси (если надо)
		//curl_setopt($this->c,CURLOPT_PROXYUSERPWD,'user:pass'); 
		//curl_setopt($this->c,CURLOPT_PROXYUSERPWD,'user2:pass2');
		//curl_setopt($this->c, CURLOPT_COOKIE, 'cookie here'); // представляемся гуглу
		curl_setopt($this->c, CURLOPT_URL, $url);
		$this->url = $url;
	}
	
	function post ($data) {
		curl_setopt($this->c, CURLOPT_POST, 1);
		curl_setopt($this->c, CURLOPT_POSTFIELDS, $data);
	}
	
	function go ($return = 0) {
		if ($return) {
			curl_setopt($this->c, CURLOPT_RETURNTRANSFER, $return);
			$response = curl_exec($this->c);
			curl_close($this->c);
			return $response;
		} else {
			curl_exec($this->c);
			curl_close($this->c);
		}
	}
	
}


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
