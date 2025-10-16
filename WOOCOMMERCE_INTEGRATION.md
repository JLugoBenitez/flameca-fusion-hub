# Integración con WooCommerce

## Problema Solucionado

El problema original era que la integración con WooCommerce solo funcionaba en una dirección: podías obtener productos desde WooCommerce, pero cuando creabas o actualizabas un producto en la aplicación, no se reflejaba en la web de WooCommerce.

## Soluciones Implementadas

### 1. Sincronización Automática al Crear/Actualizar Productos

Ahora cuando creas o actualizas un producto en la aplicación, automáticamente se sincroniza con WooCommerce:

- **Crear producto**: Se crea en WooCommerce y se guarda el ID de WooCommerce en la base de datos local
- **Actualizar producto**: Se actualiza el producto existente en WooCommerce
- **Indicador visual**: Los productos sincronizados muestran "✓ Sincronizado" en la interfaz

### 2. Sincronización Individual por Producto

Cada producto tiene un botón de sincronización individual (ícono de upload) que permite:
- Sincronizar productos específicos con WooCommerce
- Ver el estado de sincronización de cada producto

### 3. Sincronización Masiva

Se agregaron dos botones en la interfaz:
- **"Traer desde WooCommerce"**: Descarga todos los productos desde WooCommerce
- **"Enviar a WooCommerce"**: Sincroniza todos los productos locales que no estén sincronizados

### 4. Mejoras en el Backend

- **Logs detallados**: Se agregaron logs para depurar problemas de sincronización
- **Manejo de errores**: Mejor manejo de errores con mensajes específicos
- **Estado de publicación**: Los productos se crean como "publicados" en WooCommerce
- **Actualización de IDs**: Se guarda el ID de WooCommerce para futuras actualizaciones

## Configuración Requerida

Para que funcione la integración, necesitas configurar estas variables de entorno en Supabase:

```bash
WOOCOMMERCE_STORE_URL=https://tu-tienda.com
WOOCOMMERCE_CONSUMER_KEY=tu_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=tu_consumer_secret
```

## Cómo Usar

### Crear un Producto Nuevo
1. Haz clic en "Nuevo Producto"
2. Completa los datos del producto
3. Al guardar, se sincronizará automáticamente con WooCommerce
4. Verás el indicador "✓ Sincronizado" en la tarjeta del producto

### Actualizar un Producto Existente
1. Haz clic en "Editar" en el producto
2. Modifica los datos necesarios
3. Al guardar, se actualizará automáticamente en WooCommerce

### Sincronización Manual
- **Producto individual**: Usa el botón de upload (↑) en cada producto
- **Todos los productos**: Usa el botón "Enviar a WooCommerce"
- **Traer desde WooCommerce**: Usa el botón "Traer desde WooCommerce"

## Características Técnicas

### Campos Sincronizados
- Nombre del producto
- Descripción
- Precio
- Stock
- SKU
- Categoría
- Estado: Publicado

### Flujo de Sincronización
1. Se guarda el producto en la base de datos local
2. Se llama a la función `sync-woocommerce-products` con `action: "sync_to_woocommerce"`
3. Se crea/actualiza el producto en WooCommerce
4. Se guarda el ID de WooCommerce en la base de datos local
5. Se actualiza la interfaz con el estado de sincronización

### Manejo de Errores
- Si falla la sincronización, el producto se guarda localmente
- Se muestran mensajes de error específicos
- Se mantiene un log detallado para depuración

## Verificación

Para verificar que la sincronización funciona:

1. Crea un producto en la aplicación
2. Verifica que aparece en tu tienda de WooCommerce
3. Actualiza el producto en la aplicación
4. Verifica que los cambios se reflejan en WooCommerce
5. El producto debe mostrar "✓ Sincronizado" en la interfaz
