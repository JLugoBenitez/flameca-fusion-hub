import { useConnectivity } from '@/hooks/useAppState';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectivityStatus() {
  const { isOnline } = useConnectivity();

  if (isOnline) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="h-3 w-3 mr-1" />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
      <WifiOff className="h-3 w-3 mr-1" />
      Sin conexión
    </Badge>
  );
}
