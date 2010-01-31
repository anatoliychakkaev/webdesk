	</div>
   	<div class="empty_inner" style="">&#160;</div>
</div>
<div id="footer">
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
</body>
</html>
