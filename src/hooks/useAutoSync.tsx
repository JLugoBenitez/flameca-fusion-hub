import { useEffect, useRef, useState } from 'react';
import { useWooCommerceOrders } from './useWooCommerceOrders';
import { useWooCommerceProducts } from './useWooCommerceProducts';

interface UseAutoSyncOptions {
  ordersInterval?: number; // en milisegundos
  productsInterval?: number; // en milisegundos
  enabled?: boolean;
}

export const useAutoSync = ({
  ordersInterval = 30000, // 30 segundos
  productsInterval = 60000, // 1 minuto
  enabled = true
}: UseAutoSyncOptions = {}) => {
  const { syncNewOrders } = useWooCommerceOrders();
  const { syncProducts } = useWooCommerceProducts();
  
  const ordersIntervalRef = useRef<NodeJS.Timeout>();
  const productsIntervalRef = useRef<NodeJS.Timeout>();
  
  // Estado para escuchar cambios de configuración
  const [currentSettings, setCurrentSettings] = useState({
    enabled,
    ordersInterval,
    productsInterval
  });

  // Escuchar cambios de configuración
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const newSettings = event.detail;
      setCurrentSettings(newSettings);
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!currentSettings.enabled) return;

    // Limpiar intervalos existentes
    if (ordersIntervalRef.current) clearInterval(ordersIntervalRef.current);
    if (productsIntervalRef.current) clearInterval(productsIntervalRef.current);

    // Sincronización automática de pedidos
    ordersIntervalRef.current = setInterval(async () => {
      try {
        await syncNewOrders();
      } catch (error) {
        console.error('Error en sincronización automática de pedidos:', error);
      }
    }, currentSettings.ordersInterval);

    // Sincronización automática de productos
    productsIntervalRef.current = setInterval(async () => {
      try {
        await syncProducts();
      } catch (error) {
        console.error('Error en sincronización automática de productos:', error);
      }
    }, currentSettings.productsInterval);

    return () => {
      if (ordersIntervalRef.current) {
        clearInterval(ordersIntervalRef.current);
      }
      if (productsIntervalRef.current) {
        clearInterval(productsIntervalRef.current);
      }
    };
  }, [currentSettings, syncNewOrders, syncProducts]);

  return {
    startAutoSync: () => {
      // Reiniciar intervalos
      if (ordersIntervalRef.current) clearInterval(ordersIntervalRef.current);
      if (productsIntervalRef.current) clearInterval(productsIntervalRef.current);
      
      ordersIntervalRef.current = setInterval(syncNewOrders, ordersInterval);
      productsIntervalRef.current = setInterval(syncProducts, productsInterval);
    },
    stopAutoSync: () => {
      if (ordersIntervalRef.current) clearInterval(ordersIntervalRef.current);
      if (productsIntervalRef.current) clearInterval(productsIntervalRef.current);
    }
  };
};
