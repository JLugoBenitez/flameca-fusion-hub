# 🎭 FLAMENCO FUSION HUB - Instrucciones para Windows

## 🚀 Instalación Automática (Recomendada)

### Requisitos previos:
1. **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop/)
2. **Node.js 18+** - [Descargar aquí](https://nodejs.org/)

### Pasos:
1. Copia toda la carpeta del proyecto a tu PC
2. Abre **Símbolo del sistema** o **PowerShell** en la carpeta del proyecto
3. **OPCIÓN A**: Ejecuta: `install-and-run-npx.bat` (recomendado - usa npx)
4. **OPCIÓN B**: Ejecuta: `install-and-run.bat` (requiere Supabase CLI instalado)
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

## 🔧 Scripts Disponibles para Windows

### Scripts con npx (recomendado):
- `install-and-run-npx.bat` - Instalación completa usando npx
- `stop-app-npx.bat` - Parar servicios (versión npx)

### Scripts con Supabase CLI instalado:
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
- Reinicia el símbolo del sistema
- Vuelve a ejecutar el script

### Error: "Puerto en uso"
- Ejecuta `stop-app.bat` para parar servicios
- Vuelve a ejecutar el script

### La aplicación no carga
- Verifica que Docker Desktop esté ejecutándose
- Verifica que Supabase esté iniciado: `supabase status`
- Revisa los mensajes de error en la consola

### Error de codificación de caracteres
- Asegúrate de que tu terminal soporte UTF-8
- En PowerShell, ejecuta: `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`

## 📞 Soporte

Si tienes problemas:
1. Verifica que Docker Desktop esté ejecutándose
2. Verifica que Node.js 18+ esté instalado
3. Ejecuta `stop-app.bat` y vuelve a intentar
4. Revisa los mensajes de error en la consola

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

## 🔄 Comandos Rápidos

```cmd
# Instalación completa (recomendado)
install-and-run-npx.bat

# Instalación completa (requiere Supabase CLI)
install-and-run.bat

# Inicio rápido
start-app-simple.bat

# Parar servicios (versión npx)
stop-app-npx.bat

# Parar servicios (versión CLI)
stop-app.bat

# Iniciar frontend
npm run dev
```

¡Disfruta de tu aplicación! 🎭✨
