#!/bin/bash

# 🚀 SCRIPT DE INICIO SIMPLE - FLAMENCO FUSION HUB
# Versión optimizada que no se congela

echo "🎭 ==============================================="
echo "🎭    FLAMENCO FUSION HUB - INICIO RÁPIDO"
echo "🎭 ==============================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# PASO 1: Limpiar contenedores existentes
print_step "Limpiando contenedores Docker..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
print_status "Contenedores limpiados"

# PASO 2: Iniciar Supabase
print_step "Iniciando Supabase..."
supabase stop 2>/dev/null || true
supabase start > /dev/null 2>&1
print_status "Supabase iniciado"

# PASO 3: Iniciar Edge Functions en background
print_step "Iniciando Edge Functions..."
pkill -f "supabase functions" 2>/dev/null || true
sleep 2
cd supabase/functions
supabase functions serve --no-verify-jwt --env-file .env > /dev/null 2>&1 &
cd ../..
sleep 3
print_status "Edge Functions iniciadas"

# PASO 4: Mostrar información
echo ""
echo "🎉 ==============================================="
echo "🎉           ¡APLICACIÓN LISTA!"
echo "🎉 ==============================================="
echo ""
print_info "URLs disponibles:"
echo -e "  🌐 ${CYAN}Aplicación Frontend:${NC} http://localhost:5173"
echo -e "  🗄️  ${CYAN}Supabase Studio:${NC} http://localhost:54323"
echo -e "  🔌 ${CYAN}API REST:${NC} http://localhost:54321"
echo -e "  📧 ${CYAN}Mailpit:${NC} http://localhost:54324"
echo ""
print_info "Credenciales de prueba:"
echo -e "  👤 ${CYAN}Admin:${NC} admin@flamenca.com / admin123"
echo ""

# PASO 5: Iniciar aplicación frontend
print_step "Iniciando aplicación frontend..."
echo ""
print_info "Para iniciar la aplicación frontend, ejecuta:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
print_info "Para parar todos los servicios, ejecuta:"
echo -e "  ${YELLOW}./stop-app.sh${NC}"
echo ""

print_status "¡Backend listo! Ahora ejecuta 'npm run dev' para el frontend"
