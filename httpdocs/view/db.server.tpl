{include file=in.header.tpl}

{foreach from=$databases item=db}
	<a href="{$pp}{$db}">{$db}</a><br/>
{/foreach}

{include file=in.footer.tpl}
