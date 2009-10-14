{if $notes}
	{foreach from=$notes item=note}
	<div class="topic">
		<div class="preview">
			
			{$note->note|nl2br|truncate:300:'...'}
		</div>
		<div class="options">
			Запись создана <strong>{$note->date_created|timeago}</strong>, автор <strong>{$note->author_name}</strong> |
			<a href="{$pp}{$note->id}">Подробнее</a>
			{if $user && $user->id == $note->user_id}
			| <a href="{$pp}{$note->id}/edit">Редактировать</a>
			{/if}
		</div>
			
	</div>
	{/foreach}
{else}
	На настоящий момент не создано ни одной записи.
{/if}
