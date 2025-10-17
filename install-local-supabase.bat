@echo off

echo.
echo FLAMENCO FUSION HUB - INSTALACION CON SUPABASE LOCAL
echo =====================================================
echo.

REM Verificar directorio
if not exist "package.json" (
    echo ERROR: No se encontro package.json
    echo Asegurate de estar en el directorio del proyecto
    echo Directorio actual: %CD%
    pause
    exit /b 1
)

echo OK: Estamos en el directorio correcto
echo.

REM Verificar Docker
echo Verificando Docker...
docker --version
if errorlevel 1 (
    echo ERROR: Docker no esta instalado
    pause
    exit /b 1
)
echo OK: Docker funciona
echo.

REM Verificar Node.js
echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    pause
    exit /b 1
)
echo OK: Node.js funciona
echo.

REM Verificar npm
echo Verificando npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm no esta instalado
    pause
    exit /b 1
)
echo OK: npm funciona
echo.

REM Crear directorio supabase si no existe
if not exist "supabase\functions" (
    echo Creando directorio supabase\functions...
    mkdir "supabase\functions"
)

REM Crear archivo .env
echo Creando archivo .env...
(
echo # Configuracion de APIs externas
echo WOOCOMMERCE_URL=https://tu-tienda.com
echo WOOCOMMERCE_CONSUMER_KEY=ck_tu_consumer_key
echo WOOCOMMERCE_CONSUMER_SECRET=cs_tu_consumer_secret
echo HOLDED_API_KEY=tu_holded_api_key
echo TWILIO_ACCOUNT_SID=tu_twilio_sid
echo TWILIO_AUTH_TOKEN=tu_twilio_token
echo TWILIO_PHONE_NUMBER=+1234567890
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USER=tu_email@gmail.com
echo SMTP_PASS=tu_password
) > "supabase\functions\.env"
echo OK: Archivo .env creado
echo.

REM Instalar dependencias
echo Instalando dependencias...
npm install
if errorlevel 1 (
    echo ERROR: Error al instalar dependencias
    pause
    exit /b 1
)
echo OK: Dependencias instaladas
echo.

REM Instalar Supabase CLI localmente
echo Instalando Supabase CLI localmente...
npm install supabase --save-dev
if errorlevel 1 (
    echo ERROR: Error al instalar Supabase CLI
    pause
    exit /b 1
)
echo OK: Supabase CLI instalado localmente
echo.

REM Limpiar Docker
echo Limpiando Docker...
docker stop $(docker ps -q) >nul 2>&1
docker rm $(docker ps -aq) >nul 2>&1
echo OK: Docker limpiado
echo.

REM Iniciar Supabase usando npx con la version local
echo Iniciando Supabase...
npx supabase stop >nul 2>&1
npx supabase start
if errorlevel 1 (
    echo ERROR: Error al iniciar Supabase
    pause
    exit /b 1
)
echo OK: Supabase iniciado
echo.

REM Iniciar Edge Functions
echo Iniciando Edge Functions...
cd supabase\functions
start /b npx supabase functions serve --no-verify-jwt --env-file .env
cd ..\..
timeout /t 3 /nobreak >nul
echo OK: Edge Functions iniciadas
echo.

echo =========================================
echo INSTALACION COMPLETADA!
echo =========================================
echo.
echo URLs disponibles:
echo - Aplicacion: http://localhost:5173
echo - Supabase Studio: http://localhost:54323
echo - API REST: http://localhost:54321
echo - Mailpit: http://localhost:54324
echo.
echo Credenciales: admin@flamenca.com / admin123
echo.
echo Para iniciar la aplicacion: npm run dev
echo.
echo Para parar servicios: stop-app-npx.bat
echo.
pause
