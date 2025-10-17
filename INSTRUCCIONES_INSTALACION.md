# 🎭 FLAMENCO FUSION HUB - Instrucciones de Instalación

## 🚀 Instalación Automática (Recomendada)

### Requisitos previos:
1. **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop/)
2. **Node.js 18+** - [Descargar aquí](https://nodejs.org/)

### Pasos:
1. Copia toda la carpeta del proyecto a tu PC
2. Abre terminal en la carpeta del proyecto
3. Ejecuta: `./install-and-run.sh`
4. Espera a que termine la instalación
5. Ejecuta: `npm run dev`

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
`supabase/functions/.env`

### APIs disponibles:
- **WooCommerce**: Para sincronizar productos y pedidos
- **Holded**: Para facturación
- **Twilio**: Para SMS y WhatsApp
- **SMTP**: Para emails

## 🛑 Parar la Aplicación

Para parar todos los servicios:
```bash
./stop-app.sh
```

## 🔧 Scripts Disponibles

- `install-and-run.sh` - Instalación completa automática
- `start-app-simple.sh` - Inicio rápido (si ya está instalado)
- `stop-app.sh` - Parar todos los servicios

## ❓ Solución de Problemas

### Error: "Docker no está ejecutándose"
- Inicia Docker Desktop
- Espera a que esté completamente iniciado
- Vuelve a ejecutar el script

### Error: "Node.js no está instalado"
- Instala Node.js 18+ desde nodejs.org
- Reinicia el terminal
- Vuelve a ejecutar el script

### Error: "Puerto en uso"
- Ejecuta `./stop-app.sh` para parar servicios
- Vuelve a ejecutar el script

### La aplicación no carga
- Verifica que Docker esté ejecutándose
- Verifica que Supabase esté iniciado: `supabase status`
- Revisa los logs en la terminal

## 📞 Soporte

Si tienes problemas:
1. Verifica que Docker Desktop esté ejecutándose
2. Verifica que Node.js 18+ esté instalado
3. Ejecuta `./stop-app.sh` y vuelve a intentar
4. Revisa los mensajes de error en la terminal

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

¡Disfruta de tu aplicación! 🎭✨
