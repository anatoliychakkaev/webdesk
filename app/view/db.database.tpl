<h2><a href="{$pp}{$database}">{$database}</a></h2>
{foreach from=$tables item=t}
	<a href="{$pp}{$database}/{$t}">{$t}</a><br/>
{/foreach}
