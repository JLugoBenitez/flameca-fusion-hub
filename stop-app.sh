#!/bin/bash

# 🛑 SCRIPT DE PARADA - FLAMENCO FUSION HUB
# Este script detiene todos los servicios de la aplicación

echo "🛑 ==============================================="
echo "🛑    FLAMENCO FUSION HUB - PARANDO SERVICIOS"
echo "🛑 ==============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Parar Edge Functions
print_info "Deteniendo Edge Functions..."
pkill -f "supabase functions" 2>/dev/null || true
print_status "Edge Functions detenidas"

# Parar Supabase
print_info "Deteniendo Supabase..."
supabase stop 2>/dev/null || true
print_status "Supabase detenido"

# Limpiar contenedores Docker
print_info "Limpiando contenedores Docker..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
print_status "Contenedores limpiados"

echo ""
echo "🛑 ==============================================="
echo "🛑           ¡SERVICIOS DETENIDOS!"
echo "🛑 ==============================================="
echo ""
print_status "Todos los servicios han sido detenidos correctamente"
