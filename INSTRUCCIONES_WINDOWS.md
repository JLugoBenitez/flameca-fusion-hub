# 🎭 FLAMENCO FUSION HUB - Instrucciones para Windows

## 🚀 Instalación Automática (Recomendada)

### Requisitos previos:
1. **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop/)
2. **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
3. **Supabase CLI** - Ver opciones de instalación abajo

### Instalación de Supabase CLI (OBLIGATORIO):

#### 📦 **Opción 1: npm (Recomendada - más fácil)**
```cmd
# En la carpeta del proyecto
npm i supabase --save-dev
```
**Ventajas**: Se instala automáticamente con el script, no requiere configuración adicional.

#### 🥄 **Opción 2: Scoop**
```powershell
# Instalar Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Supabase CLI
scoop install supabase
```

#### 🍫 **Opción 3: Chocolatey**
```powershell
# Instalar Chocolatey (como administrador)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Supabase CLI
choco install supabase
```

#### 📥 **Opción 4: Descarga Manual**
1. Ve a: https://github.com/supabase/cli/releases
2. Descarga la versión para Windows (supabase_windows_amd64.zip)
3. Extrae el archivo `supabase.exe`
4. Añade la carpeta al PATH del sistema

### Pasos de instalación:
1. Copia toda la carpeta del proyecto a tu PC
2. Abre **PowerShell** o **CMD** como administrador
3. Navega a la carpeta del proyecto
4. Ejecuta: `install-and-run.bat`
5. Espera a que termine la instalación
6. Ejecuta: `npm run dev`

## 📱 URLs de la Aplicación

- **🌐 Aplicación Principal**: http://localhost:5173
- **🗄️ Supabase Studio**: http://localhost:54323
- **🔌 API REST**: http://localhost:54321
- **📧 Mailpit (Emails)**: http://localhost:54324

## 👤 Credenciales de Prueba

- **Email**: admin@flamenca.com
- **Contraseña**: admin123

## ⚙️ Configuración de APIs Externas (Opcional)

Si quieres usar las integraciones con servicios externos, edita el archivo:
`supabase\functions\.env`

### APIs disponibles:
- **WooCommerce**: Para sincronizar productos y pedidos
- **Holded**: Para facturación
- **Twilio**: Para SMS y WhatsApp
- **SMTP**: Para emails

## 🛑 Parar la Aplicación

Para parar todos los servicios:
```cmd
stop-app.bat
```

## 🔧 Scripts Disponibles

- `install-and-run.bat` - Instalación completa automática
- `start-app-simple.bat` - Inicio rápido (si ya está instalado)
- `stop-app.bat` - Parar todos los servicios

## ❓ Solución de Problemas

### Error: "Docker no está ejecutándose"
- Inicia Docker Desktop
- Espera a que esté completamente iniciado
- Vuelve a ejecutar el script

### Error: "Node.js no está instalado"
- Instala Node.js 18+ desde nodejs.org
- Reinicia el terminal
- Vuelve a ejecutar el script

### Error: "Supabase CLI no está instalado"
- Instala Supabase CLI usando una de las opciones de arriba
- Verifica que esté en el PATH: `supabase --version`
- Vuelve a ejecutar el script

### Error: "Puerto en uso"
- Ejecuta `stop-app.bat` para parar servicios
- Vuelve a ejecutar el script

### La aplicación no carga
- Verifica que Docker Desktop esté ejecutándose
- Verifica que Supabase esté iniciado: `supabase status`
- Revisa los logs en la terminal

### Error de permisos en Windows
- Ejecuta PowerShell o CMD como **administrador**
- Verifica que Windows Defender no bloquee los scripts

## 🔐 Configuración de Windows Defender

Si Windows Defender bloquea los scripts:

1. Ve a **Configuración de Windows**
2. **Actualización y seguridad** → **Seguridad de Windows**
3. **Protección contra virus y amenazas**
4. **Configuración de protección contra virus y amenazas**
5. **Exclusiones** → **Agregar o quitar exclusiones**
6. Agrega la carpeta del proyecto como exclusión

## 📞 Soporte

Si tienes problemas:
1. Verifica que Docker Desktop esté ejecutándose
2. Verifica que Node.js 18+ esté instalado
3. Verifica que Supabase CLI esté instalado: `supabase --version`
4. Ejecuta `stop-app.bat` y vuelve a intentar
5. Revisa los mensajes de error en la terminal
6. Ejecuta como administrador si hay problemas de permisos

## 🎯 Funcionalidades Incluidas

✅ **Gestión de Empleados** - Fichajes y horarios
✅ **Gestión de Productos** - Stock y catálogo
✅ **Gestión de Pedidos** - Encargos y seguimiento
✅ **Gestión de Incidencias** - Reportes y seguimiento
✅ **Sistema de Facturación** - Integración con Holded
✅ **Sincronización WooCommerce** - Productos y pedidos
✅ **Sistema de Notificaciones** - SMS, WhatsApp, Email
✅ **Interfaz Responsive** - Funciona en móvil y desktop
✅ **Autenticación Segura** - Roles y permisos
✅ **Base de Datos Completa** - PostgreSQL con Supabase

## 🚀 Comandos Rápidos

```cmd
# Instalación completa
install-and-run.bat

# Inicio rápido
start-app-simple.bat

# Parar servicios
stop-app.bat

# Iniciar frontend
npm run dev
```

¡Disfruta de tu aplicación en Windows! 🎭✨
