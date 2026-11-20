/** WordPress's nonce-checked logout deletes session_tokens even on GET.
 * Keep the native authentication/nonce checks, but commit their resulting
 * state before returning the redirect. HEAD and OPTIONS can also reach PHP.
 */
export function isWordPressLogoutMutation(request: Request): boolean {
 const url=new URL(request.url);
 // URLSearchParams returns the first duplicate; PHP commonly keeps the last.
 // Conservatively admit persistence if any supplied action requests logout.
 return url.pathname==='/wp-login.php' && url.searchParams.getAll('action').includes('logout');
}
