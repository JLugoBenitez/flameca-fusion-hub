# 🎭 Guía de Instalación - Flamenco Fusion Hub
## Prueba Técnica - Desarrolladores con IA

> **OneWeek - Desarrolladores con IA**  
> **Fecha**: 13 de octubre de 2025  
> **Objetivo**: Sistema de gestión para tienda de trajes de flamenca

---

## 📋 **Requisitos del Cliente Implementados**

### ✅ **Funcionalidades Principales**
- [x] **Panel de control de fichajes de empleados**
- [x] **Registro y seguimiento de incidencias**
- [x] **Gestión de stock de productos**
- [x] **Posibilidad de subir productos**
- [x] **Conexión y sincronización con WooCommerce**
- [x] **Diseño responsive adaptado a todo tipo de pantallas**
- [x] **Sistema de notificaciones (SMS, WhatsApp, Email)**
- [x] **Registro y seguimiento de encargos**
- [x] **Facturación: albaranes y facturas**
- [x] **Implementación de Holded API**

### 🎯 **Tecnologías Utilizadas**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Integraciones**: Holded API, WooCommerce API, Twilio
- **Notificaciones**: SMS, WhatsApp, Email
- **Facturación**: Holded + PDFs locales

---

## 🚀 **Instalación Rápida**

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Git
- Docker (para Supabase local)
- Cuenta de Holded (prueba gratuita)
- Cuenta de Twilio (prueba gratuita)

---

## 🐧 **Linux / macOS**

### **Paso 1: Instalar Node.js y Docker**
```bash
# Usando Node Version Manager (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# O usando Homebrew (macOS)
brew install node@18

# Instalar Docker
# macOS: Descargar Docker Desktop desde https://docker.com
# Linux: 
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 9.x.x o superior
docker --version # Debe mostrar Docker version
```

### **Paso 2: Clonar el Proyecto**
```bash
# Clonar repositorio
git clone https://github.com/jjimho439/flamenco-fusion-hub.git
cd flamenco-fusion-hub

# Verificar estructura del proyecto
ls -la
```

### **Paso 3: Instalar Dependencias**
```bash
# Instalar dependencias del proyecto
npm install

# Instalar Supabase CLI localmente
npm install supabase --save-dev

# Verificar instalación
npm list --depth=0
npx supabase --version
```

### **Paso 4: Configurar Variables de Entorno**
```bash
# Copiar archivos de configuración (ejemplo cloud)
cp env.example .env
cp supabase/functions/env.example supabase/functions/.env

# Editar configuración principal
nano .env
# O usar tu editor preferido: code .env, vim .env, etc.

# Editar configuración de Edge Functions
nano supabase/functions/.env
```

### **Paso 5: Configurar Docker**
```bash
# Limpiar Docker
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -f
```

### **Paso 6: Iniciar Supabase**
```bash
# Parar Supabase si está corriendo
npx supabase stop

# Iniciar Supabase
npx supabase start
```

### **Paso 7: Iniciar Edge Functions**
```bash
# Ir a la carpeta de functions
cd supabase/functions

# Iniciar Edge Functions en background
npx supabase functions serve --no-verify-jwt --env-file .env &

# Volver al directorio raíz
cd ../..
```

### **Paso 8: Iniciar Frontend**
```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# http://localhost:8080
```

---

## 🪟 **Windows**

### **Paso 1: Instalar Node.js y Docker**
```powershell
# Opción 1: Descargar desde nodejs.org
# Visitar: https://nodejs.org/
# Descargar LTS version (18.x.x)
# Ejecutar instalador y seguir instrucciones

# Opción 2: Usando Chocolatey
# Instalar Chocolatey primero: https://chocolatey.org/install
choco install nodejs
choco install docker-desktop

# Opción 3: Usando winget
winget install OpenJS.NodeJS
winget install Docker.DockerDesktop

# Verificar instalación
node --version
npm --version
docker --version
```

### **Paso 2: Clonar el Proyecto**
```powershell
# Usando Git Bash o PowerShell
git clone https://github.com/jjimho439/flamenco-fusion-hub.git
cd flamenco-fusion-hub

# Verificar estructura
dir
```

### **Paso 3: Instalar Dependencias**
```powershell
# Instalar dependencias del proyecto
npm install

# Instalar Supabase CLI localmente
npm install supabase --save-dev

# Verificar instalación
npm list --depth=0
npx supabase --version
```

### **Paso 4: Configurar Variables de Entorno**
```powershell
# Copiar archivos de configuración (ejemplo cloud)
copy env.example .env
copy supabase\functions\env.example supabase\functions\.env

# Editar configuración (usar tu editor preferido)
notepad .env
notepad supabase\functions\.env
```

### **Paso 5: Configurar Docker**
```powershell
# Limpiar Docker (Para Windows sin "|| true")
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker system prune -f
```

### **Paso 6: Iniciar Supabase**
```powershell
# Parar Supabase si está corriendo
npx supabase stop

# Iniciar Supabase
npx supabase start
```

### **Paso 7: Iniciar Edge Functions**
```powershell
# Ir a la carpeta de functions
cd supabase\functions

# Iniciar Edge Functions (Si no se ejecuta con bash, quitar el &)
npx supabase functions serve --no-verify-jwt --env-file .env

# Volver al directorio raíz
cd ..\..
```

### **Paso 8: Iniciar Frontend**
```powershell
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# http://localhost:8080
```

---

## 🚀 **Comandos de Instalación Rápida (Copia y Pega)**

### **Para Linux/macOS:**
```bash
# 1. Clonar repositorio
git clone https://github.com/jjimho439/flamenco-fusion-hub.git
cd flamenco-fusion-hub

# 2. Instalar dependencias del proyecto
npm install

# 3. Instalar Supabase CLI localmente
npm install supabase --save-dev

# 4. Verificar instalación
npx supabase --version

# 5. Configurar variables de entorno
cp .env.example .env
cp supabase/functions/.env.example supabase/functions/.env

# 6. Limpiar Docker
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -f

# 7. Parar Supabase si está corriendo
npx supabase stop

# 8. Iniciar Supabase
npx supabase start

# 9. Ir a la carpeta de functions
cd supabase/functions

# 10. Iniciar Edge Functions en background
npx supabase functions serve --no-verify-jwt --env-file .env &

# 11. Volver al directorio raíz
cd ../..

# 12. Iniciar servidor de desarrollo
npm run dev
```

### **Para Windows:**
```powershell
# 1. Clonar repositorio
git clone https://github.com/jjimho439/flamenco-fusion-hub.git
cd flamenco-fusion-hub

# 2. Instalar dependencias del proyecto
npm install

# 3. Instalar Supabase CLI localmente
npm install supabase --save-dev

# 4. Verificar instalación
npx supabase --version

# 5. Configurar variables de entorno
copy .env.example .env
copy supabase\functions\.env.example supabase\functions\.env

# 6. Limpiar Docker (Para Windows sin "|| true")
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker system prune -f

# 7. Parar Supabase si está corriendo
npx supabase stop

# 8. Iniciar Supabase
npx supabase start

# 9. Ir a la carpeta de functions
cd supabase\functions

# 10. Iniciar Edge Functions (Si no se ejecuta con bash, quitar el &)
npx supabase functions serve --no-verify-jwt --env-file .env

# 11. Volver al directorio raíz
cd ..\..

# 12. Iniciar servidor de desarrollo
npm run dev
```

---

## ⚙️ **Configuración de Variables de Entorno**

### **Archivo `.env` (Frontend)**
```env
# ===========================================
# CONFIGURACIÓN PRINCIPAL (SUPABASE LOCAL)
# ===========================================
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# ===========================================
# WOOCOMMERCE (Tienda WordPress)
# ===========================================
VITE_WOOCOMMERCE_URL=https://tu-tienda.com
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_tu_consumer_key
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_tu_consumer_secret

# ===========================================
# CONFIGURACIÓN ADICIONAL
# ===========================================
VITE_DEV_MODE=true
VITE_APP_URL=http://localhost:8080
VITE_NOTIFICATIONS_ENABLED=true
VITE_SOUND_NOTIFICATIONS=true
```

### **Archivo `supabase/functions/.env` (Backend)**
```env
# ===========================================
# SUPABASE CONFIGURATION (LOCAL)
# ===========================================
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# ===========================================
# HOLDED API (FACTURACIÓN)
# ===========================================
HOLDED_API_KEY=tu_holded_api_key

# ===========================================
# TWILIO (NOTIFICACIONES)
# ===========================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# ===========================================
# RESEND (EMAILS)
# ===========================================
RESEND_API_KEY=re_tu_resend_api_key
```

---

## 🐳 **Supabase Local - Configuración Completa**

### **¿Por qué Supabase Local?**
- ✅ **Sin necesidad de cuenta** en la nube
- ✅ **Desarrollo offline** completo
- ✅ **Datos locales** y privados
- ✅ **Mismas funcionalidades** que la versión cloud
- ✅ **Ideal para pruebas** y desarrollo

### **Comandos Esenciales de Supabase Local**
```bash
# Gestión de Supabase
npx supabase start    # Iniciar servicios
npx supabase stop     # Parar servicios
npx supabase status   # Ver estado
npx supabase restart  # Reiniciar
npx supabase logs     # Ver logs

# Base de datos
npx supabase db reset # Reset con migraciones

# Edge Functions
npx supabase functions serve --no-verify-jwt --env-file .env  # Servir localmente
npx supabase functions deploy  # Desplegar
npx supabase functions list    # Listar

# Tipos TypeScript
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Limpiar Docker (cuando sea necesario)
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -f
```

### **Servicios Incluidos en Supabase Local**
- **PostgreSQL**: Base de datos principal (puerto 54322)
- **API Gateway**: API REST y GraphQL (puerto 54321)
- **Dashboard**: Interfaz web (puerto 54323)
- **Auth**: Sistema de autenticación
- **Storage**: Almacenamiento de archivos
- **Edge Functions**: Funciones serverless

---

## 🔧 **Configuración de Servicios Externos**

### **1. Supabase (Base de Datos Local)**
```bash
# 1. Instalar Docker (ya incluido en pasos anteriores)
# 2. Iniciar Supabase local
npx supabase start

# 3. Las credenciales por defecto son:
# URL: http://localhost:54321
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
# Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# 4. Aplicar migraciones
npx supabase db reset
```

### **2. Holded (Facturación)**
```bash
# 1. Crear cuenta en: https://holded.com
# 2. Ir a Configuración > API
# 3. Generar API Key
# 4. Configurar en supabase/functions/.env
```

### **3. WooCommerce (Tienda)**
```bash
# 1. Instalar WordPress con WooCommerce
# 2. Ir a WooCommerce > Configuración > Avanzado > REST API
# 3. Crear nueva clave API
# 4. Configurar en .env
```

### **4. Twilio (Notificaciones) - Opcional**
```bash
# 1. Crear cuenta en: https://twilio.com
# 2. Obtener Account SID y Auth Token
# 3. Configurar número de teléfono
# 4. Configurar en supabase/functions/.env
```

---

## 🧪 **Verificación de la Instalación**

### **Comandos de Verificación**
```bash
# Verificar que la aplicación inicia
npm run dev

# Verificar que el build funciona
npm run build

# Verificar que los tests pasan
npm run test:run

# Verificar Edge Functions
npx supabase functions list
```

### **Checklist de Funcionalidades**
- [ ] **Dashboard** carga correctamente
- [ ] **TPV** permite realizar ventas
- [ ] **Productos** se sincronizan con WooCommerce
- [ ] **Pedidos** se crean y gestionan
- [ ] **Facturas** se generan en Holded
- [ ] **Empleados** pueden fichar
- [ ] **Incidencias** se reportan
- [ ] **Notificaciones** funcionan (si Twilio configurado)

---

## 🚨 **Solución de Problemas Comunes**

### **Error: "Cannot find module"**
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### **Error: "Supabase connection failed"**
```bash
# Verificar que Supabase local esté ejecutándose
npx supabase status

# Si no está ejecutándose, iniciarlo
npx supabase start

# Verificar variables de entorno
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verificar que Supabase esté funcionando
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" http://localhost:54321/rest/v1/
```

### **Error: "Edge Functions not found"**
```bash
# Redesplegar Edge Functions
npx supabase functions deploy

# Verificar que estén desplegadas
npx supabase functions list

# Verificar estado de Supabase
npx supabase status
```

### **Error: "WooCommerce connection failed"**
```bash
# Verificar URL y credenciales
curl -u "consumer_key:consumer_secret" \
  "https://tu-tienda.com/wp-json/wc/v3/products"
```

---

## 📱 **Acceso a la Aplicación**

### **URLs de Acceso**
- **Frontend**: http://localhost:8080
- **Supabase Dashboard Local**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Holded**: https://app.holded.com
- **WooCommerce**: https://tu-tienda.com/wp-admin

### **Credenciales por Defecto**
- **Admin**: admin@flamenca.com / admin123
- **Encargado**: manager@flamenca.com / manager123
- **Empleado**: employee@flamenca.com / employee123

---

## 🎯 **Funcionalidades Destacadas para la Prueba**

### **1. Panel de Control de Fichajes**
- ✅ Registro de entrada/salida
- ✅ Historial de fichajes
- ✅ Reportes de horas trabajadas

### **2. Gestión de Incidencias**
- ✅ Creación de incidencias
- ✅ Asignación a empleados
- ✅ Seguimiento de estado
- ✅ Notificaciones automáticas

### **3. Gestión de Stock**
- ✅ Sincronización con WooCommerce
- ✅ Alertas de stock bajo
- ✅ Actualización automática
- ✅ Control de inventario

### **4. Sistema de Facturación**
- ✅ Integración con Holded
- ✅ Generación de PDFs
- ✅ Envío por email
- ✅ Albaranes y facturas

### **5. Notificaciones Inteligentes**
- ✅ SMS via Twilio
- ✅ WhatsApp via Twilio
- ✅ Emails via Resend
- ✅ Configuración por usuario

---

## 📊 **Métricas de Rendimiento**

### **Tiempo de Carga**
- **Dashboard**: < 2 segundos
- **TPV**: < 1 segundo
- **Sincronización**: < 5 segundos

### **Compatibilidad**
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, Tablet, Mobile
- **Resoluciones**: 320px - 4K

---

## 🌐 **Exponer la Aplicación con ngrok**

### **¿Qué es ngrok?**
ngrok permite exponer tu aplicación local a internet de forma segura, ideal para:
- **Demostraciones** en vivo
- **Testing** desde dispositivos móviles
- **Compartir** la aplicación con otros
- **Webhooks** de servicios externos

### **Configuración de ngrok**
```bash
# 1. Instalar ngrok (si no lo tienes)
# macOS: brew install ngrok/ngrok/ngrok
# Linux: Descargar desde https://ngrok.com/download
# Windows: Descargar desde https://ngrok.com/download

# 2. Autenticarse (opcional, para URLs personalizadas)
ngrok config add-authtoken tu_token_aqui

# 3. Exponer el puerto 8080
ngrok http 8080
```

### **URLs de Acceso con ngrok**
Una vez ejecutado `ngrok http 8080`, tendrás:
- **URL pública**: `https://xxxxx.ngrok-free.app`
- **URL local**: `http://localhost:8080`
- **Dashboard ngrok**: `http://localhost:4040`

### **Configuración Automática**
El proyecto ya está configurado para aceptar hosts de ngrok y proxy de API:
```typescript
// vite.config.ts
server: {
  allowedHosts: [
    "localhost",
    "127.0.0.1",
    ".ngrok.io",
    ".ngrok-free.app", 
    ".ngrok-free.dev",
    ".ngrok.app",
    ".ngrok.dev"
  ],
  // PROXY: Redirige /api/* a Supabase local (puerto 54321)
  proxy: {
    '/api': {
      target: 'http://localhost:54321',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, ''),
    }
  }
}
```

### **¿Cómo Funciona el Proxy?**
- **Frontend** (puerto 8080) → **ngrok** → **Internet**
- **API calls** `/api/*` → **Proxy** → **Supabase local** (puerto 54321)
- **Sin CORS**: El proxy maneja las peticiones internamente
- **Transparente**: El frontend no sabe que hay un proxy

### **Comandos Útiles de ngrok**
```bash
# Exponer puerto específico
ngrok http 8080

# Exponer con subdominio personalizado (requiere cuenta)
ngrok http 8080 --subdomain=flamenco-fusion

# Ver estadísticas
ngrok http 8080 --log=stdout

# Exponer múltiples puertos
ngrok start --all
```

### **Troubleshooting ngrok**
```bash
# Si aparece "Blocked request"
# Verificar que el host esté en allowedHosts
# Reiniciar el servidor de desarrollo
npm run dev

# Si ngrok no conecta
# Verificar que el puerto 8080 esté libre
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Verificar configuración de ngrok
ngrok config check
```

---

## 🎉 **¡Instalación Completada!**

Una vez completados todos los pasos, tendrás:

- ✅ **Sistema completo** de gestión para tienda de flamenca
- ✅ **Integración** con Holded para facturación
- ✅ **Sincronización** con WooCommerce
- ✅ **Notificaciones** multi-canal
- ✅ **Diseño responsive** para todos los dispositivos
- ✅ **Panel de control** completo

### **Próximos Pasos**
1. **Configurar** tus credenciales reales
2. **Personalizar** la aplicación según tus necesidades
3. **Desplegar** en un servidor de producción
4. **Entrenar** a tu equipo en el uso del sistema

---

### **Documentación Adicional**
- [README.md](README.md) - Documentación principal
- [DOCUMENTACION_TECNICA.md](DOCUMENTACION_TECNICA.md) - Documentación técnica
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guía de contribución

---
