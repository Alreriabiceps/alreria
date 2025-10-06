import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, requireStudent, requireAdmin }) => {
  const { isAuthenticated, isStudent, isAdmin, loading, user, authKey } =
    useAuth();
  const location = useLocation();

  // Debug logging
  console.log("ProtectedRoute check:", {
    loading,
    isAuthenticated,
    isStudent,
    isAdmin,
    user,
    pathname: location.pathname,
    requireStudent,
    requireAdmin,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log("User not authenticated, redirecting to login");
    // Redirect to appropriate login page based on the route
    const isAdminRoute = location.pathname.startsWith("/admin");
    return (
      <Navigate
        to={isAdminRoute ? "/alogin" : "/"}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role-specific requirements
  if (requireStudent && !isStudent) {
    console.log("Student role required but user is not a student");
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log("Admin role required but user is not an admin");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("Access granted to protected route");
  return children;
};

export default ProtectedRoute;
