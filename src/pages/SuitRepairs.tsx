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
import { Plus, Edit, Trash2, Scissors, Search, Loader2, Calendar, RefreshCw, Paperclip, Eye } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { useUserRole } from "@/hooks/useUserRole";
import { FileUpload } from "@/components/FileUpload";
import { ViewFilesDialog } from "@/components/ViewFilesDialog";

interface SuitRepair {
  id: string;
  repair_number: string;
  repair_date: string;
  customer_name: string;
  garment_type: string | null;
  repair_type: string | null;
  size: string | null;
  observations: string | null;
  registration_date: string;
  delivery_date: string | null;
  status: string;
  price: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  files_count?: number;
}

const GARMENT_TYPES = [
  "Vestido",
  "Traje",
  "Chaqueta",
  "Falda",
  "Blusa",
  "Pantalón",
  "Otro"
];

const REPAIR_TYPES = [
  "Arreglo de manga",
  "Bajada de dobladillo",
  "Subida de dobladillo",
  "Arreglo de cintura",
  "Arreglo de espalda",
  "Arreglo de pecho",
  "Cambio de cremallera",
  "Arreglo de botones",
  "Otro"
];

const STATUS_OPTIONS = [
  { value: "Procesando", label: "Procesando", color: "bg-blue-500" },
  { value: "Completado", label: "Completado", color: "bg-green-500" },
];

export default function SuitRepairs() {
  const { user } = useUserRole();
  const [repairs, setRepairs] = useState<SuitRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<SuitRepair | null>(null);
  const [deleteRepair, setDeleteRepair] = useState<SuitRepair | null>(null);
  const [repairFiles, setRepairFiles] = useState<any[]>([]);
  const [viewFilesRepair, setViewFilesRepair] = useState<SuitRepair | null>(null);
  const [viewFilesDialogOpen, setViewFilesDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    repair_number: "",
    repair_date: new Date().toISOString().split('T')[0],
    customer_name: "",
    garment_type: "",
    repair_type: "",
    size: "",
    observations: "",
    registration_date: new Date().toISOString(),
    delivery_date: "",
    price: "",
    status: "Procesando",
  });

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("suit_repairs")
        .select(`
          *,
          suit_repair_files(id)
        `)
        .order("repair_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Mapear los datos para incluir el conteo de archivos
      const repairsWithFiles = (data || []).map((repair: any) => ({
        ...repair,
        files_count: repair.suit_repair_files?.length || 0
      }));
      
      setRepairs(repairsWithFiles);
    } catch (error: any) {
      toast.error("Error al cargar arreglos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepairFiles = async (repairId: string) => {
    try {
      const { data, error } = await supabase
        .from("suit_repair_files")
        .select("*")
        .eq("suit_repair_id", repairId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRepairFiles(data || []);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      setRepairFiles([]);
    }
  };

  const generateRepairNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_repair_number');
      if (error) throw error;
      return data;
    } catch (error) {
      // Si falla la función, generar número manualmente
      const year = new Date().getFullYear();
      const existingRepairs = repairs.filter(r => r.repair_number && r.repair_number.startsWith(`ARR-${year}`));
      const maxNum = existingRepairs.length > 0 
        ? Math.max(...existingRepairs.map(r => {
            const match = r.repair_number.match(/-(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          }))
        : 0;
      return `ARR-${year}-${String(maxNum + 1).padStart(4, '0')}`;
    }
  };

  const handleOpenDialog = async (repair?: SuitRepair) => {
    if (repair) {
      setEditingRepair(repair);
      setFormData({
        repair_number: repair.repair_number,
        repair_date: repair.repair_date,
        customer_name: repair.customer_name,
        garment_type: repair.garment_type || "",
        repair_type: repair.repair_type || "",
        size: repair.size || "",
        observations: repair.observations || "",
        registration_date: repair.registration_date,
        delivery_date: repair.delivery_date || "",
        price: repair.price?.toString() || "",
        status: repair.status || "Procesando",
      });
      await fetchRepairFiles(repair.id);
    } else {
      setEditingRepair(null);
      setRepairFiles([]);
      const newRepairNumber = await generateRepairNumber();
      setFormData({
        repair_number: newRepairNumber,
        repair_date: new Date().toISOString().split('T')[0],
        customer_name: "",
        garment_type: "",
        repair_type: "",
        size: "",
        observations: "",
        registration_date: new Date().toISOString(),
        delivery_date: "",
        price: "",
        status: "Procesando",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const repairData = {
        repair_number: formData.repair_number,
        repair_date: formData.repair_date,
        customer_name: formData.customer_name,
        garment_type: formData.garment_type || null,
        repair_type: formData.repair_type || null,
        size: formData.size || null,
        observations: formData.observations || null,
        registration_date: formData.registration_date,
        delivery_date: formData.delivery_date || null,
        status: formData.status || "Procesando",
        price: formData.price ? parseFloat(formData.price) : 0,
        created_by: user?.id || null,
      };

      if (editingRepair) {
        const { error } = await supabase
          .from("suit_repairs")
          .update(repairData)
          .eq("id", editingRepair.id);

        if (error) throw error;
        toast.success("Arreglo actualizado correctamente");
      } else {
        const { data: newRepair, error } = await supabase
          .from("suit_repairs")
          .insert(repairData)
          .select()
          .single();

        if (error) throw error;
        toast.success("Arreglo creado correctamente");
      }

      // Tras crear o actualizar, recargar lista y cerrar el formulario
      fetchRepairs();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar el arreglo");
    }
  };

  const updateRepairStatus = async (repairId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("suit_repairs")
        .update({ status: newStatus })
        .eq("id", repairId);

      if (error) throw error;
      toast.success("Estado actualizado correctamente");
      fetchRepairs();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async () => {
    if (!deleteRepair) return;

    try {
      const { error } = await supabase
        .from("suit_repairs")
        .delete()
        .eq("id", deleteRepair.id);

      if (error) throw error;
      toast.success("Arreglo eliminado correctamente");
      
      // Si el arreglo eliminado es el que se está editando, limpiar el estado
      if (editingRepair && editingRepair.id === deleteRepair.id) {
        setEditingRepair(null);
        setRepairFiles([]);
        setDialogOpen(false);
        resetForm();
      }
      
      setDeleteRepair(null);
      fetchRepairs();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al eliminar el arreglo");
    }
  };

  const resetForm = () => {
    setEditingRepair(null);
    setRepairFiles([]);
    setFormData({
      repair_number: "",
      repair_date: new Date().toISOString().split('T')[0],
      customer_name: "",
      garment_type: "",
      repair_type: "",
      size: "",
      observations: "",
      registration_date: new Date().toISOString(),
      delivery_date: "",
      price: "",
      status: "Procesando",
    });
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = 
      repair.repair_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repair.garment_type && repair.garment_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (repair.repair_type && repair.repair_type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "0,00 €";
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
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
          <p className="text-muted-foreground">Cargando arreglos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Arreglos de Trajes</h1>
          <p className="text-muted-foreground">Gestiona los arreglos de trajes y prendas</p>
        </div>
        <PermissionGate permission="create_order">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-hero">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Arreglo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRepair ? "Editar" : "Nuevo"} Arreglo</DialogTitle>
                <DialogDescription>
                  Completa los datos del arreglo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="repair_number">Número de Arreglo *</Label>
                    <Input
                      id="repair_number"
                      value={formData.repair_number}
                      onChange={(e) => setFormData({ ...formData, repair_number: e.target.value })}
                      required
                      placeholder="ARR-2025-0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repair_date">Fecha *</Label>
                    <Input
                      id="repair_date"
                      type="date"
                      value={formData.repair_date}
                      onChange={(e) => setFormData({ ...formData, repair_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nombre del Cliente *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="garment_type">Tipo de Prenda</Label>
                    <Select
                      value={formData.garment_type}
                      onValueChange={(value) => setFormData({ ...formData, garment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de prenda" />
                      </SelectTrigger>
                      <SelectContent>
                        {GARMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repair_type">Tipo de Arreglo</Label>
                    <Select
                      value={formData.repair_type}
                      onValueChange={(value) => setFormData({ ...formData, repair_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de arreglo" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAIR_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="price">Precio (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
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
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {editingRepair && editingRepair.id ? (
                    <FileUpload
                      orderId={editingRepair.id}
                      bucketName="suit-repairs-files"
                      tableName="suit_repair_files"
                      orderFieldName="suit_repair_id"
                      files={repairFiles}
                      onFilesChange={() => editingRepair.id && fetchRepairFiles(editingRepair.id)}
                    />
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Guarda el arreglo primero para poder subir archivos adjuntos.
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-hero">
                    {editingRepair ? "Actualizar" : "Crear"} Arreglo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, nombre, tipo de prenda o arreglo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchRepairs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Repairs List */}
      {filteredRepairs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scissors className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay arreglos</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? "No se encontraron arreglos con ese criterio" : "Crea tu primer arreglo"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRepairs.map((repair) => (
            <Card key={repair.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{repair.repair_number}</CardTitle>
                      {getStatusBadge(repair.status)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>Fecha: {formatDate(repair.repair_date)}</span>
                        {repair.delivery_date && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Entrega: {formatDate(repair.delivery_date)}</span>
                          </>
                        )}
                        {repair.price && repair.price > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">{formatCurrency(repair.price)}</span>
                          </>
                        )}
                        {repair.files_count && repair.files_count > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {repair.files_count} {repair.files_count === 1 ? 'archivo' : 'archivos'}
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
                        setViewFilesRepair(repair);
                        setViewFilesDialogOpen(true);
                      }}
                      title="Ver archivos"
                    >
                      <Eye className="h-4 w-4" />
                      {repair.files_count && repair.files_count > 0 && (
                        <span className="ml-1 text-xs">({repair.files_count})</span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(repair)}
                      title="Editar arreglo"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <PermissionGate permission="delete_order">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteRepair(repair)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar arreglo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  {/* Información del Arreglo */}
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                        <p className="text-sm font-semibold">{repair.customer_name}</p>
                      </div>
                      {repair.garment_type && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo de Prenda</p>
                          <p className="text-sm">{repair.garment_type}</p>
                        </div>
                      )}
                      {repair.repair_type && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo de Arreglo</p>
                          <p className="text-sm">{repair.repair_type}</p>
                        </div>
                      )}
                      {repair.size && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Talla</p>
                          <p className="text-sm">{repair.size}</p>
                        </div>
                      )}
                    </div>
                    {repair.observations && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Observaciones</p>
                        <p className="text-sm">{repair.observations}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Registrado: {formatDate(repair.registration_date)}
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-4 xl:min-w-[240px]">
                    {/* Estado del Arreglo */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Select 
                        value={repair.status || "Procesando"} 
                        onValueChange={(value) => updateRepairStatus(repair.id, value)}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
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
      {viewFilesRepair && (
        <ViewFilesDialog
          open={viewFilesDialogOpen}
          onOpenChange={setViewFilesDialogOpen}
          orderId={viewFilesRepair.id}
          bucketName="suit-repairs-files"
          tableName="suit_repair_files"
          orderFieldName="suit_repair_id"
          title={`Archivos de ${viewFilesRepair.repair_number}`}
          onFilesChange={() => {
            fetchRepairs();
            if (editingRepair && editingRepair.id === viewFilesRepair.id) {
              fetchRepairFiles(editingRepair.id);
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRepair} onOpenChange={() => setDeleteRepair(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar arreglo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el arreglo "{deleteRepair?.repair_number}". Esta acción no se puede deshacer.
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

