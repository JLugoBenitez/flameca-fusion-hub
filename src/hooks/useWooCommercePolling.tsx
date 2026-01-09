import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAutoNotifications } from './useAutoNotifications';

interface WooCommerceOrder {
  id: number;
  status: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  total: string;
  line_items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  stock_quantity: number;
  price: string;
  sku: string;
  stock_status: string;
}

export const useWooCommercePolling = () => {
  const { addNotification } = useNotificationContext();
  const { notifyNewOrder } = useAutoNotifications();
  const lastOrderId = useRef<number | null>(null);
  const lastProductStocks = useRef<Map<number, number>>(new Map());
  const isPolling = useRef(false);

  useEffect(() => {
    const pollWooCommerce = async () => {
      if (isPolling.current) return;
      isPolling.current = true;

      try {
        
        // Llamar a nuestra Edge Function que consulta WooCommerce usando Supabase client
        const { data, error } = await supabase.functions.invoke('sync-woocommerce-orders', {
          body: {
            action: 'get_recent_orders',
            limit: 5
          }
        });

        if (error) {
          console.error('Error consultando WooCommerce:', error);
          return;
        }
        
        if (data && data.success && data.orders) {
          const orders: WooCommerceOrder[] = data.orders;
          
          // Buscar pedidos nuevos
          for (const order of orders) {
            if (lastOrderId.current === null) {
              // Primera vez, solo guardar el último ID
              lastOrderId.current = order.id;
              console.log('📝 Inicializando con último pedido:', order.id);
              break;
            }
            
            if (order.id > lastOrderId.current) {
              console.log('🆕 Nuevo pedido encontrado:', order.id);
              
              // Sincronizar el pedido a la base de datos local
              try {
                const { error: syncError } = await supabase.functions.invoke('sync-woocommerce-orders', {
                  body: {
                    action: 'sync_single_order',
                    orderId: order.id
                  }
                });
                
                if (syncError) {
                  console.error('❌ Error sincronizando pedido:', order.id, syncError);
                }
              } catch (error) {
                console.error('❌ Error en sincronización:', error);
              }
              
              // Crear notificación local
              addNotification({
                type: 'new_order',
                title: '🛍️ Nuevo Pedido WooCommerce',
                message: `Pedido #${order.id} de ${order.billing.first_name} ${order.billing.last_name} - Total: €${order.total}`,
                section: 'orders'
              });
              
              // Enviar notificaciones móviles
              try {
                await notifyNewOrder({
                  order_id: order.id.toString(),
                  customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
                  total_amount: parseFloat(order.total),
                  items: order.line_items.map(item => ({
                    name: item.name,
                    quantity: item.quantity
                  }))
                });
              } catch (error) {
                console.error('❌ Error enviando notificaciones móviles:', error);
              }
              
              // Actualizar el último ID conocido
              lastOrderId.current = order.id;
            }
          }
        }

        // Consultar productos para verificar stock
        const { data: productsData, error: productsError } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: {
            action: 'get_products',
            limit: 20
          }
        });

        if (!productsError && productsData && productsData.data) {
          const products: WooCommerceProduct[] = productsData.data;
          
          for (const product of products) {
            const lastStock = lastProductStocks.current.get(product.id);
            
            if (lastStock !== undefined) {
              // Verificar cambios de stock
              if (product.stock_quantity !== lastStock) {
                
                let notificationType = '';
                let title = '';
                let message = '';
                
                if (product.stock_quantity === 0) {
                  // Stock agotado
                  notificationType = 'out_of_stock';
                  title = '🚨 Stock Agotado';
                  message = `Producto "${product.name}" se ha agotado`;
                } else if (product.stock_quantity <= 2) {
                  // Stock bajo
                  notificationType = 'low_stock';
                  title = '⚠️ Stock Bajo';
                  message = `Producto "${product.name}" tiene solo ${product.stock_quantity} unidades`;
                } else if (lastStock === 0 && product.stock_quantity > 0) {
                  // Stock restaurado
                  notificationType = 'low_stock';
                  title = '✅ Stock Restaurado';
                  message = `Producto "${product.name}" tiene ${product.stock_quantity} unidades disponibles`;
                }
                
                if (notificationType) {
                  addNotification({
                    type: notificationType as any,
                    title,
                    message,
                    section: 'products'
                  });
                }
              }
            }
            
            // Actualizar el stock conocido
            lastProductStocks.current.set(product.id, product.stock_quantity);
          }
        }

      } catch (error) {
        console.error('Error en polling de WooCommerce:', error);
      } finally {
        isPolling.current = false;
      }
    };

    // Polling cada 10 segundos
    const interval = setInterval(pollWooCommerce, 10000);
    
    // Ejecutar inmediatamente al montar
    pollWooCommerce();

    return () => clearInterval(interval);
  }, [addNotification]);
};
