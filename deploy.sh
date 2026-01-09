#!/bin/bash

# Script de despliegue para Volearte CRM
# Uso: ./deploy.sh [usuario@servidor]

set -e

echo "🚀 Iniciando despliegue de Volearte CRM..."

# Verificar que existe .env.production
if [ ! -f .env.production ]; then
    echo "❌ Error: No se encontró .env.production"
    echo "💡 Copia .env.production.example a .env.production y completa los valores"
    exit 1
fi

# Construir la aplicación
echo "📦 Construyendo aplicación para producción..."
npm run build:prod

# Verificar que se creó la carpeta dist
if [ ! -d "dist" ]; then
    echo "❌ Error: No se creó la carpeta dist"
    exit 1
fi

echo "✅ Build completado"

# Si se proporciona servidor, subir archivos
if [ -n "$1" ]; then
    SERVER=$1
    REMOTE_PATH="/var/www/Volearte/crm"
    
    echo "📤 Subiendo archivos a $SERVER:$REMOTE_PATH..."
    
    # Crear directorio remoto si no existe
    ssh $SERVER "mkdir -p $REMOTE_PATH"
    
    # Subir archivos usando rsync
    rsync -avz --delete dist/ $SERVER:$REMOTE_PATH/
    
    echo "✅ Archivos subidos correctamente"
    echo ""
    echo "🔧 Recuerda:"
    echo "   1. Verificar configuración de nginx"
    echo "   2. Ejecutar: sudo nginx -t"
    echo "   3. Recargar: sudo systemctl reload nginx"
    echo ""
    echo "🌐 La aplicación estará disponible en:"
    echo "   https://volearteflamenca.es/crm"
else
    echo ""
    echo "📦 Archivos listos en la carpeta dist/"
    echo "💡 Para subir al servidor, ejecuta:"
    echo "   ./deploy.sh usuario@tu-servidor"
    echo ""
    echo "   O manualmente:"
    echo "   rsync -avz --delete dist/ usuario@servidor:/var/www/Volearte/crm/"
fi

