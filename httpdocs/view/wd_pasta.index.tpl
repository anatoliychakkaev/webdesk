{include file=in.header.tpl}

<style>
{literal}
.topic {
	padding: 20px;
}
{/literal}
</style>

{foreach from=$index item=pasta}
<div class="topic">
	{$pasta->pasta|truncate:300:'...'}
	<br/><a href="{$pp}{$pasta->id}">moar</a>
</div>
{/foreach}

{include file=in.footer.tpl}
