{include file=in.header.tpl}

<style>
{literal}
.preview {
	padding: 10px;
}
.options {
	font-size: 12px;
}
{/literal}
</style>

{foreach from=$index item=note}
<div class="topic">
	<div class="preview">
		{$note->note|nl2br|truncate:300:'...'}
	</div>
	<div class="options">
		Запись создана {$note->date_created|timeago}
	</div>
	<div class="read_more">
		<a href="{$pp}{$note->id}">Подробнее</a>
	</div>
</div>
{/foreach}

{include file=in.footer.tpl}
