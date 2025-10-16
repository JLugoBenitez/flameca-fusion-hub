import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Clock, Package, ShoppingCart } from 'lucide-react';

interface AutoSyncSettingsProps {
  enabled: boolean;
  ordersInterval: number;
  productsInterval: number;
  onToggle: (enabled: boolean) => void;
  onUpdateIntervals: (orders: number, products: number) => void;
}

export function AutoSyncSettings({
  enabled,
  ordersInterval,
  productsInterval,
  onToggle,
  onUpdateIntervals
}: AutoSyncSettingsProps) {
  const [tempOrdersInterval, setTempOrdersInterval] = useState(ordersInterval / 1000); // en segundos
  const [tempProductsInterval, setTempProductsInterval] = useState(productsInterval / 1000); // en segundos

  const handleSave = () => {
    onUpdateIntervals(
      tempOrdersInterval * 1000, // convertir a milisegundos
      tempProductsInterval * 1000
    );
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Sincronización Automática
        </CardTitle>
        <CardDescription>
          Configura la sincronización automática con WooCommerce
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync" className="text-base font-medium">
              Sincronización Automática
            </Label>
            <p className="text-sm text-muted-foreground">
              Actualiza automáticamente pedidos y productos desde WooCommerce
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>

        {enabled && (
          <>
            {/* Intervalos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pedidos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Pedidos
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="10"
                    max="3600"
                    value={tempOrdersInterval}
                    onChange={(e) => setTempOrdersInterval(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">segundos</span>
                  <Badge variant="outline">
                    {formatInterval(tempOrdersInterval)}
                  </Badge>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="30"
                    max="7200"
                    value={tempProductsInterval}
                    onChange={(e) => setTempProductsInterval(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">segundos</span>
                  <Badge variant="outline">
                    {formatInterval(tempProductsInterval)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <Button onClick={handleSave} className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>

            {/* Estado actual */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Estado Actual:</h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Pedidos: {formatInterval(ordersInterval / 1000)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Productos: {formatInterval(productsInterval / 1000)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
