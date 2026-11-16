import React from 'react';
import { useAuth, AppPermission } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  permission?: AppPermission;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  permission,
  fallback = null
}) => {
  const { user, can, hasRole } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
