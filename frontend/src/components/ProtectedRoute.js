import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// usage: <ProtectedRoute allowedRoles={[ 'admin','distributor' ]}><MyComponent/></ProtectedRoute>
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    // not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user.role || '').toString().toLowerCase();
    const allowed = allowedRoles.map(r => r.toString().toLowerCase());
    if (!allowed.includes(role)) {
      // logged in but not allowed for this route
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
