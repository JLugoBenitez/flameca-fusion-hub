import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGate } from "@/components/PermissionGate";
import { toast } from "sonner";
import { Users, Plus, UserCog, Edit, Trash2, Loader2, Key, RefreshCw } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { UserRole, getRoleLabel, getRoleColor } from "@/lib/permissions";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  user_roles: Array<{
    role: UserRole;
  }>;
}

export default function Employees() {
  const { isAdmin, loading: roleLoading, user, userRole } = useUserRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "employee" as UserRole,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);


  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees...");
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Employees fetched:", data);
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error al cargar empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing, use update function
    if (editingEmployee) {
      return handleUpdateEmployee(e);
    }

    // Otherwise, create new employee
    if (!isAdmin) {
      toast.error("Solo administradores pueden añadir empleados");
      return;
    }

    if (!user?.id || !isValidUUID(user.id)) {
      toast.error("Error: No se pudo obtener el ID del usuario actual");
      return;
    }

    setCreatingEmployee(true);
    try {
      console.log("Creating user:", {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        requesting_user_id: user?.id
      });

      // Create user using Edge Function (avoids session switching)
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          requesting_user_id: user?.id,
        },
      });

      if (error) {
        console.error("Error creating user:", error);
        throw error;
      }

      console.log("User created successfully:", data);
      toast.success(`Empleado creado correctamente con rol: ${formData.role}`);

      setDialogOpen(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "employee",
      });
      
      // Wait a bit for the database to propagate changes
      setTimeout(() => {
        fetchEmployees();
      }, 500);
    } catch (error: any) {
      toast.error("Error al crear empleado: " + error.message);
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden cambiar roles");
      return;
    }

    if (!user?.id) {
      toast.error("Error: No se pudo obtener el ID del usuario actual");
      return;
    }

    setChangingRole(userId);
    try {
      console.log("Changing role:", {
        user_id: userId,
        new_role: newRole,
        requesting_user_id: user?.id,
        current_user: user
      });

      if (!userId || !isValidUUID(userId)) {
        toast.error("Error: ID de usuario no válido");
        return;
      }

      if (!user?.id || !isValidUUID(user.id)) {
        toast.error("Error: ID del usuario actual no válido");
        return;
      }

      // Update role usando Edge Function
      const { data, error } = await supabase.functions.invoke("assign-role", {
        body: {
          user_id: userId,
          role: newRole,
          action: "update",
          requesting_user_id: user?.id,
        },
      });

      if (error) {
        console.error("Error changing role:", error);
        throw error;
      }

      console.log("Role changed successfully:", data);
      toast.success("Rol actualizado correctamente");
      fetchEmployees();
    } catch (error: any) {
      console.error("Error al cambiar rol:", error);
      toast.error("Error al cambiar rol: " + error.message);
    } finally {
      setChangingRole(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      password: "", // Don't pre-fill password
      full_name: employee.full_name,
      phone: employee.phone || "",
      role: employee.user_roles[0]?.role || "employee",
    });
    setDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden eliminar empleados");
      return;
    }

    if (!user?.id || !isValidUUID(user.id)) {
      toast.error("Error: No se pudo obtener el ID del usuario actual");
      return;
    }

    setDeletingEmployee(employeeId);
    try {
      console.log("Deleting user:", { user_id: employeeId, requesting_user_id: user.id });

      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: {
          user_id: employeeId,
          requesting_user_id: user.id,
        },
      });

      if (error) {
        console.error("Error deleting user:", error);
        throw error;
      }

      console.log("User deleted successfully:", data);
      toast.success("Empleado eliminado correctamente");
      
      // Wait a bit for the database to propagate changes
      setTimeout(() => {
        fetchEmployees();
      }, 500);
    } catch (error: any) {
      console.error("Error al eliminar empleado:", error);
      toast.error("Error al eliminar empleado: " + error.message);
    } finally {
      setDeletingEmployee(null);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Solo administradores pueden editar empleados");
      return;
    }

    if (!user?.id || !isValidUUID(user.id)) {
      toast.error("Error: No se pudo obtener el ID del usuario actual");
      return;
    }

    if (!editingEmployee) {
      toast.error("Error: No se encontró el empleado a editar");
      return;
    }

    setCreatingEmployee(true);
    try {
      console.log("Updating user:", {
        user_id: editingEmployee.id,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
        requesting_user_id: user.id
      });

      const { data, error } = await supabase.functions.invoke("update-user", {
        body: {
          user_id: editingEmployee.id,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          requesting_user_id: user.id,
        },
      });

      if (error) {
        console.error("Error updating user:", error);
        throw error;
      }

      console.log("User updated successfully:", data);
      toast.success("Empleado actualizado correctamente");

      setDialogOpen(false);
      setEditingEmployee(null);
      setTempPassword(null);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "employee",
      });
      
      // Wait a bit for the database to propagate changes
      setTimeout(() => {
        fetchEmployees();
      }, 500);
    } catch (error: any) {
      console.error("Error al actualizar empleado:", error);
      toast.error("Error al actualizar empleado: " + error.message);
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleResetPassword = async (employeeId: string) => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden resetear contraseñas");
      return;
    }

    if (!user?.id || !isValidUUID(user.id)) {
      toast.error("Error: No se pudo obtener el ID del usuario actual");
      return;
    }

    setResettingPassword(employeeId);
    try {
      console.log("Resetting password for user:", { user_id: employeeId, requesting_user_id: user.id });

      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: {
          user_id: employeeId,
          requesting_user_id: user.id,
        },
      });

      if (error) {
        console.error("Error resetting password:", error);
        throw error;
      }

      console.log("Password reset successfully:", data);
      setTempPassword(data.tempPassword);
      toast.success("Contraseña reseteada correctamente. La nueva contraseña se muestra abajo.");
    } catch (error: any) {
      console.error("Error al resetear contraseña:", error);
      toast.error("Error al resetear contraseña: " + error.message);
    } finally {
      setResettingPassword(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  // Debug info (remove in production)
  console.log("Current user debug:", {
    user,
    userRole,
    isAdmin,
    userId: user?.id,
    isValidUserId: user?.id ? isValidUUID(user.id) : false
  });

  if (loading || roleLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">Listado del personal de la tienda</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchEmployees();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
          <PermissionGate permission="create_employee">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-hero"
                onClick={() => {
                  setEditingEmployee(null);
                  setTempPassword(null);
                  setFormData({
                    email: "",
                    password: "",
                    full_name: "",
                    phone: "",
                    role: "employee",
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir Empleado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}
                </DialogTitle>
                <DialogDescription>
                  {editingEmployee 
                    ? "Modifica la información del empleado" 
                    : "Crea una cuenta para un nuevo empleado"
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {!editingEmployee && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Empleado</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {editingEmployee && (
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleResetPassword(editingEmployee.id)}
                        disabled={resettingPassword === editingEmployee.id}
                        className="flex-1"
                      >
                        {resettingPassword === editingEmployee.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4 mr-2" />
                        )}
                        Resetear Contraseña
                      </Button>
                    </div>
                    {tempPassword && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800 font-medium">Nueva contraseña generada:</p>
                        <p className="text-sm text-green-700 font-mono bg-green-100 p-2 rounded mt-1">
                          {tempPassword}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Comparte esta contraseña con el empleado. Deberá cambiarla en su primer inicio de sesión.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="bg-gradient-hero"
                    disabled={creatingEmployee}
                  >
                    {creatingEmployee 
                      ? (editingEmployee ? "Actualizando..." : "Creando...") 
                      : (editingEmployee ? "Actualizar Empleado" : "Crear Empleado")
                    }
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <Card key={employee.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 bg-gradient-hero">
                  <AvatarFallback className="text-white font-bold">
                    {getInitials(employee.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{employee.full_name}</CardTitle>
                  <CardDescription>{employee.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {employee.phone && (
                <div className="mb-3">
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <p className="text-sm font-medium">{employee.phone}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <PermissionGate permission="assign_roles">
                  {employee.user_roles.length > 0 ? (
                    <Select
                      value={employee.user_roles[0]?.role || "employee"}
                      onValueChange={(value: UserRole) => handleChangeRole(employee.id, value)}
                      disabled={changingRole === employee.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">
                          <Badge className={getRoleColor("employee")}>
                            {getRoleLabel("employee")}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="manager">
                          <Badge className={getRoleColor("manager")}>
                            {getRoleLabel("manager")}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="admin">
                          <Badge className={getRoleColor("admin")}>
                            {getRoleLabel("admin")}
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  <UserCog className="h-4 w-4 text-muted-foreground ml-2" />
                </PermissionGate>
                <PermissionGate 
                  permission="assign_roles" 
                  fallback={
                    <>
                      {employee.user_roles.map((ur, idx) => (
                        <Badge key={idx} className={getRoleColor(ur.role)}>
                          {getRoleLabel(ur.role)}
                        </Badge>
                      ))}
                      {employee.user_roles.length === 0 && (
                        <Badge variant="outline">Sin rol asignado</Badge>
                      )}
                    </>
                  }
                >
                  <></>
                </PermissionGate>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Registrado el {new Date(employee.created_at).toLocaleDateString()}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="flex gap-2 w-full">
                <PermissionGate permission="create_employee">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEmployee(employee)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </PermissionGate>
                <PermissionGate permission="create_employee">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEmployee(employee.id)}
                    disabled={deletingEmployee === employee.id}
                    className="flex-1"
                  >
                    {deletingEmployee === employee.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Borrar
                  </Button>
                </PermissionGate>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay empleados registrados</h3>
            <p className="text-muted-foreground">Los empleados aparecerán aquí cuando se registren</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
