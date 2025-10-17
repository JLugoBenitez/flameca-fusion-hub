@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 🚀 SCRIPT DE INSTALACIÓN CON DEBUG - FLAMENCO FUSION HUB (WINDOWS)
REM Versión con más información de debug para diagnosticar problemas

echo.
echo 🎭 ===============================================
echo 🎭    FLAMENCO FUSION HUB - INSTALACIÓN DEBUG
echo 🎭 ===============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.
    echo.
    echo Directorio actual: %CD%
    echo.
    pause
    exit /b 1
)

echo ℹ️  Verificando requisitos del sistema...
echo Directorio actual: %CD%
echo.

REM PASO 1: Verificar Docker
echo.
echo 🔄 PASO 1: Verificando Docker...
echo ℹ️  Probando comando docker...
docker --version
if errorlevel 1 (
    echo.
    echo ❌ Docker no está instalado.
    echo ℹ️  Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/
    echo ℹ️  Después de instalar Docker, reinicia este script.
    pause
    exit /b 1
)

echo ℹ️  Probando docker info...
docker info
if errorlevel 1 (
    echo.
    echo ❌ Docker no está ejecutándose.
    echo ℹ️  Por favor inicia Docker Desktop y vuelve a ejecutar este script.
    pause
    exit /b 1
)
echo ✅ Docker está instalado y funcionando
echo.

REM PASO 2: Verificar Node.js
echo.
echo 🔄 PASO 2: Verificando Node.js...
echo ℹ️  Probando comando node...
node --version
if errorlevel 1 (
    echo.
    echo ❌ Node.js no está instalado.
    echo ℹ️  Por favor instala Node.js 18+ desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("!NODE_VERSION!") do set NODE_MAJOR=%%i
echo ℹ️  Versión de Node.js detectada: !NODE_VERSION!
echo ℹ️  Versión mayor: !NODE_MAJOR!

if !NODE_MAJOR! LSS 18 (
    echo.
    echo ❌ Node.js versión !NODE_VERSION! detectada. Se requiere versión 18 o superior.
    echo ℹ️  Por favor actualiza Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js !NODE_VERSION! está instalado
echo.

REM PASO 3: Verificar npx
echo.
echo 🔄 PASO 3: Verificando npx...
echo ℹ️  Probando comando npx...
npx --version
if errorlevel 1 (
    echo.
    echo ❌ npx no está disponible. Actualiza Node.js.
    echo ℹ️  npx debería venir incluido con Node.js 18+
    echo ℹ️  Intenta reinstalar Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ npx está disponible
echo.

REM PASO 4: Verificar npm
echo.
echo 🔄 PASO 4: Verificando npm...
echo ℹ️  Probando comando npm...
npm --version
if errorlevel 1 (
    echo.
    echo ❌ npm no está disponible.
    echo ℹ️  npm debería venir incluido con Node.js
    pause
    exit /b 1
)
echo ✅ npm está disponible
echo.

REM PASO 5: Crear archivo .env
echo.
echo 🔄 PASO 5: Configurando variables de entorno...
if not exist "supabase\functions\.env" (
    echo ⚠️  Archivo .env no encontrado. Creando archivo de configuración...
    if not exist "supabase\functions" (
        echo ℹ️  Creando directorio supabase\functions...
        mkdir "supabase\functions"
    )
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
        echo # Twilio ^(para SMS/WhatsApp^)
        echo TWILIO_ACCOUNT_SID=tu_twilio_sid
        echo TWILIO_AUTH_TOKEN=tu_twilio_token
        echo TWILIO_PHONE_NUMBER=+1234567890
        echo.
        echo # Email ^(opcional^)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=tu_email@gmail.com
        echo SMTP_PASS=tu_password
    ) > "supabase\functions\.env"
    echo ✅ Archivo .env creado con valores de ejemplo
    echo ⚠️  IMPORTANTE: Edita supabase\functions\.env con tus API keys reales
) else (
    echo ✅ Archivo .env ya existe
)
echo.

REM PASO 6: Instalar dependencias
echo.
echo 🔄 PASO 6: Instalando dependencias de Node.js...
echo ℹ️  Ejecutando npm install...
npm install
if errorlevel 1 (
    echo.
    echo ❌ Error al instalar dependencias
    echo ℹ️  Revisa los mensajes de error anteriores
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

REM PASO 7: Configurar Docker
echo.
echo 🔄 PASO 7: Configurando Docker...
echo ℹ️  Deteniendo contenedores existentes...
docker stop $(docker ps -q) >nul 2>&1
docker rm $(docker ps -aq) >nul 2>&1
echo ✅ Docker configurado
echo.

REM PASO 8: Iniciar Supabase
echo.
echo 🔄 PASO 8: Iniciando Supabase con npx...
echo ℹ️  Deteniendo Supabase si está ejecutándose...
npx supabase@latest stop >nul 2>&1
echo ℹ️  Iniciando Supabase...
npx supabase@latest start
if errorlevel 1 (
    echo.
    echo ❌ Error al iniciar Supabase
    echo ℹ️  Revisa los mensajes de error anteriores
    pause
    exit /b 1
)
echo ✅ Supabase iniciado correctamente
echo.

REM PASO 9: Iniciar Edge Functions
echo.
echo 🔄 PASO 9: Iniciando Edge Functions...
echo ℹ️  Deteniendo procesos node existentes...
taskkill /f /im "node.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo ℹ️  Iniciando Edge Functions en background...
cd supabase\functions
start /b npx supabase@latest functions serve --no-verify-jwt --env-file .env
cd ..\..
timeout /t 3 /nobreak >nul
echo ✅ Edge Functions iniciadas
echo.

REM PASO 10: Mostrar información final
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
echo   stop-app-npx.bat
echo.
echo ⚠️  IMPORTANTE: Si quieres usar APIs externas ^(WooCommerce, Holded, etc.^),
echo ⚠️  edita el archivo supabase\functions\.env con tus API keys reales.
echo.
echo ✅ ¡Instalación completada! Ejecuta 'npm run dev' para iniciar la aplicación.
echo.
pause
