<?

switch($screen){
	case '':
		
	break;
	default:
		$c = curl_init();
		curl_setopt($c, CURLOPT_URL, 'http://ru.php.net/' . $screen);
		curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
		$response = curl_exec($c);
		curl_close($c);
		echo preg_replace('/<a.*?href=(["\']).*?function\\.(.*?)\\.php/six', '<a href=$1http://webdesk.homelinux.org/php/$2/', $response);
		//echo $response;
	break;
}

?>
