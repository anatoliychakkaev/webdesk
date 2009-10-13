{if $notes}
	{foreach from=$notes item=note}
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
{else}
	На настоящий момент не создано ни одной записи.
{/if}
