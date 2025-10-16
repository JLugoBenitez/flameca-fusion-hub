import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, AlertCircle, User, Clock, FileText, Calendar, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

type IncidentType = "absence" | "delay" | "complaint" | "other";
type IncidentStatus = "open" | "in_review" | "resolved" | "closed";

interface Incident {
  id: string;
  user_id: string;
  type: IncidentType;
  status: IncidentStatus;
  title: string;
  description: string | null;
  resolution: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const typeLabels = {
  absence: "Ausencia",
  delay: "Retraso",
  complaint: "Queja",
  other: "Otro",
};

const statusLabels = {
  open: "Abierta",
  in_review: "En Revisión",
  resolved: "Resuelta",
  closed: "Cerrada",
};

const statusColors = {
  open: "bg-red-500",
  in_review: "bg-yellow-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

const typeIcons = {
  absence: "🚫",
  delay: "⏰",
  complaint: "😠",
  other: "📋",
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "other" as IncidentType,
  });

  useEffect(() => {
    fetchIncidents();
  }, []);


  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          profiles!incidents_user_id_fkey (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error: any) {
      toast.error("Error al cargar incidencias");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const incidentData = {
        user_id: session?.user.id,
        reported_by: session?.user.id,
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        status: "open" as IncidentStatus,
      };

      const { error } = await supabase.from("incidents").insert([incidentData]);

      if (error) throw error;
      toast.success("Incidencia registrada correctamente");
      setDialogOpen(false);
      resetForm();
      fetchIncidents();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar incidencia");
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: IncidentStatus) => {
    try {
      console.log("Updating incident status:", { incidentId, newStatus, isUsingSampleData });
      
      // Si estamos usando datos de ejemplo, solo actualizar el estado local
      if (isUsingSampleData) {
        console.log("Using sample data, updating local state");
        setSampleIncidentsState(prevIncidents => 
          prevIncidents.map(incident => 
            incident.id === incidentId 
              ? { ...incident, status: newStatus }
              : incident
          )
        );
        toast.success("Estado actualizado correctamente");
        return;
      }

      // Si hay datos reales, actualizar en la base de datos
      const { error } = await supabase
        .from("incidents")
        .update({ status: newStatus })
        .eq("id", incidentId);

      if (error) throw error;
      toast.success("Estado actualizado correctamente");
      fetchIncidents();
    } catch (error: any) {
      toast.error("Error al actualizar estado");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "other",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case 'open': return '🔴';
      case 'in_review': return '🟡';
      case 'resolved': return '🟢';
      case 'closed': return '⚫';
      default: return '⚪';
    }
  };

  // Datos de ejemplo para mostrar la página funcionando
  const sampleIncidents: Incident[] = [
    {
      id: "1",
      user_id: "user1",
      type: "delay",
      status: "open",
      title: "Retraso en la entrega de pedidos",
      description: "El empleado llegó 30 minutos tarde y esto afectó la preparación de los pedidos del día.",
      resolution: null,
      created_at: "2025-10-15T10:30:00Z",
      profiles: { full_name: "María García" }
    },
    {
      id: "2",
      user_id: "user2",
      type: "complaint",
      status: "in_review",
      title: "Queja de cliente sobre atención",
      description: "Cliente reportó mala atención por parte del personal. Se requiere investigación.",
      resolution: null,
      created_at: "2025-10-15T09:15:00Z",
      profiles: { full_name: "Carlos López" }
    },
    {
      id: "3",
      user_id: "user3",
      type: "absence",
      status: "resolved",
      title: "Ausencia no justificada",
      description: "Empleado no se presentó al trabajo sin avisar. Se contactó y se resolvió el problema.",
      resolution: "Se estableció protocolo de comunicación para futuras ausencias.",
      created_at: "2025-10-14T16:45:00Z",
      profiles: { full_name: "Ana Rodríguez" }
    }
  ];

  // Estado para manejar los datos de ejemplo cuando no hay datos reales
  const [sampleIncidentsState, setSampleIncidentsState] = useState<Incident[]>(sampleIncidents);
  
  // Usar datos de muestra si no hay datos reales
  const displayIncidents = incidents.length > 0 ? incidents : sampleIncidentsState;
  const isUsingSampleData = incidents.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Incidencias
        </h1>
        <p className="text-muted-foreground text-lg">Registro y seguimiento de incidencias laborales</p>
      </div>

      {/* Nueva Incidencia Card */}
      <Card className="shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            Gestión de Incidencias
          </CardTitle>
          <CardDescription>Registra y gestiona las incidencias laborales del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-hero" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Nueva Incidencia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Incidencia</DialogTitle>
                <DialogDescription>Registra una nueva incidencia laboral</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Incidencia *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as IncidentType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{typeIcons[key as keyof typeof typeIcons]}</span>
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Describe brevemente la incidencia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Proporciona detalles adicionales sobre la incidencia"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-hero">Registrar Incidencia</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Lista de Incidencias */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Lista de Incidencias</h2>
            <p className="text-sm text-muted-foreground">
              {displayIncidents.length} {displayIncidents.length === 1 ? 'incidencia' : 'incidencias'} registradas
            </p>
          </div>
          {incidents.length === 0 && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              📋 Mostrando datos de ejemplo
            </div>
          )}
        </div>
        
        {displayIncidents.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay incidencias registradas</h3>
              <p className="text-muted-foreground">Comienza registrando la primera incidencia</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayIncidents.map((incident, index) => (
              <Card 
                key={incident.id} 
                className="shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                    {/* Información de la Incidencia */}
                    <div className="space-y-4 flex-1">
                      {/* Header de la Incidencia */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-2xl">{typeIcons[incident.type]}</span>
                            </div>
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                              incident.status === 'open' ? 'bg-red-500' :
                              incident.status === 'in_review' ? 'bg-yellow-500' :
                              incident.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                          </div>
                          <div>
                            <p className="font-semibold text-xl">{incident.title}</p>
                            <p className="text-sm text-muted-foreground">{incident.profiles?.full_name || "Usuario"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            incident.status === 'open' ? 'bg-red-100 text-red-800' :
                            incident.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                            incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusIcon(incident.status)} {statusLabels[incident.status]}
                          </div>
                        </div>
                      </div>
                      
                      {/* Grid de Información */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Reportado por</p>
                            <p className="font-medium">{incident.profiles?.full_name || "Usuario"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <p className="font-medium">{typeLabels[incident.type]}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Fecha</p>
                            <p className="font-medium">{formatDateTime(incident.created_at)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Estado</p>
                            <p className="font-medium">{statusLabels[incident.status]}</p>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      {incident.description && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Descripción de la Incidencia</p>
                              <p className="text-sm text-blue-700 mt-1">{incident.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resolución */}
                      {incident.resolution && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Resolución</p>
                              <p className="text-sm text-green-700 mt-1">{incident.resolution}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row xl:flex-col gap-4 xl:min-w-[240px]">
                      {/* Estado de la Incidencia */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Cambiar Estado</p>
                        <Select 
                          value={incident.status} 
                          onValueChange={(value) => updateIncidentStatus(incident.id, value as IncidentStatus)}
                        >
                          <SelectTrigger className="w-full h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">🔴 Abierta</SelectItem>
                            <SelectItem value="in_review">🟡 En Revisión</SelectItem>
                            <SelectItem value="resolved">🟢 Resuelta</SelectItem>
                            <SelectItem value="closed">⚫ Cerrada</SelectItem>
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
      </div>
    </div>
  );
}