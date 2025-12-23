# 🎭 Flamenco Fusion Hub

> **Sistema de gestión integral para tiendas de trajes de flamenca**  
> Una aplicación web moderna y completa que revoluciona la gestión de negocios de moda flamenca.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3.x-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌟 **Características Principales**

### 🛍️ **Gestión de Ventas**
- **TPV Integrado**: Sistema de punto de venta completo
- **Gestión de Pedidos**: Control total de pedidos online y presenciales
- **Facturación Automática**: Integración con Holded para facturación profesional
- **Control de Stock**: Sincronización automática con WooCommerce

### 📊 **Dashboard Inteligente**
- **Métricas en Tiempo Real**: Ventas, stock, pedidos pendientes
- **Alertas Automáticas**: Notificaciones de stock bajo y pedidos nuevos
- **Estadísticas Visuales**: Gráficos y métricas de rendimiento

### 👥 **Gestión de Empleados**
- **Control de Acceso**: Sistema de roles (Admin, Encargado, Empleado)
- **Fichajes**: Registro de entrada y salida
- **Gestión de Incidencias**: Sistema de reportes y seguimiento

### 🔔 **Sistema de Notificaciones**
- **Multi-canal**: WhatsApp, SMS, Email
- **Alertas Inteligentes**: Stock bajo, nuevos pedidos, incidencias
- **Configuración Personalizada**: Por usuario y tipo de notificación

---

## 🚀 **Tecnologías Utilizadas**

### **Frontend**
- **React 18** con TypeScript
- **Tailwind CSS** para diseño responsive
- **Shadcn/ui** para componentes
- **React Router** para navegación
- **React Hook Form** para formularios

### **Backend**
- **Supabase** como BaaS
- **Edge Functions** para lógica de negocio
- **PostgreSQL** como base de datos
- **Row Level Security** para seguridad

### **Integraciones**
- **Holded API** para facturación
- **WooCommerce API** para e-commerce
- **Twilio** para SMS y WhatsApp
- **Resend** para emails

---

## 🛠️ **Instalación y Configuración**

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Holded
- Cuenta de Twilio (opcional)

### **Instalación Rápida**

```bash
# 1. Clonar el repositorio
git clone https://github.com/jjimho439/flamenco-fusion-hub.git
cd flamenco-fusion-hub

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (ejemplo para Supabase Cloud)
cp env.example .env
cp supabase/functions/env.example supabase/functions/.env

# 4. Editar archivos .env con tus credenciales
# - .env (variables del frontend)
# - supabase/functions/.env (variables para Edge Functions)

# 5. Iniciar en modo desarrollo
npm run dev
```

### **Configuración de Variables de Entorno**

```bash
# 1. Copiar archivo de configuración principal
cp .env.example .env

# 2. Copiar archivo de configuración para Edge Functions
cp supabase/functions/.env.example supabase/functions/.env

# 3. Editar ambos archivos .env con tus credenciales reales
```

**Archivos a configurar:**
- **`.env`** (raíz del proyecto): Variables del frontend
- **`supabase/functions/.env`**: Variables para Edge Functions

### **Supabase Cloud (desplegar en la nube)**
1. Crea un proyecto en [app.supabase.com](https://app.supabase.com) y guarda:
   - URL del proyecto (`https://<project-ref>.supabase.co`)
   - Clave `anon` (publishable)
   - Clave `service_role`
2. Instala el CLI y autentica: `npm i -g supabase` y `supabase login`.
3. Enlaza el proyecto: `supabase link --project-ref <project-ref>`.
4. Aplica el esquema: `supabase db push` (usa las migraciones de `supabase/migrations`).
5. Sube las funciones Edge:
   - Exporta secretos: `supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... WOOCOMMERCE_STORE_URL=... WOOCOMMERCE_CONSUMER_KEY=... WOOCOMMERCE_CONSUMER_SECRET=... HOLDED_API_KEY=... [TWILIO_* opcional] [RESEND_API_KEY FROM_EMAIL opcional]`
   - Despliega: `supabase functions deploy --project-ref <project-ref> --no-verify-jwt assign-role auto-notify change-password create-holded-invoice create-time-entry create-user delete-user holded-documents reset-password send-email send-notification send-sms send-whatsapp setup-admin-notifications sync-woocommerce-holded sync-woocommerce-orders sync-woocommerce-products`
6. Actualiza el frontend con los valores cloud en `.env`.

---

## 🎯 **Funcionalidades Destacadas**

### 💳 **Sistema de Facturación**
- Generación automática de facturas en Holded
- PDFs profesionales con diseño personalizable
- Envío automático por email
- Integración con datos fiscales

### 📦 **Gestión de Stock**
- Sincronización bidireccional con WooCommerce
- Alertas automáticas de stock bajo
- Control de inventario en tiempo real
- Reportes de rotación de productos

### 🔐 **Seguridad y Permisos**
- Autenticación segura con Supabase Auth
- Sistema de roles granular
- Protección de rutas sensibles
- Auditoría de acciones

### 📱 **Responsive Design**
- Optimizado para móviles y tablets
- Interfaz adaptativa
- Gestos táctiles para TPV
- Modo offline básico

---

## 🧪 **Testing**

El proyecto incluye un sistema completo de pruebas unitarias:

```bash
# Ejecutar todas las pruebas
npm run test:run

# Modo watch para desarrollo
npm run test

# Interfaz gráfica
npm run test:ui

# Cobertura de código
npm run test:coverage
```

**Cobertura actual**: 47 pruebas unitarias ✅

---

## 📈 **Roadmap**

### **Próximas Funcionalidades**
- [ ] **App Móvil**: Versión nativa para iOS/Android
- [ ] **IA Integrada**: Recomendaciones de productos
- [ ] **Analytics Avanzados**: Métricas de negocio
- [ ] **Multi-tienda**: Soporte para múltiples ubicaciones
- [ ] **Integración CRM**: Gestión de clientes avanzada

### **Mejoras Técnicas**
- [ ] **PWA**: Aplicación web progresiva
- [ ] **Caché Inteligente**: Optimización de rendimiento
- [ ] **Microservicios**: Arquitectura escalable
- [ ] **CI/CD**: Pipeline de despliegue automático

---

## 🤝 **Contribuir**

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

### ⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐

[![GitHub stars](https://img.shields.io/github/stars/jjimho439/flamenco-fusion-hub?style=social)](https://github.com/jjimho439/flamenco-fusion-hub/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/jjimho439/flamenco-fusion-hub?style=social)](https://github.com/jjimho439/flamenco-fusion-hub/network)

**Hecho con ❤️ para la comunidad flamenca**

</div>
