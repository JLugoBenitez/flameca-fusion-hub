#!/bin/bash

# Script para configurar Supabase local completo
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🏪 STORE MANAGEMENT APP - SETUP SUPABASE LOCAL"
echo "=============================================="

# Verificar Docker
print_status "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no está funcionando. Por favor inicia Docker Desktop."
    exit 1
fi
print_success "Docker está funcionando"

# Limpiar instalación anterior
print_status "Limpiando instalación anterior..."
docker-compose down -v > /dev/null 2>&1 || true
docker system prune -f > /dev/null 2>&1 || true
print_success "Limpieza completada"

# Construir imágenes
print_status "Construyendo imágenes Docker..."
docker-compose build --no-cache
print_success "Imágenes construidas"

# Levantar Supabase primero
print_status "Iniciando Supabase local..."
docker-compose up -d supabase

# Esperar a que Supabase esté listo
print_status "Esperando a que Supabase esté listo..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec supabase pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Supabase está listo"
        break
    fi
    
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Supabase no está disponible después de $max_attempts intentos"
    exit 1
fi

# Ejecutar migraciones
print_status "Ejecutando migraciones de base de datos..."
docker-compose exec supabase psql -U postgres -d postgres -c "CREATE DATABASE flamenco_fusion;" 2>/dev/null || true
docker-compose exec supabase psql -U postgres -d flamenco_fusion -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
print_success "Migraciones ejecutadas"

# Levantar Edge Functions
print_status "Iniciando Edge Functions..."
docker-compose up -d edge-functions

# Esperar a que Edge Functions estén listas
print_status "Esperando a que Edge Functions estén listas..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8081/health > /dev/null 2>&1; then
        print_success "Edge Functions están listas"
        break
    fi
    
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

# Levantar Frontend
print_status "Iniciando Frontend..."
docker-compose up -d frontend

# Esperar a que Frontend esté listo
print_status "Esperando a que Frontend esté listo..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend está listo"
        break
    fi
    
    if [ $((attempt % 10)) -eq 0 ]; then
        echo ""
        print_status "Aún esperando... (intento $attempt/$max_attempts)"
    else
        echo -n "."
    fi
    
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_warning "Frontend aún no está disponible (puede tardar unos minutos)"
    print_status "Para ver logs del frontend: docker-compose logs frontend"
fi

# Crear usuario admin
print_status "Creando usuario administrador..."
docker-compose exec edge-functions node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://supabase:5432', process.env.SUPABASE_ANON_KEY);

async function createAdmin() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@flamenca.com',
      password: 'admin123',
      email_confirm: true
    });
    
    if (error) {
      console.log('Usuario admin ya existe o error:', error.message);
    } else {
      console.log('Usuario admin creado:', data.user.email);
    }
  } catch (err) {
    console.log('Error creando admin:', err.message);
  }
}

createAdmin();
" 2>/dev/null || print_warning "No se pudo crear usuario admin automáticamente"

echo ""
echo "🎉 SETUP COMPLETADO"
echo "=================="
echo ""
print_success "Supabase local: http://localhost:54321"
print_success "Frontend: http://localhost:3000"
print_success "Edge Functions: http://localhost:8081"
echo ""
print_status "Credenciales por defecto:"
echo "  Admin: admin@flamenca.com / admin123"
echo "  Empleado: empleado@flamenca.com / empleado123"
echo ""
print_status "Para ver logs: docker-compose logs -f [servicio]"
print_status "Para parar: docker-compose down"
echo ""
