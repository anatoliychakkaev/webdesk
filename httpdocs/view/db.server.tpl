{include file=in.header.tpl}

{foreach from=$databases item=db}
	<a href="/db/{$db}">{$db}</a><br/>
{/foreach}

{include file=in.footer.tpl}
