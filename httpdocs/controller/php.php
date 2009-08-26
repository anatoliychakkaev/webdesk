<?

switch($screen){
	case 'stores':
		set_time_limit(0);
		for($q = 0;$q<1000; $q++){
			$sql = 'INSERT INTO cyclescheme_dev.cyclescheme_stores VALUES ';
			for($i = 0; $i < 1000; $i++) {
				$n = 1246 + ($q*1000) + $i;
				$sql .= "($n,'Action Bikes (Embankment)','embankment@actionbikes.co.uk','c5755798148b6cfee3840aa266596531',1,'23/26 Embankment Place','','LONDON','','WC2N 6NN',3,'Peter Jones','Manager','020 7930 2525','www.actionbikes.co.uk','020 7930 2525','538 874494','ACTIONMT','','--','',10.00,51.50743,-0.12312,'bacs',1,'','','','','','','','',0,0,'2009-01-11 21:00:00','0000-00-00 00:00:00','0000-00-00 00:00:00','Marin, Trek, Raleigh, Bromton Suppliers, Zyro, Fishers, Specialized, Madison, Oakley, Chickens','Password: actionembankment Shop Code: ACTIONMT Peter Jones Action Bikes 23/26 Embankment Place LONDON WC2N 6NN')";
				if ($i != 999) $sql .= ',';
				
			}
			db_execute($sql);
			echo $q . '<br/>';
			flush();
		}
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
	case 'server_vars':
		echo '<pre>';
		print_r($_SERVER);
		break;
	case 'info':
		phpinfo();
		break;
}

?>
