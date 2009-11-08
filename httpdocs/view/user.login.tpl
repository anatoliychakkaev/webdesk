<h2>Login</h2>

<form method="POST">
	<table>
		<tr>
			<th>Email</th>
			<td><input name="email" value="{$user->email}" tabindex="1" /></td>
		</tr>
		<tr>
			<th>Password</th>
			<td><input name="password" type="password" tabindex="2" /></td>
		</tr>
		<tr>
			<th></th>
			<td>
				<input type="checkbox" name="remember" id="remember_me"  
					style="vertical-align: middle" tabindex="3" />
				<label for="remember_me" style="vertical-align: middle">
					remember me
				</label>
			</td>
		</tr>
		<tr>
			<th></th>
			<td><input type="submit" value="Sign in!" tabindex="4" /></td>
		</tr>
	</table>
</form>
