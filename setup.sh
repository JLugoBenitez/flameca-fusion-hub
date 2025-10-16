#!/bin/bash

# ===========================================
# STORE MANAGEMENT APP - SCRIPT DE SETUP
# ===========================================

set -e  # Salir si hay algún error

echo "🏪 STORE MANAGEMENT APP - SETUP AUTOMÁTICO"
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
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

# Función para esperar con timeout
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=60  # Aumentado para frontend
    local attempt=1
    
    print_status "Esperando a que $service_name esté listo..."
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" > /dev/null 2>&1; then
            print_success "$service_name está listo"
            return 0
        fi
        
        # Mostrar progreso cada 10 intentos
        if [ $((attempt % 10)) -eq 0 ]; then
            echo ""
            print_status "Aún esperando... (intento $attempt/$max_attempts)"
        else
            echo -n "."
        fi
        
        sleep 3  # Aumentado a 3 segundos
        attempt=$((attempt + 1))
    done
    
    echo ""
    print_error "$service_name no está disponible después de $max_attempts intentos"
    print_warning "Puedes verificar los logs con: docker-compose logs $service_name"
    return 1
}

# Verificar si Docker está instalado y funcionando
check_docker() {
    print_status "Verificando Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor, instala Docker primero:"
        echo "  - macOS: https://docs.docker.com/desktop/mac/install/"
        echo "  - Ubuntu: https://docs.docker.com/engine/install/ubuntu/"
        echo "  - Windows: https://docs.docker.com/desktop/windows/install/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor, instala Docker Compose primero."
        exit 1
    fi
    
    # Verificar que Docker esté funcionando
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker no está funcionando. Por favor, inicia Docker Desktop o el servicio Docker."
        exit 1
    fi
    
    print_success "Docker y Docker Compose están instalados y funcionando"
}

# Verificar archivos necesarios
check_required_files() {
    print_status "Verificando archivos necesarios..."
    
    local required_files=(
        "package.json"
        "docker-compose.yml"
        "Dockerfile.frontend"
        "Dockerfile.functions"
        ".env.example"
        "supabase/functions/.env.example"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Archivo requerido no encontrado: $file"
            exit 1
        fi
    done
    
    print_success "Todos los archivos necesarios están presentes"
}

# Crear archivos .env
setup_env() {
    print_status "Configurando variables de entorno..."
    
    # Crear .env principal
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Archivo .env creado desde .env.example"
            print_warning "IMPORTANTE: Edita el archivo .env con tus credenciales reales"
        else
            print_error "No se encontró .env.example"
            exit 1
        fi
    else
        print_success "Archivo .env ya existe"
    fi
    
    # Crear .env para Edge Functions
    if [ ! -f supabase/functions/.env ]; then
        if [ -f supabase/functions/.env.example ]; then
            cp supabase/functions/.env.example supabase/functions/.env
            print_success "Archivo supabase/functions/.env creado desde .env.example"
            print_warning "IMPORTANTE: Edita el archivo supabase/functions/.env con tus credenciales reales"
        else
            print_error "No se encontró supabase/functions/.env.example"
            exit 1
        fi
    else
        print_success "Archivo supabase/functions/.env ya existe"
    fi
}

# Crear directorio SSL y certificados
setup_ssl() {
    print_status "Configurando SSL..."
    
    if [ ! -d ssl ]; then
        mkdir -p ssl
        print_success "Directorio SSL creado"
    fi
    
    # Verificar si OpenSSL está disponible
    if ! command -v openssl &> /dev/null; then
        print_warning "OpenSSL no está instalado. Saltando generación de certificados SSL."
        print_warning "Los certificados se generarán automáticamente en el contenedor si es necesario."
        return 0
    fi
    
    # Crear certificados autofirmados para desarrollo
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        print_status "Generando certificados SSL autofirmados para desarrollo..."
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=ES/ST=Madrid/L=Madrid/O=Store/OU=IT/CN=localhost" 2>/dev/null || {
            print_warning "No se pudieron generar certificados SSL. Se usarán certificados por defecto."
        }
        print_success "Certificados SSL generados"
    else
        print_success "Certificados SSL ya existen"
    fi
}

# Limpiar instalaciones anteriores
cleanup_previous() {
    print_status "Limpiando instalaciones anteriores..."
    
    # Parar contenedores existentes
    docker-compose down -v 2>/dev/null || true
    
    # Limpiar volúmenes huérfanos
    docker volume prune -f 2>/dev/null || true
    
    print_success "Limpieza completada"
}

# Construir imágenes Docker
build_images() {
    print_status "Construyendo imágenes Docker..."
    
    # Construir imágenes sin cache para asegurar que estén actualizadas
    docker-compose build --no-cache
    
    print_success "Imágenes Docker construidas correctamente"
}

# Levantar servicios paso a paso
start_services() {
    print_status "Levantando servicios..."
    
    # 1. Levantar PostgreSQL primero
    print_status "Iniciando PostgreSQL..."
    docker-compose up -d postgres
    
    # Esperar a que PostgreSQL esté listo
    wait_for_service "PostgreSQL" "docker-compose exec postgres pg_isready -U postgres"
    
    # 2. Levantar Edge Functions
    print_status "Iniciando Edge Functions..."
    docker-compose up -d edge-functions
    
    # Esperar a que Edge Functions estén listas
    wait_for_service "Edge Functions" "curl -s http://localhost:8081/health || curl -s http://localhost:8081"
    
    # 3. Levantar Frontend
    print_status "Iniciando Frontend..."
    docker-compose up -d frontend
    
    # Esperar a que Frontend esté listo (con timeout más largo)
    print_status "Frontend puede tardar varios minutos en compilar..."
    wait_for_service "Frontend" "curl -s http://localhost:3000"
    
    print_success "Todos los servicios están funcionando"
}

# Verificar que los servicios estén funcionando
check_services() {
    print_status "Verificando servicios..."
    
    # Verificar PostgreSQL
    if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL está funcionando"
    else
        print_error "PostgreSQL no está funcionando"
        return 1
    fi
    
    # Verificar Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend está funcionando en http://localhost:3000"
    else
        print_warning "Frontend aún no está disponible (puede tardar unos minutos)"
        print_status "Para ver logs del frontend: docker-compose logs frontend"
    fi
    
    # Verificar Edge Functions
    if curl -s http://localhost:8081 > /dev/null 2>&1; then
        print_success "Edge Functions están funcionando en http://localhost:8081"
    else
        print_warning "Edge Functions aún no están disponibles (puede tardar unos minutos)"
    fi
    
    return 0
}

# Mostrar información de acceso
show_access_info() {
    echo ""
    echo "🎉 ¡SETUP COMPLETADO EXITOSAMENTE!"
    echo "=================================="
    echo ""
    echo "📱 Acceso a la aplicación:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Edge Functions: http://localhost:8081"
    echo "  - PostgreSQL: localhost:5432"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "  - Ver logs: docker-compose logs -f"
    echo "  - Parar servicios: docker-compose down"
    echo "  - Reiniciar: docker-compose restart"
    echo "  - Reconstruir: docker-compose build --no-cache"
    echo ""
    echo "📚 Documentación:"
    echo "  - README.md: Instrucciones detalladas"
    echo "  - DOCUMENTACION_COMPLETA.md: Documentación técnica"
    echo "  - DOCKER_SETUP.md: Guía de Docker"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "  - Edita el archivo .env con tus credenciales reales"
    echo "  - Edita el archivo supabase/functions/.env con tus credenciales reales"
    echo "  - Configura las APIs (WooCommerce, Holded, Twilio, Resend)"
    echo ""
    echo "🔍 Para ver logs en tiempo real:"
    echo "  docker-compose logs -f"
    echo ""
}

# Función para mostrar ayuda
show_help() {
    echo "🏪 STORE MANAGEMENT APP - SCRIPT DE SETUP"
    echo "=========================================="
    echo ""
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help     Mostrar esta ayuda"
    echo "  -d, --dev      Setup para desarrollo (por defecto)"
    echo "  -p, --prod     Setup para producción"
    echo "  -c, --clean    Limpiar y reinstalar todo"
    echo "  -s, --stop     Parar todos los servicios"
    echo "  -l, --logs     Mostrar logs de todos los servicios"
    echo "  -r, --restart  Reiniciar todos los servicios"
    echo ""
    echo "Ejemplos:"
    echo "  $0              # Setup de desarrollo"
    echo "  $0 --prod       # Setup de producción"
    echo "  $0 --clean      # Limpiar e instalar"
    echo "  $0 --stop       # Parar servicios"
    echo "  $0 --logs       # Ver logs"
    echo "  $0 --restart    # Reiniciar servicios"
}

# Función para limpiar todo
clean_setup() {
    print_status "Limpiando instalación anterior..."
    
    # Parar servicios
    docker-compose down -v 2>/dev/null || true
    
    # Eliminar imágenes
    docker-compose down --rmi all 2>/dev/null || true
    
    # Limpiar sistema Docker
    docker system prune -f 2>/dev/null || true
    
    print_success "Limpieza completada"
}

# Función para parar servicios
stop_services() {
    print_status "Parando servicios..."
    docker-compose down
    print_success "Servicios parados"
}

# Función para mostrar logs
show_logs() {
    print_status "Mostrando logs de todos los servicios..."
    docker-compose logs -f
}

# Función para reiniciar servicios
restart_services() {
    print_status "Reiniciando servicios..."
    docker-compose restart
    print_success "Servicios reiniciados"
}

# Función para setup de producción
setup_production() {
    print_status "Configurando para producción..."
    
    # Verificar que existe docker-compose.prod.yml
    if [ ! -f docker-compose.prod.yml ]; then
        print_error "Archivo docker-compose.prod.yml no encontrado"
        exit 1
    fi
    
    # Usar docker-compose de producción
    export COMPOSE_FILE=docker-compose.prod.yml
    
    check_docker
    check_required_files
    setup_env
    setup_ssl
    cleanup_previous
    build_images
    start_services
    check_services
    
    echo ""
    echo "🎉 ¡SETUP DE PRODUCCIÓN COMPLETADO!"
    echo "=================================="
    echo ""
    echo "📱 Acceso a la aplicación:"
    echo "  - Frontend: https://localhost (o tu dominio)"
    echo "  - Edge Functions: https://localhost/functions/v1/"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "  - Configura tu dominio en nginx.prod.conf"
    echo "  - Reemplaza los certificados SSL con los reales"
    echo "  - Configura todas las variables de entorno de producción"
    echo ""
}

# Función principal
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dev|"")
            echo "Iniciando setup de desarrollo..."
            echo ""
            check_docker
            check_required_files
            setup_env
            setup_ssl
            cleanup_previous
            build_images
            start_services
            check_services
            show_access_info
            ;;
        -p|--prod)
            setup_production
            ;;
        -c|--clean)
            clean_setup
            echo ""
            echo "Reiniciando setup limpio..."
            main --dev
            ;;
        -s|--stop)
            stop_services
            ;;
        -l|--logs)
            show_logs
            ;;
        -r|--restart)
            restart_services
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"