/**
 * Production-ready secure headers middleware
 */
function secureHeaders(options = {}) {
  const defaultCsp = "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';";
  const csp = options.contentSecurityPolicy || defaultCsp;

  return function(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', options.frameGuard || 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Referrer-Policy', options.referrerPolicy || 'strict-origin-when-cross-origin');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    if (next) {
      next();
    }
  };
}

export default secureHeaders;
