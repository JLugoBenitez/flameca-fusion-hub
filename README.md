# 🎭 Flamenca Store

> **Sistema de gestión integral para tiendas de trajes de flamenca**

Una aplicación web moderna y completa para la gestión de tiendas especializadas en trajes de flamenca, desarrollada con las últimas tecnologías web.

## ✨ Características Principales

### 🏪 **Gestión de Productos**
- Catálogo completo de productos con integración WooCommerce
- Control de stock en tiempo real
- Gestión de categorías y precios
- Sincronización automática con tienda online

### 🛒 **Punto de Venta (TPV)**
- Interfaz intuitiva para ventas
- Múltiples métodos de pago
- Gestión de descuentos y promociones
- Impresión de tickets y facturas

### 📋 **Gestión de Pedidos**
- Creación y seguimiento de encargos
- Estados de pedido en tiempo real
- Gestión de clientes
- Historial completo de transacciones

### 👥 **Gestión de Empleados**
- Control de acceso por roles
- Sistema de fichajes
- Gestión de incidencias
- Reportes de productividad

### 📊 **Dashboard y Reportes**
- Métricas en tiempo real
- Análisis de ventas
- Alertas de stock bajo
- KPIs del negocio

## 🚀 Tecnologías Utilizadas

### **Frontend**
- **React 18** - Biblioteca de UI moderna
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Framework de CSS utility-first
- **shadcn/ui** - Componentes de UI elegantes
- **Radix UI** - Componentes primitivos accesibles

### **Backend y Servicios**
- **Supabase** - Backend como servicio (BaaS)
- **PostgreSQL** - Base de datos relacional
- **Edge Functions** - Funciones serverless
- **WooCommerce API** - Integración con tienda online
- **Holded API** - Integración con facturación

### **Estado y Datos**
- **TanStack Query** - Manejo de estado del servidor
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **React Router DOM** - Enrutamiento

### **UI/UX**
- **Lucide React** - Iconos modernos
- **Sonner** - Notificaciones elegantes
- **Framer Motion** - Animaciones fluidas
- **Responsive Design** - Adaptable a todos los dispositivos

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base de shadcn/ui
│   ├── AppSidebar.tsx  # Barra lateral de navegación
│   ├── ErrorBoundary.tsx # Manejo de errores
│   ├── LoadingSpinner.tsx # Componentes de carga
│   └── ConnectivityStatus.tsx # Estado de conexión
├── pages/              # Páginas de la aplicación
│   ├── Dashboard.tsx   # Panel principal
│   ├── Products.tsx    # Gestión de productos
│   ├── PointOfSale.tsx # TPV
│   ├── Orders.tsx      # Gestión de pedidos
│   ├── Employees.tsx   # Gestión de empleados
│   └── ...
├── hooks/              # Hooks personalizados
│   ├── useWooCommerceProducts.tsx # Hook para productos
│   ├── useUserRole.tsx # Hook para roles de usuario
│   ├── useNotifications.tsx # Hook para notificaciones
│   └── useAppState.tsx # Estado global de la app
├── lib/                # Utilidades y configuraciones
│   ├── constants.ts    # Constantes de la aplicación
│   ├── permissions.ts  # Sistema de permisos
│   └── utils.ts        # Utilidades generales
├── types/              # Definiciones de tipos TypeScript
│   └── index.ts        # Tipos compartidos
└── integrations/       # Integraciones externas
    └── supabase/       # Configuración de Supabase
```

## 🎨 Sistema de Diseño

### **Paleta de Colores**
- **Rojo Flamenco** (`#E53E3E`) - Color principal
- **Negro Elegante** (`#1A1A1A`) - Secundario
- **Dorado** (`#D69E2E`) - Acentos
- **Grises** - Neutros y fondos

### **Componentes**
- Diseño consistente con shadcn/ui
- Animaciones suaves y transiciones
- Responsive design mobile-first
- Accesibilidad WCAG 2.1

## 🔧 Configuración y Desarrollo

### **Requisitos**
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de WooCommerce (opcional)

### **Instalación**
```bash
# Clonar el repositorio
git clone <repository-url>
cd flamenco-fusion-hub

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### **Variables de Entorno**
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WooCommerce (opcional)
WOOCOMMERCE_STORE_URL=your_store_url
WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
```

## 📱 Funcionalidades por Módulo

### **Dashboard**
- Resumen de ventas del día/semana
- Productos con stock bajo
- Pedidos pendientes
- Accesos rápidos

### **Productos**
- Listado con búsqueda y filtros
- Crear/editar/eliminar productos
- Sincronización con WooCommerce
- Control de stock

### **TPV**
- Interfaz de venta intuitiva
- Carrito de compras
- Múltiples métodos de pago
- Descuentos y promociones

### **Pedidos**
- Gestión completa de encargos
- Estados: Pendiente → En Proceso → Listo → Entregado
- Historial de pedidos
- Gestión de clientes

### **Empleados**
- Sistema de roles (Admin, Manager, Employee)
- Control de acceso granular
- Fichajes y horarios
- Gestión de incidencias

## 🔐 Sistema de Permisos

### **Roles**
- **Admin**: Acceso completo al sistema
- **Manager**: Gestión de productos, pedidos y empleados
- **Employee**: Acceso a TPV y consultas básicas

### **Permisos Granulares**
- `view_dashboard`, `create_product`, `edit_order`, etc.
- Control de acceso por página y funcionalidad
- Interfaz adaptativa según permisos

## 🚀 Despliegue

### **Lovable Cloud (Recomendado)**
- Despliegue automático desde GitHub
- Variables de entorno configuradas
- SSL y CDN incluidos

### **Otros Servicios**
```bash
# Build para producción
npm run build

# Previsualizar build
npm run preview
```

## 📊 Monitoreo y Analytics

- **Error Tracking**: ErrorBoundary integrado
- **Performance**: Lazy loading y optimizaciones
- **Analytics**: Métricas de uso (configurable)
- **Logs**: Sistema de logging estructurado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]
- **Email**: soporte@flamencastore.com

---

**Desarrollado con ❤️ para la comunidad flamenca**

## 🔗 Enlaces Útiles

- **Proyecto Lovable**: https://lovable.dev/projects/74fe2cf3-ef36-4b12-b517-1c1650ba95f7
- **Documentación Supabase**: https://supabase.com/docs
- **Documentación WooCommerce**: https://woocommerce.com/document/woocommerce-rest-api/
- **shadcn/ui**: https://ui.shadcn.com/