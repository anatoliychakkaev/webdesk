<?
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
