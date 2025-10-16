/**
 * Sistema de Permisos - Flamenca Store ERP
 * 
 * ROLES:
 * - admin: Control total del sistema
 * - manager: Encargado de tienda física, gestión operativa
 * - employee: Empleado, operaciones básicas
 */

export type UserRole = "admin" | "manager" | "employee";

export type Permission =
  // Dashboard
  | "view_dashboard"
  | "view_all_stats"
  
  // Productos
  | "view_products"
  | "create_product"
  | "edit_product"
  | "delete_product"
  | "sync_woocommerce"
  | "bulk_actions"
  | "export_products"
  
  // Encargos
  | "view_orders"
  | "create_order"
  | "edit_order"
  | "delete_order"
  | "view_all_orders" // Ver encargos de todos vs solo propios
  
  // TPV / Ventas
  | "access_pos"
  | "process_sale"
  | "apply_discount"
  | "create_discount_coupons"
  
  // Facturas
  | "view_invoices"
  | "create_invoice"
  | "delete_invoice"
  | "sync_holded"
  
  // Empleados
  | "view_employees"
  | "create_employee"
  | "edit_employee"
  | "delete_employee"
  | "assign_roles"
  | "view_employee_stats"
  
  // Fichajes
  | "view_time_entries"
  | "clock_in_out"
  | "edit_time_entries" // Editar fichajes de otros
  | "delete_time_entries"
  
  // Incidencias
  | "view_incidents"
  | "create_incident"
  | "edit_incident"
  | "resolve_incident"
  | "delete_incident"
  | "assign_incident"
  
  // Notificaciones
  | "view_notifications"
  | "send_notifications"
  | "manage_notification_templates"
  
  // Configuración del Sistema
  | "manage_settings";

/**
 * Definición de permisos por rol
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Dashboard
    "view_dashboard",
    "view_all_stats",
    
    // Productos
    "view_products",
    "create_product",
    "edit_product",
    "delete_product",
    "sync_woocommerce",
    "bulk_actions",
    "export_products",
    
    // Encargos
    "view_orders",
    "create_order",
    "edit_order",
    "delete_order",
    "view_all_orders",
    
    // TPV
    "access_pos",
    "process_sale",
    "apply_discount",
    "create_discount_coupons",
    
    // Facturas
    "view_invoices",
    "create_invoice",
    "delete_invoice",
    "sync_holded",
    
    // Empleados
    "view_employees",
    "create_employee",
    "edit_employee",
    "delete_employee",
    "assign_roles",
    "view_employee_stats",
    
    // Fichajes
    "view_time_entries",
    "clock_in_out",
    "edit_time_entries",
    "delete_time_entries",
    
    // Incidencias
    "view_incidents",
    "create_incident",
    "edit_incident",
    "resolve_incident",
    "delete_incident",
    "assign_incident",
    
    // Notificaciones
    "view_notifications",
    "send_notifications",
    "manage_notification_templates",
    
    // Configuración del Sistema
    "manage_settings",
  ],
  
  manager: [
    // Dashboard
    "view_dashboard",
    "view_all_stats",
    
    // Productos
    "view_products",
    "create_product",
    "edit_product",
    "export_products",
    
    // Encargos
    "view_orders",
    "create_order",
    "edit_order",
    "delete_order",
    "view_all_orders",
    
    // TPV
    "access_pos",
    "process_sale",
    "apply_discount",
    
    // Facturas
    "view_invoices",
    "create_invoice",
    
    // Empleados
    "view_employees",
    "view_employee_stats",
    
    // Fichajes
    "view_time_entries",
    "clock_in_out",
    "edit_time_entries",
    
    // Incidencias
    "view_incidents",
    "create_incident",
    "edit_incident",
    "resolve_incident",
    "assign_incident",
    
    // Notificaciones
    "view_notifications",
    "send_notifications",
  ],
  
  employee: [
    // Dashboard (solo vista básica)
    "view_dashboard",
    
    // Productos (SOLO lectura)
    "view_products",
    
    // Encargos (puede crear y ver, pero NO editar/eliminar)
    "view_orders",
    "create_order",
    
    // TPV (procesar ventas CON descuentos)
    "access_pos",
    "process_sale",
    "apply_discount",
    
    // Facturas: NO ACCESO
    // "view_invoices" - REMOVIDO
    
    // Empleados: NO ACCESO
    // "view_employees" - REMOVIDO
    
    // Fichajes (solo propios)
    "view_time_entries",
    "clock_in_out",
    
    // Incidencias (crear y ver propias)
    "view_incidents",
    "create_incident",
    
    // Notificaciones (solo ver configuración propia)
    "view_notifications",
  ],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Verifica si un rol tiene TODOS los permisos especificados
 */
export function hasAllPermissions(role: UserRole | null, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Verifica si un rol tiene AL MENOS UNO de los permisos especificados
 */
export function hasAnyPermission(role: UserRole | null, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Obtiene una descripción amigable del rol
 */
export function getRoleLabel(role: UserRole | null): string {
  if (!role) return "Sin rol";
  
  const labels: Record<UserRole, string> = {
    admin: "Administrador",
    manager: "Encargado",
    employee: "Empleado",
  };
  return labels[role];
}

/**
 * Obtiene el color del badge según el rol
 */
export function getRoleColor(role: UserRole | null): string {
  if (!role) return "bg-muted text-muted-foreground";
  
  const colors: Record<UserRole, string> = {
    admin: "bg-destructive text-destructive-foreground",
    manager: "bg-primary text-primary-foreground",
    employee: "bg-secondary text-secondary-foreground",
  };
  return colors[role];
}

