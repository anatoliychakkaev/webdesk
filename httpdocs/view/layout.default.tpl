<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" debug="true">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>{$title}</title>
	<link rel="shortcut icon" href="/images/favicon.ico" />
	<link rel="stylesheet" href="/css/common.css" />
	<link rel="icon" href="/images/silk/accept.png" sizes="16x16" />
	
	<!-- IE6 specific CSS-->
	<!--[if lte IE 6]>
	<link rel="stylesheet" href="/css/ie6.css" type="text/css" media="projection, screen">
	<![endif]-->
	
	<script type="text/javascript" language='javascript' src='/scripts/jquery-1.2.6.min.js'></script>
</head>
<body>
<div id="header" style="clear:both;">
	<div style="float:left;">
		{if $user->logged_in}
			Logged as {$user->email},
			<a href='/system/logout'>logout</a>
		{else}
			<a href='/system/login'>[login]</a> or
			<a href='/system/register'>[register]</a>
		{/if}
	</div>
	<div style="float:right;">
		my webdesk '09 &#160;
	</div>
</div>
<div class="wrap">
	<div class="contentdiv">
	{include file=$body}
	</div>
   	<div class="empty_inner" style="">&#160;</div>
</div>
</body>
</html>
