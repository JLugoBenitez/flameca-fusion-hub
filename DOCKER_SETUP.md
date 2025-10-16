# 🐳 Docker Setup - Flamenco Fusión Hub

> **Guía completa para desplegar Flamenco Fusión Hub con Docker**

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Setup Automático](#setup-automático)
- [Setup Manual](#setup-manual)
- [Configuración](#configuración)
- [Comandos Útiles](#comandos-útiles)
- [Perfiles de Despliegue](#perfiles-de-despliegue)
- [Solución de Problemas](#solución-de-problemas)

## 🔧 Requisitos

### **Sistema Operativo**
- **macOS**: 10.15+ (Catalina o superior)
- **Ubuntu**: 18.04+ (LTS recomendado)
- **Windows**: 10/11 con WSL2
- **CentOS/RHEL**: 7+

### **Software Requerido**
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: Para clonar el repositorio
- **OpenSSL**: Para certificados SSL (opcional)

### **Recursos del Sistema**
- **RAM**: Mínimo 4GB, recomendado 8GB+
- **CPU**: 2 cores mínimo, 4 cores recomendado
- **Disco**: 10GB libres mínimo
- **Puertos**: 3000, 5432, 8081, 80, 443

## 🚀 Setup Automático

### **Opción 1: Script Automático (Recomendado)**

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/flamenco-fusion-hub.git
cd flamenco-fusion-hub

# 2. Ejecutar script de setup
./setup.sh
```

El script automático:
- ✅ Verifica dependencias (Docker, Node.js)
- ✅ Crea archivo `.env` desde `.env.example`
- ✅ Crea archivo `supabase/functions/.env` desde `.env.example`
- ✅ Genera certificados SSL para desarrollo
- ✅ Construye y levanta todos los servicios
- ✅ Verifica que todo funcione correctamente
- ✅ Muestra información de acceso

### **Opción 2: Comandos Docker Compose**

```bash
# 1. Clonar y configurar
git clone https://github.com/tu-usuario/flamenco-fusion-hub.git
cd flamenco-fusion-hub
cp .env.example .env

# 2. Construir y levantar servicios
docker-compose build
docker-compose up -d

# 3. Verificar servicios
docker-compose ps
```

## 🔧 Setup Manual

### **Paso 1: Preparar el Entorno**

```bash
# Crear directorio del proyecto
mkdir flamenco-fusion-hub
cd flamenco-fusion-hub

# Clonar repositorio
git clone https://github.com/tu-usuario/flamenco-fusion-hub.git .

# Crear archivo de configuración
cp .env.example .env
```

### **Paso 2: Configurar Variables de Entorno**

El proyecto utiliza **dos archivos .env separados** por seguridad:

#### **📁 Archivo Principal: `.env`**
Para el frontend (variables públicas con `VITE_`):

```env
# Configuración básica
VITE_APP_NAME=Flamenco Fusión Hub
VITE_APP_VERSION=1.0.0

# Supabase (desarrollo local)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

#### **🔒 Archivo Backend: `supabase/functions/.env`**
Para Edge Functions (credenciales secretas):

```env
# Supabase Backend
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# APIs externas (reemplazar con valores reales)
WOOCOMMERCE_STORE_URL=https://tu-tienda.com
WOOCOMMERCE_CONSUMER_KEY=ck_tu_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=cs_tu_consumer_secret

HOLDED_API_KEY=tu_holded_api_key

TWILIO_ACCOUNT_SID=tu_twilio_account_sid
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

RESEND_API_KEY=tu_resend_api_key
FROM_EMAIL=noreply@tudominio.com
```

#### **🛡️ ¿Por qué dos archivos?**
- **Frontend** (`.env`): Solo variables públicas con prefijo `VITE_`
- **Backend** (`supabase/functions/.env`): Credenciales secretas del servidor
- **Seguridad**: Las API keys nunca se exponen al navegador

### **Paso 3: Construir y Levantar Servicios**

```bash
# Construir imágenes Docker
docker-compose build

# Levantar servicios en segundo plano
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

### **Paso 4: Verificar Instalación**

```bash
# Verificar que todos los servicios estén funcionando
docker-compose ps

# Verificar logs de cada servicio
docker-compose logs frontend
docker-compose logs edge-functions
docker-compose logs postgres
```

## ⚙️ Configuración

### **Servicios Incluidos**

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **frontend** | 3000 | Aplicación React |
| **edge-functions** | 8081 | Supabase Edge Functions |
| **postgres** | 5432 | Base de datos PostgreSQL |
| **nginx** | 80/443 | Proxy reverso (producción) |
| **redis** | 6379 | Cache (opcional) |

### **Volúmenes Persistentes**

- `postgres_data`: Datos de PostgreSQL
- `supabase_data`: Datos de Supabase local
- `redis_data`: Datos de Redis

### **Redes**

- `flamenco-network`: Red interna para comunicación entre servicios

## 🛠️ Comandos Útiles

### **Gestión de Servicios**

```bash
# Levantar todos los servicios
docker-compose up -d

# Parar todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart frontend

# Ver logs de un servicio
docker-compose logs -f frontend

# Ejecutar comando en un contenedor
docker-compose exec frontend npm run build
```

### **Desarrollo**

```bash
# Reconstruir imágenes sin cache
docker-compose build --no-cache

# Levantar solo servicios de desarrollo
docker-compose up postgres frontend

# Acceder al shell de un contenedor
docker-compose exec frontend sh
docker-compose exec postgres psql -U postgres
```

### **Base de Datos**

```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d flamenco_fusion

# Hacer backup de la base de datos
docker-compose exec postgres pg_dump -U postgres flamenco_fusion > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres flamenco_fusion < backup.sql
```

### **Logs y Debugging**

```bash
# Ver todos los logs
docker-compose logs

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f frontend

# Ver logs con timestamps
docker-compose logs -f -t
```

## 🎯 Perfiles de Despliegue

### **Desarrollo (Por defecto)**

```bash
# Levantar servicios básicos para desarrollo
docker-compose up -d postgres frontend edge-functions
```

### **Con Supabase Local**

```bash
# Levantar con Supabase local completo
docker-compose --profile supabase up -d
```

### **Con Cache Redis**

```bash
# Levantar con Redis para cache
docker-compose --profile cache up -d
```

### **Producción**

```bash
# Levantar configuración completa de producción
docker-compose --profile production up -d
```

### **Configuración Personalizada**

```bash
# Crear archivo docker-compose.override.yml
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  frontend:
    environment:
      - NODE_ENV=production
    command: npm run build && npm run preview
EOF

# Levantar con configuración personalizada
docker-compose up -d
```

## 🔍 Solución de Problemas

### **Problemas Comunes**

#### **1. Puerto ya en uso**

```bash
# Verificar qué proceso usa el puerto
lsof -i :3000
lsof -i :5432

# Parar servicios que usen el puerto
sudo kill -9 $(lsof -t -i:3000)
```

#### **2. Error de permisos Docker**

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar
newgrp docker
```

#### **3. Error de memoria insuficiente**

```bash
# Aumentar memoria de Docker
# En Docker Desktop: Settings > Resources > Memory
# Mínimo recomendado: 4GB
```

#### **4. Servicios no se levantan**

```bash
# Ver logs detallados
docker-compose logs

# Reconstruir sin cache
docker-compose build --no-cache

# Limpiar volúmenes
docker-compose down -v
docker-compose up -d
```

#### **5. Error de conexión a base de datos**

```bash
# Verificar que PostgreSQL esté funcionando
docker-compose exec postgres pg_isready -U postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Ver logs de PostgreSQL
docker-compose logs postgres
```

### **Comandos de Diagnóstico**

```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver uso de recursos
docker stats

# Ver información de red
docker network ls
docker network inspect flamenco-fusion-hub_flamenco-network

# Ver volúmenes
docker volume ls
docker volume inspect flamenco-fusion-hub_postgres_data
```

### **Limpieza Completa**

```bash
# Parar y eliminar todos los contenedores
docker-compose down

# Eliminar volúmenes (¡CUIDADO! Elimina datos)
docker-compose down -v

# Eliminar imágenes
docker-compose down --rmi all

# Limpieza completa del sistema Docker
docker system prune -a --volumes
```

## 📊 Monitoreo

### **Health Checks**

```bash
# Verificar salud de servicios
docker-compose ps

# Health check manual
curl http://localhost:3000
curl http://localhost:8081/functions/v1/health
```

### **Métricas**

```bash
# Ver uso de recursos
docker stats

# Ver logs de performance
docker-compose logs frontend | grep -i "performance"
```

## 🔒 Seguridad

### **Certificados SSL**

```bash
# Generar certificados para producción
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=ES/ST=Madrid/L=Madrid/O=Flamenco/OU=IT/CN=tu-dominio.com"
```

### **Variables de Entorno Seguras**

```bash
# Usar archivo .env.local para credenciales sensibles
cp .env.example .env.local

# No commitear archivos con credenciales
echo ".env.local" >> .gitignore
```

## 📚 Recursos Adicionales

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Supabase Docker**: https://supabase.com/docs/guides/self-hosting
- **React Docker**: https://create-react-app.dev/docs/deployment/#docker

---

## 🎯 Resumen de Acceso

Una vez completado el setup:

- **Frontend**: http://localhost:3000
- **Edge Functions**: http://localhost:8081
- **PostgreSQL**: localhost:5432
- **Nginx** (producción): http://localhost:80

**¡Tu aplicación Flamenco Fusión Hub estará lista para usar!** 🎉
