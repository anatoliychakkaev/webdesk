<h2 class="page_section">
	Database `{$database}`
	<div class="note">
		return to 
		<a href="{$pp}">databases list</a>
	</div>
</h2>

<ul>
{foreach from=$tables item=t}
	<li><a href="{$pp}{$database}/{$t}">{$t}</a></li>
{/foreach}
</ul>
