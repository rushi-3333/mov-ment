const jwt = require("jsonwebtoken");

/**
 * Role-based access: validates JWT and optionally restricts by role.
 * Use HTTPS in production for encrypted user data and transactions.
 */
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: payload.id,
        role: payload.role,
      };

      if (
        Array.isArray(requiredRoles) &&
        requiredRoles.length > 0 &&
        !requiredRoles.includes(payload.role)
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

module.exports = auth;

