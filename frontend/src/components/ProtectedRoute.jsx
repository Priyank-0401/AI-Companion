import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  
  // Show loading state while auth is being determined
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Only redirect to login when we're certain the user is not authenticated
  if (!user && initialized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
