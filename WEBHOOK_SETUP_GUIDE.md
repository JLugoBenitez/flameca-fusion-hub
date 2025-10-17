# 🚀 Guía Completa de Webhooks - Actualización Automática

## 🎯 ¿Qué son los Webhooks?

Los **webhooks** son notificaciones **instantáneas** que WooCommerce envía a tu aplicación cuando ocurren cambios. Es como tener un "mensajero" que te avisa inmediatamente cuando:
- 📦 Se actualiza el stock de un producto
- 🛒 Se crea un nuevo pedido
- 💰 Cambia el estado de un pedido
- 📝 Se modifica cualquier producto

## ⚡ Ventajas de los Webhooks

✅ **Actualización instantánea** (0 segundos de retraso)  
✅ **No consume recursos** innecesarios  
✅ **Funciona automáticamente** sin botones  
✅ **Sincronización en tiempo real**  
✅ **No depende de intervalos** de tiempo  

## 🔧 Configuración en WooCommerce

### Paso 1: Acceder a la configuración
1. Ve a tu panel de **WordPress**
2. **WooCommerce** → **Configuración** → **Avanzado** → **Webhooks**
3. Haz clic en **"Añadir webhook"**

### Paso 2: Configurar Webhook Principal
```
Nombre: Flamenca Store Webhook
Estado: Activo
Tema: Todos
Evento: Todos los eventos
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024
```

### Paso 3: Configurar Webhooks Específicos (Opcional)
Si prefieres webhooks específicos, crea estos:

**Para Productos:**
```
Nombre: Stock Actualizado
Estado: Activo
Tema: Producto
Evento: Producto actualizado
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024
```

**Para Pedidos:**
```
Nombre: Nuevo Pedido
Estado: Activo
Tema: Pedido
Evento: Pedido creado
URL de entrega: http://127.0.0.1:54321/functions/v1/webhook-woocommerce
Secreto: flamenca-store-2024
```

## 🧪 Cómo Probar los Webhooks

### 1. Probar Producto
```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/webhook-woocommerce" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "product.updated",
    "data": {
      "id": 123,
      "name": "Producto de Prueba",
      "price": "29.99",
      "stock_quantity": 5,
      "stock_status": "instock",
      "sku": "TEST-123"
    }
  }'
```

### 2. Probar Pedido
```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/webhook-woocommerce" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order.created",
    "data": {
      "id": 456,
      "status": "pending",
      "total": "59.98",
      "billing": {
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan@example.com"
      }
    }
  }'
```

## 📱 URLs para Producción

Cuando despliegues a producción, cambia la URL a:
```
https://tu-dominio.com/functions/v1/webhook-woocommerce
```

## 🔍 Verificar que Funciona

### 1. En la App
- Ve a la sección **Productos**
- Cambia el stock en WooCommerce
- **¡Debería actualizarse instantáneamente!**

### 2. En la Terminal
Los logs aparecerán así:
```
🔔 Webhook recibido de WooCommerce
📦 Producto actualizado - sincronizando stock...
✅ Producto sincronizado correctamente
```

### 3. En la Base de Datos
```bash
curl -s "http://127.0.0.1:54321/rest/v1/products?select=name,stock_quantity" \
  -H "apikey: [tu-api-key]"
```

## 🚨 Solución de Problemas

### Webhook no funciona
1. ✅ Verifica que la URL sea correcta
2. ✅ Asegúrate de que las Edge Functions estén ejecutándose
3. ✅ Comprueba los logs en la terminal

### Stock no se actualiza
1. ✅ Verifica que el webhook esté **Activo** en WooCommerce
2. ✅ Comprueba que el **Secreto** sea correcto
3. ✅ Revisa los logs para errores

### Pedidos no aparecen
1. ✅ Verifica que el evento sea **"Pedido creado"**
2. ✅ Comprueba que la URL apunte a `webhook-woocommerce`
3. ✅ Revisa los logs para errores

## 🎉 ¡Listo!

Una vez configurado, **¡no necesitarás presionar ningún botón!** El stock y los pedidos se actualizarán automáticamente en tiempo real.

### Lo que verás:
- 📦 **Stock actualizado** instantáneamente
- 🛒 **Nuevos pedidos** aparecen automáticamente
- 💰 **Estados de pedidos** se sincronizan
- 🔄 **Todo funciona** sin intervención manual

**¡Tu tienda estará siempre sincronizada!** 🚀
