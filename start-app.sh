#!/bin/bash

# 🚀 SCRIPT DE INICIO AUTOMÁTICO - FLAMENCO FUSION HUB
# Este script configura y ejecuta toda la aplicación automáticamente

echo "🎭 ==============================================="
echo "🎭    FLAMENCO FUSION HUB - INICIO AUTOMÁTICO"
echo "🎭 ==============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

print_info "Iniciando configuración automática..."

# PASO 1: Limpiar contenedores existentes
print_step "PASO 1: Limpiando contenedores Docker existentes..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -f
print_status "Contenedores limpiados"

# PASO 2: Verificar Docker
print_step "PASO 2: Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi
print_status "Docker está disponible"

# PASO 3: Verificar Supabase CLI
print_step "PASO 3: Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI no está instalado. Instalando..."
    npm install -g supabase
fi
print_status "Supabase CLI está disponible"

# PASO 4: Iniciar Supabase
print_step "PASO 4: Iniciando Supabase..."
supabase stop 2>/dev/null || true
supabase start
if [ $? -eq 0 ]; then
    print_status "Supabase iniciado correctamente"
else
    print_error "Error al iniciar Supabase"
    exit 1
fi

# PASO 5: Instalar dependencias de Node.js
print_step "PASO 5: Instalando dependencias de Node.js..."
npm install
if [ $? -eq 0 ]; then
    print_status "Dependencias instaladas"
else
    print_error "Error al instalar dependencias"
    exit 1
fi

# PASO 6: Iniciar Edge Functions
print_step "PASO 6: Iniciando Edge Functions..."
pkill -f "supabase functions" 2>/dev/null || true
sleep 2
cd supabase/functions
supabase functions serve --no-verify-jwt --env-file .env &
FUNCTIONS_PID=$!
cd ../..
sleep 5
print_status "Edge Functions iniciadas (PID: $FUNCTIONS_PID)"

# PASO 7: Verificar que todo esté funcionando
print_step "PASO 7: Verificando servicios..."

# Verificar Supabase
if curl -s http://localhost:54321/rest/v1/ > /dev/null; then
    print_status "Supabase API funcionando"
else
    print_warning "Supabase API no responde"
fi

# Verificar Edge Functions
if curl -s http://localhost:54321/functions/v1/create-holded-invoice > /dev/null; then
    print_status "Edge Functions funcionando"
else
    print_warning "Edge Functions no responden"
fi

# PASO 8: Mostrar información de acceso
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
print_info "Base de datos:"
echo -e "  🐘 ${CYAN}PostgreSQL:${NC} postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
print_info "Credenciales de prueba:"
echo -e "  👤 ${CYAN}Admin:${NC} admin@flamenca.com / admin123"
echo ""

# PASO 9: Iniciar aplicación frontend
print_step "PASO 9: Iniciando aplicación frontend..."
echo ""
print_info "Iniciando servidor de desarrollo..."
echo ""

# Función para limpiar al salir
cleanup() {
    echo ""
    print_warning "Deteniendo servicios..."
    kill $FUNCTIONS_PID 2>/dev/null || true
    supabase stop
    print_status "Servicios detenidos"
    exit 0
}

# Capturar Ctrl+C para limpiar
trap cleanup SIGINT

# Iniciar la aplicación
npm run dev

# Si llegamos aquí, limpiar
cleanup
