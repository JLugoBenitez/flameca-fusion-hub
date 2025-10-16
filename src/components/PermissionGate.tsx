import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Permission } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // Si true, requiere TODOS los permisos. Si false, al menos UNO
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Componente que envuelve contenido y lo muestra solo si el usuario tiene los permisos necesarios
 * 
 * Uso:
 * <PermissionGate permission="delete_product">
 *   <Button>Eliminar</Button>
 * </PermissionGate>
 * 
 * O con múltiples permisos:
 * <PermissionGate permissions={["create_product", "edit_product"]} requireAll={false}>
 *   <ProductForm />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = true,
  fallback = null,
  showMessage = false,
}: PermissionGateProps) {
  const { can, canAll, canAny, loading } = useUserRole();

  if (loading) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    // Si no se especifica permiso, se muestra por defecto
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta sección.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}


