@echo off
setlocal enabledelayedexpansion

REM 🚀 SCRIPT DE INSTALACIÓN COMPLETA - FLAMENCO FUSION HUB (WINDOWS)
REM Este script instala todo lo necesario y ejecuta la aplicación en Windows

echo.
echo 🎭 ===============================================
echo 🎭    FLAMENCO FUSION HUB - INSTALACIÓN COMPLETA
echo 🎭 ===============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.
    pause
    exit /b 1
)

echo ℹ️  Verificando requisitos del sistema...

REM PASO 1: Verificar Docker
echo.
echo 🔄 PASO 1: Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado.
    echo ℹ️  Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/
    echo ℹ️  Después de instalar Docker, reinicia este script.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está ejecutándose.
    echo ℹ️  Por favor inicia Docker Desktop y vuelve a ejecutar este script.
    pause
    exit /b 1
)
echo ✅ Docker está instalado y funcionando

REM PASO 2: Verificar Node.js
echo.
echo 🔄 PASO 2: Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado.
    echo ℹ️  Por favor instala Node.js 18+ desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("!NODE_VERSION!") do set NODE_MAJOR=%%i

if !NODE_MAJOR! LSS 18 (
    echo ❌ Node.js versión !NODE_VERSION! detectada. Se requiere versión 18 o superior.
    echo ℹ️  Por favor actualiza Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js !NODE_VERSION! está instalado

REM PASO 3: Verificar Supabase CLI
echo.
echo 🔄 PASO 3: Verificando Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Supabase CLI no está instalado.
    echo.
    echo 📋 OPCIONES PARA INSTALAR SUPABASE CLI:
    echo.
    echo 1️⃣  OPCIÓN RECOMENDADA - Scoop (más fácil):
    echo    - Instala Scoop: https://scoop.sh/
    echo    - Ejecuta: scoop install supabase
    echo.
    echo 2️⃣  OPCIÓN ALTERNATIVA - Chocolatey:
    echo    - Instala Chocolatey: https://chocolatey.org/
    echo    - Ejecuta: choco install supabase
    echo.
    echo 3️⃣  OPCIÓN MANUAL - Descarga directa:
    echo    - Ve a: https://github.com/supabase/cli/releases
    echo    - Descarga la versión para Windows
    echo    - Extrae y añade al PATH
    echo.
    echo ⚠️  IMPORTANTE: Instala Supabase CLI y vuelve a ejecutar este script.
    pause
    exit /b 1
)
echo ✅ Supabase CLI ya está instalado

REM PASO 4: Crear archivo .env si no existe
echo.
echo 🔄 PASO 4: Configurando variables de entorno...
if not exist "supabase\functions\.env" (
    echo ⚠️  Archivo .env no encontrado. Creando archivo de configuración...
    (
        echo # Configuración de APIs externas
        echo # Reemplaza estos valores con tus propias API keys
        echo.
        echo # WooCommerce API
        echo WOOCOMMERCE_URL=https://tu-tienda.com
        echo WOOCOMMERCE_CONSUMER_KEY=ck_tu_consumer_key
        echo WOOCOMMERCE_CONSUMER_SECRET=cs_tu_consumer_secret
        echo.
        echo # Holded API
        echo HOLDED_API_KEY=tu_holded_api_key
        echo.
        echo # Twilio (para SMS/WhatsApp)
        echo TWILIO_ACCOUNT_SID=tu_twilio_sid
        echo TWILIO_AUTH_TOKEN=tu_twilio_token
        echo TWILIO_PHONE_NUMBER=+1234567890
        echo.
        echo # Email (opcional)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=tu_email@gmail.com
        echo SMTP_PASS=tu_password
    ) > supabase\functions\.env
    echo ✅ Archivo .env creado con valores de ejemplo
    echo ⚠️  IMPORTANTE: Edita supabase\functions\.env con tus API keys reales
) else (
    echo ✅ Archivo .env ya existe
)

REM PASO 5: Instalar dependencias
echo.
echo 🔄 PASO 5: Instalando dependencias de Node.js...
call npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

REM PASO 6: Limpiar y configurar Docker
echo.
echo 🔄 PASO 6: Configurando Docker...
for /f %%i in ('docker ps -q') do docker stop %%i >nul 2>&1
for /f %%i in ('docker ps -aq') do docker rm %%i >nul 2>&1
echo ✅ Docker configurado

REM PASO 7: Iniciar Supabase
echo.
echo 🔄 PASO 7: Iniciando Supabase...
supabase stop >nul 2>&1
supabase start >nul 2>&1
if errorlevel 1 (
    echo ❌ Error al iniciar Supabase
    pause
    exit /b 1
)
echo ✅ Supabase iniciado correctamente

REM PASO 8: Iniciar Edge Functions
echo.
echo 🔄 PASO 8: Iniciando Edge Functions...
taskkill /f /im "supabase.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
cd supabase\functions
start /b supabase functions serve --no-verify-jwt --env-file .env >nul 2>&1
cd ..\..
timeout /t 3 /nobreak >nul
echo ✅ Edge Functions iniciadas

REM PASO 9: Mostrar información final
echo.
echo 🎉 ===============================================
echo 🎉        ¡INSTALACIÓN COMPLETADA!
echo 🎉 ===============================================
echo.
echo ℹ️  URLs disponibles:
echo   🌐 Aplicación Frontend: http://localhost:5173
echo   🗄️  Supabase Studio: http://localhost:54323
echo   🔌 API REST: http://localhost:54321
echo   📧 Mailpit: http://localhost:54324
echo.
echo ℹ️  Credenciales de prueba:
echo   👤 Admin: admin@flamenca.com / admin123
echo.
echo ℹ️  Para iniciar la aplicación frontend:
echo   npm run dev
echo.
echo ℹ️  Para parar todos los servicios:
echo   stop-app.bat
echo.
echo ⚠️  IMPORTANTE: Si quieres usar APIs externas (WooCommerce, Holded, etc.),
echo ⚠️  edita el archivo supabase\functions\.env con tus API keys reales.
echo.
echo ✅ ¡Instalación completada! Ejecuta 'npm run dev' para iniciar la aplicación.
echo.
pause
