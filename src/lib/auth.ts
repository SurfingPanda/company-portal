/**
 * Returns a safe in-portal path from a `returnUrl` value, or "/" if it is missing or unsafe.
 * Only same-site paths are accepted ("/documents", "/hr/leave?x=1"). Absolute URLs, protocol-relative URLs
 * ("//evil.example"), backslash tricks and anything with a scheme are rejected, so the login page can never be used
 * as an open redirect.
 */
export function getSafeReturnUrl(value: string | null | undefined): string {
  if (!value) return '/'
  const candidate = value.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/'
  if (candidate.includes('\\') || /[\u0000-\u001f]/.test(candidate)) return '/'
  if (/^\/[^?#]*:\/\//.test(candidate) || candidate.toLowerCase().includes('javascript:')) return '/'
  // Never send people back to the login page itself.
  if (candidate === '/login' || candidate.startsWith('/login?') || candidate.startsWith('/login/')) return '/'
  return candidate
}
