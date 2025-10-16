import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, Permission, hasPermission, hasAllPermissions, hasAnyPermission } from "@/lib/permissions";

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    checkUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkUserRole();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsManager(false);
        setIsEmployee(false);
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (roles && roles.length > 0) {
        // Set the highest role (admin > manager > employee)
        const hasAdminRole = roles.some(r => r.role === "admin");
        const hasManagerRole = roles.some(r => r.role === "manager");
        const hasEmployeeRole = roles.some(r => r.role === "employee");
        
        setIsAdmin(hasAdminRole);
        setIsManager(hasAdminRole || hasManagerRole);
        setIsEmployee(hasAdminRole || hasManagerRole || hasEmployeeRole);
        
        if (hasAdminRole) {
          setUserRole("admin");
        } else if (hasManagerRole) {
          setUserRole("manager");
        } else {
          setUserRole("employee");
        }
      } else {
        // Por defecto, sin rol asignado = employee
        setUserRole("employee");
        setIsAdmin(false);
        setIsManager(false);
        setIsEmployee(true);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función helper para verificar un permiso
  const can = useCallback((permission: Permission): boolean => {
    return hasPermission(userRole, permission);
  }, [userRole]);

  // Función helper para verificar múltiples permisos (TODOS)
  const canAll = useCallback((permissions: Permission[]): boolean => {
    return hasAllPermissions(userRole, permissions);
  }, [userRole]);

  // Función helper para verificar múltiples permisos (AL MENOS UNO)
  const canAny = useCallback((permissions: Permission[]): boolean => {
    return hasAnyPermission(userRole, permissions);
  }, [userRole]);

  return { 
    user,
    userRole, 
    isAdmin, 
    isManager, 
    isEmployee,
    loading, 
    refreshRole: checkUserRole,
    can,
    canAll,
    canAny,
  };
}
