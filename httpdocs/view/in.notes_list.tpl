{if $notes}
	{foreach from=$notes item=note}
	<div class="topic">
		<div class="preview">
			
			{$note->note|nl2br}
		</div>
		<div class="options">
			Запись создана <strong>{$note->created_at|timeago}</strong>, автор <strong>{$note->author_name}</strong> |
			<a href="{$pp}{$note->id}">Подробнее</a>
			{if $user && $user->id == $note->user_id}
			| <a href="{$pp}{$note->id}/edit">Редактировать</a>
			{/if}
		</div>
		{if $note->tags}
		<div class="tags">
			{foreach from=$note->tags item=tag}
				<a href="{$pp}by_tag/{$tag->name}">{$tag->name}</a>
			{/foreach}
		</div>
		{/if}
	</div>
	{/foreach}
{else}
	<div class="topic">На настоящий момент не создано ни одной записи.</div>
{/if}
