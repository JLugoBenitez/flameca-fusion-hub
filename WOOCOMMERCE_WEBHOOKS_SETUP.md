n# Configuración de Webhooks de WooCommerce

## ¿Qué son los Webhooks?
Los webhooks son notificaciones automáticas que WooCommerce envía a tu aplicación cuando ocurren eventos específicos (nuevo pedido, stock actualizado, etc.).

## Configuración en WooCommerce

### 1. Acceder a la configuración
- Ve a tu panel de WordPress
- WooCommerce → Configuración → Avanzado → Webhooks
- Haz clic en "Añadir webhook"

### 2. Configurar Webhook Único (Recomendado)
```
Nombre: Flamenca Store Webhook
Estado: Activo
Tema: Todos
Evento: Todos los eventos
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024
```

### 3. Configurar Webhooks Específicos (Alternativo)
```
Nombre: Nuevo Pedido Flamenca Store
Estado: Activo
Tema: Pedido
Evento: Pedido creado
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024

Nombre: Stock Actualizado Flamenca Store
Estado: Activo
Tema: Producto
Evento: Producto actualizado
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024

Nombre: Estado Pedido Flamenca Store
Estado: Activo
Tema: Pedido
Evento: Pedido actualizado
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024
```

## URLs para Producción
Cuando despliegues a producción, cambia las URLs a:
- `https://tu-dominio.com/functions/v1/webhook-woocommerce`

## Ventajas
✅ Sincronización instantánea
✅ No consume recursos innecesarios
✅ Actualizaciones en tiempo real
✅ Funciona con cualquier cambio en WooCommerce
