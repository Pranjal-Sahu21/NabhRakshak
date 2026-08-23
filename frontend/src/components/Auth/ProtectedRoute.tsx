import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
const MotionButton = motion.button as React.FC<any>;
import { 
  ShieldExclamationIcon, 
  LockClosedIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallbackPath = '/login',
  showUnauthorized = true 
}: any) => {
  const { user, isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  const hasRequiredRole = requiredRoles.length === 0 || 
    requiredRoles.some(role => hasRole(role));

  // Check permission requirements
  const hasRequiredPermission = requiredPermissions.length === 0 || 
    requiredPermissions.some(permission => hasPermission(permission));

  // If user doesn't have required role or permission
  if (!hasRequiredRole || !hasRequiredPermission) {
    if (!showUnauthorized) {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8 text-center"
          >
            {/* Icon */}
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6"
            >
              <ShieldExclamationIcon className="w-8 h-8 text-white" />
            </MotionDiv>

            {/* Title */}
            <h1 className="text-2xl font-normal text-white mb-4">Access Denied</h1>
            
            {/* Message */}
            <div className="space-y-4 mb-8">
              <p className="text-gray-400">
                You don't have permission to access this resource.
              </p>
              
              {/* User Info */}
              <div className="bg-dark-lighter/50 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <LockClosedIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Current Access Level</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User:</span>
                    <span className="text-white">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-neon-blue capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Organization:</span>
                    <span className="text-white">{user?.organization}</span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {(requiredRoles.length > 0 || requiredPermissions.length > 0) && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-300">Required Access</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {requiredRoles.length > 0 && (
                      <div>
                        <span className="text-gray-400">Roles:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {requiredRoles.map((role, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs capitalize"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {requiredPermissions.length > 0 && (
                      <div>
                        <span className="text-gray-400">Permissions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {requiredPermissions.map((permission, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs"
                            >
                              {permission.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.history.back()}
                className="w-full neon-button py-3"
              >
                Go Back
              </MotionButton>
              
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/dashboard'}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Return to Dashboard
              </MotionButton>
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-xs text-gray-500">
                Need access? Contact your system administrator or{' '}
                <a 
                  href="mailto:admin@spacedebris.com" 
                  className="text-neon-blue hover:text-neon-purple transition-colors"
                >
                  admin@spacedebris.com
                </a>
              </p>
            </div>
          </MotionDiv>
        </div>
      </div>
    );
  }

  // User has required access, render the protected content
  return children;
};

// Higher-order component for easier usage
export const withAuth = (Component: any, options = {}) => {
  return function AuthenticatedComponent(props: any) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Role-specific route components
export const AdminRoute = ({ children, ...props }: any) => (
  <ProtectedRoute requiredRoles={['admin']} {...props}>
    {children}
  </ProtectedRoute>
);

export const OperatorRoute = ({ children, ...props }: any) => (
  <ProtectedRoute requiredRoles={['admin', 'operator']} {...props}>
    {children}
  </ProtectedRoute>
);

export const AnalystRoute = ({ children, ...props }: any) => (
  <ProtectedRoute requiredRoles={['admin', 'operator', 'analyst']} {...props}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
