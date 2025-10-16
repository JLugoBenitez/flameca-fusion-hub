import { useEffect, useRef, useState } from 'react';

interface AutoRefreshOptions {
  interval?: number; // en milisegundos
  enabled?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export const useAutoRefresh = ({
  interval = 30000, // 30 segundos por defecto
  enabled = true,
  onRefresh
}: AutoRefreshOptions = {}) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const [currentSettings, setCurrentSettings] = useState({
    enabled,
    interval
  });

  // Escuchar cambios de configuración
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const newSettings = event.detail;
      setCurrentSettings({
        enabled: newSettings.enabled,
        interval: newSettings.ordersInterval || interval // Usar ordersInterval como intervalo general
      });
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, [interval]);

  useEffect(() => {
    if (!currentSettings.enabled || !onRefresh) return;

    // Limpiar intervalo existente
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Auto-refresh silencioso
    intervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh silencioso...');
        await onRefresh();
      } catch (error) {
        console.error('Error en auto-refresh:', error);
      }
    }, currentSettings.interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSettings, onRefresh]);

  return {
    startAutoRefresh: () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (onRefresh) {
        intervalRef.current = setInterval(onRefresh, currentSettings.interval);
      }
    },
    stopAutoRefresh: () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };
};
