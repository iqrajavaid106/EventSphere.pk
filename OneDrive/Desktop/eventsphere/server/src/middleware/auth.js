const { verify } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

/**
 * Requires a valid Bearer token. Attaches { userId, role } to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const decoded = verify(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/**
 * Restricts access to one or more roles. Use after requireAuth.
 * Example: requireRole('admin'), requireRole('admin', 'organizer')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

/**
 * Attaches req.user if a valid Bearer token is present, but never rejects
 * the request when it's missing or invalid. Useful for routes that show
 * more data to logged-in privileged users but are otherwise public.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const decoded = verify(token);
      req.user = { userId: decoded.userId, role: decoded.role };
    } catch (_) {
      // ignore invalid/expired token — treat as anonymous
    }
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
