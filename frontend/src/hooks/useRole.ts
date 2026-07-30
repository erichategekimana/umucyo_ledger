import { useAuth } from './useAuth';
import { Role } from '@/types';

export const useRole = () => {
  const { role } = useAuth();
  const isRole = (allowedRoles: Role | Role[]) => {
    if (!role) return false;
    if (Array.isArray(allowedRoles)) return allowedRoles.includes(role);
    return role === allowedRoles;
  };
  return { role, isRole };
};