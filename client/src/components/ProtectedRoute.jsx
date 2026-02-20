import { Navigate, useLocation } from "react-router-dom";

/**
 * Role-based route guard. Ensures only the correct role can access each dashboard.
 * Secure access: users can't open manager or admin URLs without the right role.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowed = Array.isArray(allowedRoles) && allowedRoles.includes(role);
  if (!allowed) {
    if (role === "manager") return <Navigate to="/manager" replace />;
    if (role === "admin" || role === "owner") return <Navigate to="/admin" replace />;
    return <Navigate to="/user" replace />;
  }

  return children;
}
