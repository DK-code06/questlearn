import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  allowedRoles?: string[]; // Optional: If we want to restrict to just 'instructor'
}

const PrivateRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext) as any;

  // 1. Wait for the initial check to finish
  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center text-neon-blue"><Loader2 className="animate-spin" size={40}/></div>;
  }

  // 2. Not Logged In? -> Go to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // 🚨 THE FIX: If authenticated but the user object hasn't been fetched from the API yet, WAIT.
  // Otherwise, checking `user.role` below will throw a null error and cause the blank screen!
  if (isAuthenticated && !user) {
    return <div className="h-screen bg-black flex items-center justify-center text-neon-blue"><Loader2 className="animate-spin" size={40}/></div>;
  }

  // 3. Wrong Role? (e.g., Student trying to access Instructor page)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect them to their correct dashboard
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'instructor') return <Navigate to="/instructor/dashboard" />;
    return <Navigate to="/student/dashboard" />;
  }

  // 4. Access Granted! Render the page.
  return <Outlet />;
};

export default PrivateRoute;