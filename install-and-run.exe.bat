@echo off
chcp 65001 >nul

REM 🚀 SCRIPT DE INSTALACIÓN COMPLETA - FLAMENCO FUSION HUB
REM Este script instala todo lo necesario y ejecuta la aplicación

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
echo 🔄 PASO 2: Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado.
    echo ℹ️  Por favor instala Node.js 18+ desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js está instalado

REM PASO 3: Instalar Supabase CLI localmente
echo 🔄 PASO 3: Instalando Supabase CLI localmente...
npm install supabase --save-dev >nul 2>&1
if errorlevel 1 (
    echo ❌ Error al instalar Supabase CLI
    pause
    exit /b 1
)
echo ✅ Supabase CLI instalado localmente

REM PASO 4: Crear archivo .env si no existe
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
echo 🔄 PASO 5: Instalando dependencias de Node.js...
npm install >nul 2>&1
if errorlevel 1 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

REM PASO 6: Limpiar y configurar Docker
echo 🔄 PASO 6: Configurando Docker...
docker stop $(docker ps -q) 2>nul
docker rm $(docker ps -aq) 2>nul
echo ✅ Docker configurado

REM PASO 7: Iniciar Supabase
echo 🔄 PASO 7: Iniciando Supabase...
npx supabase stop 2>nul
npx supabase start >nul 2>&1
if errorlevel 1 (
    echo ❌ Error al iniciar Supabase
    pause
    exit /b 1
)
echo ✅ Supabase iniciado correctamente

REM PASO 8: Iniciar Edge Functions
echo 🔄 PASO 8: Iniciando Edge Functions...
taskkill /f /im "node.exe" 2>nul
timeout /t 2 /nobreak >nul
cd supabase\functions
start /b npx supabase functions serve --no-verify-jwt --env-file .env >nul 2>&1
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
echo Presiona cualquier tecla para continuar...
pause >nul