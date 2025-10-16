#!/bin/bash

# ===========================================
# FLAMENCO FUSIÓN HUB - SCRIPT DE SETUP
# ===========================================

set -e  # Salir si hay algún error

echo "🎭 FLAMENCO FUSIÓN HUB - SETUP AUTOMÁTICO"
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

# Verificar si Docker está instalado
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
    
    print_success "Docker y Docker Compose están instalados"
}

# Verificar si Node.js está instalado
check_node() {
    print_status "Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js no está instalado. Se instalará automáticamente en el contenedor."
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION está instalado"
    fi
}

# Crear archivo .env si no existe
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

# Crear directorio SSL si no existe
setup_ssl() {
    print_status "Configurando SSL..."
    
    if [ ! -d ssl ]; then
        mkdir -p ssl
        print_success "Directorio SSL creado"
    fi
    
    # Crear certificados autofirmados para desarrollo
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        print_status "Generando certificados SSL autofirmados para desarrollo..."
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=ES/ST=Madrid/L=Madrid/O=Flamenco/OU=IT/CN=localhost"
        print_success "Certificados SSL generados"
    else
        print_success "Certificados SSL ya existen"
    fi
}

# Construir y levantar los servicios
start_services() {
    print_status "Construyendo y levantando servicios..."
    
    # Construir imágenes
    docker-compose build
    
    # Levantar servicios básicos
    docker-compose up -d postgres
    
    # Esperar a que PostgreSQL esté listo
    print_status "Esperando a que PostgreSQL esté listo..."
    sleep 10
    
    # Levantar el resto de servicios
    docker-compose up -d
    
    print_success "Servicios levantados correctamente"
}

# Verificar que los servicios estén funcionando
check_services() {
    print_status "Verificando servicios..."
    
    # Verificar PostgreSQL
    if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL está funcionando"
    else
        print_error "PostgreSQL no está funcionando"
        exit 1
    fi
    
    # Verificar Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend está funcionando en http://localhost:3000"
    else
        print_warning "Frontend aún no está disponible (puede tardar unos minutos)"
    fi
    
    # Verificar Edge Functions
    if curl -s http://localhost:8081 > /dev/null 2>&1; then
        print_success "Edge Functions están funcionando en http://localhost:8081"
    else
        print_warning "Edge Functions aún no están disponibles (puede tardar unos minutos)"
    fi
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
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "  - Edita el archivo .env con tus credenciales reales"
    echo "  - Configura las APIs (WooCommerce, Holded, Twilio, Resend)"
    echo "  - Para producción, usa perfiles específicos de Docker Compose"
    echo ""
}

# Función para mostrar ayuda
show_help() {
    echo "🎭 FLAMENCO FUSIÓN HUB - SCRIPT DE SETUP"
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
    echo ""
    echo "Ejemplos:"
    echo "  $0              # Setup de desarrollo"
    echo "  $0 --prod       # Setup de producción"
    echo "  $0 --clean      # Limpiar e instalar"
    echo "  $0 --stop       # Parar servicios"
    echo "  $0 --logs       # Ver logs"
}

# Función para limpiar todo
clean_setup() {
    print_status "Limpiando instalación anterior..."
    
    # Parar servicios
    docker-compose down -v
    
    # Eliminar imágenes
    docker-compose down --rmi all
    
    # Limpiar sistema Docker
    docker system prune -f
    
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
    setup_env
    setup_ssl
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
            check_node
            setup_env
            setup_ssl
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
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
