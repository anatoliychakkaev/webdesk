{include file=in.header.tpl}

<h2><a href="/db/{$database}">{$database}</a></h2>
{foreach from=$tables item=t}
	<a href="/db/{$database}/{$t}">{$t}</a><br/>
{/foreach}

{include file=in.footer.tpl}
