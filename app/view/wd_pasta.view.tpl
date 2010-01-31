<div><a href="{$pp}..">Back to index</a></div>
<p>
{$data->pasta|nl2br}
</p>
<form action="{$pp}/remove" method="POST" onsubmit="return confirm('Are you sure want to delete item?');">
	<input type="hidden" name="security_token" value="{$security_token}" />
	<input type="submit" value="Delete" /> or <a href="{$pp}/edit">Edit</a>
</form>
