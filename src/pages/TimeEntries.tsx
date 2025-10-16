import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { useAutoNotifications } from "@/hooks/useAutoNotifications";
import { useUserRole } from "@/hooks/useUserRole";

interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  profiles: {
    full_name: string;
  };
}

export default function TimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  
  const { notifyCheckInOut } = useAutoNotifications();
  const { user } = useUserRole();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchTimeEntries();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user.id || null);
  };

  const fetchTimeEntries = async () => {
    if (!currentUserId) return;
    
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order("clock_in", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
      
      // Check for active entry for current user
      const active = data?.find(e => e.clock_out === null && e.user_id === currentUserId);
      setActiveEntry(active || null);
    } catch (error: any) {
      toast.error("Error al cargar fichajes");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const clockInTime = new Date().toISOString();
      
      const { error } = await supabase.from("time_entries").insert([{
        user_id: session?.user.id,
        clock_in: clockInTime,
      }]);

      if (error) throw error;
      
      // Enviar notificación automática de check-in
      console.log("User data:", user);
      
      // Obtener el nombre del usuario desde la tabla profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session?.user.id)
        .single();
      
      if (profile?.full_name) {
        console.log("Sending check-in notification for:", profile.full_name);
        const notificationResult = await notifyCheckInOut({
          employee_name: profile.full_name,
          time: new Date(clockInTime).toLocaleTimeString('es-ES'),
          location: "Tienda Centro",
          type: 'check_in'
        });
        console.log("Notification result:", notificationResult);
      } else {
        console.log("No profile found, skipping notification");
      }
      
      toast.success("Fichaje de entrada registrado");
      fetchTimeEntries();
    } catch (error: any) {
      toast.error("Error al registrar entrada");
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

    try {
      const clockOutTime = new Date().toISOString();
      const { error } = await supabase
        .from("time_entries")
        .update({ clock_out: clockOutTime })
        .eq("id", activeEntry.id);

      if (error) throw error;
      
      // Enviar notificación automática de check-out
      console.log("User data for check-out:", user);
      
      // Obtener el nombre del usuario desde la tabla profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();
      
      if (profile?.full_name) {
        console.log("Sending check-out notification for:", profile.full_name);
        const notificationResult = await notifyCheckInOut({
          employee_name: profile.full_name,
          time: new Date(clockOutTime).toLocaleTimeString('es-ES'),
          location: "Tienda Centro",
          type: 'check_out'
        });
        console.log("Check-out notification result:", notificationResult);
      } else {
        console.log("No profile found for check-out, skipping notification");
      }
      
      toast.success("Fichaje de salida registrado");
      fetchTimeEntries();
    } catch (error: any) {
      toast.error("Error al registrar salida");
    }
  };

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    try {
      const start = new Date(clockIn);
      const end = clockOut ? new Date(clockOut) : new Date();
      
      // Verificar que las fechas sean válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("Invalid date in calculateDuration:", { clockIn, clockOut });
        return "Error en cálculo";
      }
      
      const diff = end.getTime() - start.getTime();
      
      // Verificar que la diferencia sea positiva
      if (diff < 0) {
        console.warn("Negative time difference:", { clockIn, clockOut, diff });
        return "Error: tiempo negativo";
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error("Error in calculateDuration:", error, { clockIn, clockOut });
      return "Error en cálculo";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Fichajes</h1>
        <p className="text-muted-foreground">Registro de entradas y salidas</p>
      </div>

      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Control de Fichaje
          </CardTitle>
          <CardDescription>Registra tu entrada o salida</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          {!activeEntry ? (
            <Button onClick={handleClockIn} className="bg-gradient-hero flex-1" size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              Fichar Entrada
            </Button>
          ) : (
            <div className="flex-1 space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Entrada registrada a las:</p>
                <p className="text-2xl font-bold text-primary">
                  {new Date(activeEntry.clock_in).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tiempo transcurrido: {calculateDuration(activeEntry.clock_in, null)}
                </p>
              </div>
              <Button onClick={handleClockOut} variant="outline" className="w-full" size="lg">
                <LogOutIcon className="mr-2 h-5 w-5" />
                Fichar Salida
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Historial de Fichajes</h2>
        {entries.map((entry) => (
          <Card key={entry.id} className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{entry.profiles?.full_name || "Usuario"}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <LogIn className="h-4 w-4" />
                      {new Date(entry.clock_in).toLocaleString()}
                    </span>
                    {entry.clock_out && (
                      <span className="flex items-center gap-1">
                        <LogOutIcon className="h-4 w-4" />
                        {new Date(entry.clock_out).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {entry.clock_out ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Duración</p>
                      <p className="text-lg font-semibold text-primary">
                        {calculateDuration(entry.clock_in, entry.clock_out)}
                      </p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                      En curso
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {entries.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay fichajes registrados</h3>
            <p className="text-muted-foreground">Comienza fichando tu entrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
