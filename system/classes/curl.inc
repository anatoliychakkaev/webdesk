<?php
class curl {
	
	var $c;
	var $url;
	
	function curl($url) {
		$this->c = curl_init();
		//curl_setopt($this->c,CURLOPT_PROXY,'192.168.x.x:8000'); // это прокси (если надо)
		//curl_setopt($this->c,CURLOPT_PROXYUSERPWD,'user:pass'); 
		//curl_setopt($this->c,CURLOPT_PROXYUSERPWD,'user2:pass2');
		//curl_setopt($this->c, CURLOPT_COOKIE, 'cookie here'); // представляемся гуглу
		curl_setopt($this->c, CURLOPT_URL, $url);
		$this->url = $url;
	}
	
	function post($data) {
		curl_setopt($this->c, CURLOPT_POST, 1);
		curl_setopt($this->c, CURLOPT_POSTFIELDS, $data);
	}
	
	function cookie_file($filename) {
		curl_setopt($this->c, CURLOPT_COOKIEFILE, $filename);
	}
	
	function useragent($id = 'ff') {
		switch ($id) {
		default:
		case 'ff':
		case 'firefox':
			curl_setopt($this->c, CURLOPT_USERAGENT, 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.1.8) Gecko/20100214 Ubuntu/9.10 (karmic) Firefox/3.5.');
			break;
		}
	}
	
	function follow_location() {
		curl_setopt($this->c, CURLOPT_FOLLOWLOCATION, 1);
	}
	
	function go($return = false) {
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

?>
