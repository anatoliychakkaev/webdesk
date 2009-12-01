<style>
{literal}
.outlay_record {
	padding-left: 20px;
	width: 250px;
	clear: both;
}

.outlay_description {
	float: left;
	max-width: 180px;
	padding-bottom: 7px;
}

.outlay_value {
	float: right;
	max-width: 65px;
	clear: right;
}

.daily_total {
	border-top: 1px solid #000;
	height: 20px;
}

.active {
	color: blue;
}

h2 a {
	text-decoration: none;
}

.inline_block {
	display: -moz-inline-box; display: inline-block; *zoom: 1; *display: inline; /* фаза 1 — добавляем inline-block */
	word-spacing: normal; /* фаза два — восстанавливаем убранный пробел в блоках */
	vertical-align: top; /* IE6 некорректно позиционирует без этого */
	padding: 5px;
	margin: 3px;
	background: #fff;
	-moz-border-radius: 10px;
	-webkit-border-radius: 10px;
	border: 1px solid #bbb;
}

.block_header {
	font-weight: 700;
	border-bottom: 1px solid #000;
	margin-bottom: 7px;
	padding-bottom: 7px;
	padding: 3px;
}

.block_footer {
	font-weight: 700;
	border-top: 1px solid #000;
	margin-top: 7px;
	padding: 3px;
	padding-top: 7px;
	float: left;
	clear: both;
	width: 270px;
}

.block_footer div {
	padding-bottom: 0;
}

.outlay_category_breakdown {
	float: left;
	clear: both;
	display: none;
	border-top: 1px solid #ddd;
	border-bottom: 1px solid #ddd;
	padding-top: 5px;
	margin-bottom: 5px;
	float: left;
}

.outlay_category_breakdown .outlay_record {
	padding-left: 10px;
	width: 260px;
	color: #888;
}

{/literal}
</style>

<h2>
	<a href="?year_week={$year_week}&go=prev">&larr;</a>
	Расходы за {$week}-ю неделю
	<a href="?year_week={$year_week}&go=next">&rarr;</a>
</h2>

<div style="padding-bottom: 15px">
{include file=outlay.create.tpl}
</div>

<div id="outlay_index">
{if $weekdata}
	{foreach name=weekday from=$weekdata item=weekday}
		<div class="inline_block">
			
			<div class="block_header{if $smarty.now|date_format == $weekday[0]->items[0]->created_at|date_format} active{/if}">
				{$weekday[0]->items[0]->created_at|date_format:'%A, %e %b'}
			</div>
			{assign var=total value=$total+$outlay->value}
			{foreach from=$weekday item=cat}
			{assign var=total value=$total+$cat->total}
			<div class="outlay_record" onclick="$(this).next('div').toggle();">
				<div class="outlay_description">
					{$cat->items[0]->name}
				</div>
				<div class="outlay_value">
					{'%01.2f'|sprintf:$cat->total}
				</div>
			</div>
			<div class="outlay_category_breakdown">
				{foreach from=$cat->items item=outlay}
				<div class="outlay_record">
					<div class="outlay_description">
						{$outlay->note|default:'no comment'}
					</div>
					<div class="outlay_value">
						<a href="{$pp}{$outlay->id}/edit">{'%01.2f'|sprintf:$outlay->value}</a>
					</div>
				</div>
				{/foreach}
			</div>
			{/foreach}
			
			<div class="block_footer">
				<div class="outlay_description">
					<strong>Всего</strong>
				</div>
				
				<div class="outlay_value">
					<u>{'%01.2f'|sprintf:$total}</u>
				</div>
			</div>
		</div>
	{/foreach}
	</div>
{else}
	Нет информации о расходах
{/if}
</div>

<div class="clear"></div>

{assign var=total value=0}

<div id="outlay_breakdown" style="padding:10px;">

	<h2>Итоги {$week}-й недели</h2>
	{foreach from=$breakdown item=category}
	{assign var=total value=$total+$category->sum}
	<div class="outlay_record">
		<div class="outlay_description">{$category->name}</div>
		<div class="outlay_value">{$category->sum}</div>
	</div>
	{/foreach}
	<div class="outlay_record daily_total">
		<div class="outlay_description"><b>Всего</b></div>
		<div class="outlay_value"><u>{$total}</u></div>
	</div>
</div>
