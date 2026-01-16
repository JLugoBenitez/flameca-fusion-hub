import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ClipboardList, Search, Loader2, Calendar, RefreshCw, Paperclip, Eye } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { useUserRole } from "@/hooks/useUserRole";
import { FileUpload } from "@/components/FileUpload";
import { ViewFilesDialog } from "@/components/ViewFilesDialog";

interface CustomOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  fabric: string | null;
  size: string | null;
  model: string | null;
  observations: string | null;
  registration_date: string;
  delivery_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  files_count?: number;
}

const STATUS_OPTIONS = [
  { value: "Procesando", label: "Procesando", color: "bg-blue-500" },
  { value: "Completado", label: "Completado", color: "bg-green-500" },
];

export default function CustomOrders() {
  const { user } = useUserRole();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<CustomOrder | null>(null);
  const [orderFiles, setOrderFiles] = useState<any[]>([]);
  const [viewFilesOrder, setViewFilesOrder] = useState<CustomOrder | null>(null);
  const [viewFilesDialogOpen, setViewFilesDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    order_number: "",
    order_date: new Date().toISOString().split('T')[0],
    customer_name: "",
    fabric: "",
    size: "",
    model: "",
    observations: "",
    registration_date: new Date().toISOString(),
    delivery_date: "",
    status: "Procesando",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_orders")
        .select(`
          *,
          custom_order_files(id)
        `)
        .order("order_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Mapear los datos para incluir el conteo de archivos
      const ordersWithFiles = (data || []).map((order: any) => ({
        ...order,
        files_count: order.custom_order_files?.length || 0
      }));
      
      setOrders(ordersWithFiles);
    } catch (error: any) {
      toast.error("Error al cargar encargos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_order_number');
      if (error) throw error;
      return data;
    } catch (error) {
      // Si falla la función, generar número manualmente
      const year = new Date().getFullYear();
      const existingOrders = orders.filter(o => o.order_number && o.order_number.startsWith(`ENC-${year}`));
      const maxNum = existingOrders.length > 0 
        ? Math.max(...existingOrders.map(o => {
            const match = o.order_number.match(/-(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          }))
        : 0;
      return `ENC-${year}-${String(maxNum + 1).padStart(4, '0')}`;
    }
  };

  const fetchOrderFiles = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("custom_order_files")
        .select("*")
        .eq("custom_order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrderFiles(data || []);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      setOrderFiles([]);
    }
  };

  const handleOpenDialog = async (order?: CustomOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        order_number: order.order_number,
        order_date: order.order_date,
        customer_name: order.customer_name,
        fabric: order.fabric || "",
        size: order.size || "",
        model: order.model || "",
        observations: order.observations || "",
        registration_date: order.registration_date,
        delivery_date: order.delivery_date || "",
        status: order.status || "Procesando",
      });
      await fetchOrderFiles(order.id);
    } else {
      setEditingOrder(null);
      setOrderFiles([]);
      const newOrderNumber = await generateOrderNumber();
      setFormData({
        order_number: newOrderNumber,
        order_date: new Date().toISOString().split('T')[0],
        customer_name: "",
        fabric: "",
        size: "",
        model: "",
        observations: "",
        registration_date: new Date().toISOString(),
        delivery_date: "",
        status: "Procesando",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderData = {
        order_number: formData.order_number,
        order_date: formData.order_date,
        customer_name: formData.customer_name,
        fabric: formData.fabric || null,
        size: formData.size || null,
        model: formData.model || null,
        observations: formData.observations || null,
        registration_date: formData.registration_date,
        delivery_date: formData.delivery_date || null,
        status: formData.status || "Procesando",
        created_by: user?.id || null,
      };

      if (editingOrder) {
        const { error } = await supabase
          .from("custom_orders")
          .update(orderData)
          .eq("id", editingOrder.id);

        if (error) throw error;
        toast.success("Encargo actualizado correctamente");
      } else {
        const { data: newOrder, error } = await supabase
          .from("custom_orders")
          .insert(orderData)
          .select()
          .single();

        if (error) throw error;
        toast.success("Encargo creado correctamente");
      }

      // Tras crear o actualizar, recargar lista y cerrar el formulario
      fetchOrders();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar el encargo");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("custom_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Estado actualizado correctamente");
      fetchOrders();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async () => {
    if (!deleteOrder) return;

    try {
      const { error } = await supabase
        .from("custom_orders")
        .delete()
        .eq("id", deleteOrder.id);

      if (error) throw error;
      toast.success("Encargo eliminado correctamente");
      
      // Si el encargo eliminado es el que se está editando, limpiar el estado
      if (editingOrder && editingOrder.id === deleteOrder.id) {
        setEditingOrder(null);
        setOrderFiles([]);
        setDialogOpen(false);
        resetForm();
      }
      
      setDeleteOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al eliminar el encargo");
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setOrderFiles([]);
    setFormData({
      order_number: "",
      order_date: new Date().toISOString().split('T')[0],
      customer_name: "",
      fabric: "",
      size: "",
      model: "",
      observations: "",
      registration_date: new Date().toISOString(),
      delivery_date: "",
      status: "Procesando",
    });
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.fabric && order.fabric.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.model && order.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusOption) return null;
    return (
      <Badge className={statusOption.color}>
        {statusOption.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando encargos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Encargos</h1>
          <p className="text-muted-foreground">Gestiona los encargos personalizados</p>
        </div>
        <PermissionGate permission="create_order">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-hero">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Encargo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? "Editar" : "Nuevo"} Encargo</DialogTitle>
                <DialogDescription>
                  Completa los datos del encargo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_number">Número de Encargo *</Label>
                    <Input
                      id="order_number"
                      value={formData.order_number}
                      onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                      required
                      placeholder="ENC-2025-0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_date">Fecha *</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={formData.order_date}
                      onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nombre *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fabric">Tejido</Label>
                    <Input
                      id="fabric"
                      value={formData.fabric}
                      onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                      placeholder="Tipo de tejido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Talla</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      placeholder="Talla"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Modelo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Procesando">Procesando</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration_date">Fecha de Registro *</Label>
                    <Input
                      id="registration_date"
                      type="datetime-local"
                      value={formData.registration_date.slice(0, 16)}
                      onChange={(e) => setFormData({ ...formData, registration_date: new Date(e.target.value).toISOString() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_date">Fecha de Entrega</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {editingOrder && editingOrder.id ? (
                    <FileUpload
                      orderId={editingOrder.id}
                      bucketName="custom-orders-files"
                      tableName="custom_order_files"
                      orderFieldName="custom_order_id"
                      files={orderFiles}
                      onFilesChange={() => editingOrder.id && fetchOrderFiles(editingOrder.id)}
                    />
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Guarda el encargo primero para poder subir archivos adjuntos.
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-hero">
                    {editingOrder ? "Actualizar" : "Crear"} Encargo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, nombre, tejido o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay encargos</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron encargos con ese criterio" : "Crea tu primer encargo"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{order.order_number}</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>Fecha: {formatDate(order.order_date)}</span>
                        {order.delivery_date && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Entrega: {formatDate(order.delivery_date)}</span>
                          </>
                        )}
                        {order.files_count && order.files_count > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {order.files_count} {order.files_count === 1 ? 'archivo' : 'archivos'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewFilesOrder(order);
                        setViewFilesDialogOpen(true);
                      }}
                      title="Ver archivos"
                    >
                      <Eye className="h-4 w-4" />
                      {order.files_count && order.files_count > 0 && (
                        <span className="ml-1 text-xs">({order.files_count})</span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(order)}
                      title="Editar encargo"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <PermissionGate permission="delete_order">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteOrder(order)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar encargo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  {/* Información del Encargo */}
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                        <p className="text-sm font-semibold">{order.customer_name}</p>
                      </div>
                      {order.fabric && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tejido</p>
                          <p className="text-sm">{order.fabric}</p>
                        </div>
                      )}
                      {order.size && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Talla</p>
                          <p className="text-sm">{order.size}</p>
                        </div>
                      )}
                      {order.model && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                          <p className="text-sm">{order.model}</p>
                        </div>
                      )}
                    </div>
                    {order.observations && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Observaciones</p>
                        <p className="text-sm">{order.observations}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Registrado: {formatDate(order.registration_date)}
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-4 xl:min-w-[240px]">
                    {/* Estado del Encargo */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Select 
                        value={order.status || "Procesando"} 
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Procesando">Procesando</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Files Dialog */}
      {viewFilesOrder && (
        <ViewFilesDialog
          open={viewFilesDialogOpen}
          onOpenChange={setViewFilesDialogOpen}
          orderId={viewFilesOrder.id}
          bucketName="custom-orders-files"
          tableName="custom_order_files"
          orderFieldName="custom_order_id"
          title={`Archivos de ${viewFilesOrder.order_number}`}
          onFilesChange={() => {
            fetchOrders();
            if (editingOrder && editingOrder.id === viewFilesOrder.id) {
              fetchOrderFiles(editingOrder.id);
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar encargo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el encargo "{deleteOrder?.order_number}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

