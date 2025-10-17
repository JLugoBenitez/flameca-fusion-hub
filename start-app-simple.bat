@echo off
chcp 65001 >nul

REM 🚀 SCRIPT DE INICIO SIMPLE - FLAMENCO FUSION HUB (WINDOWS)
REM Versión optimizada que no se congela

echo.
echo 🎭 ===============================================
echo 🎭    FLAMENCO FUSION HUB - INICIO RÁPIDO
echo 🎭 ===============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.
    pause
    exit /b 1
)

REM PASO 1: Limpiar contenedores existentes
echo 🔄 Limpiando contenedores Docker...
docker stop $(docker ps -q) >nul 2>&1
docker rm $(docker ps -aq) >nul 2>&1
echo ✅ Contenedores limpiados

REM PASO 2: Iniciar Supabase
echo 🔄 Iniciando Supabase...
npx supabase stop >nul 2>&1
npx supabase start >nul 2>&1
echo ✅ Supabase iniciado

REM PASO 3: Iniciar Edge Functions en background
echo 🔄 Iniciando Edge Functions...
taskkill /f /im "node.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
cd supabase\functions
start /b npx supabase functions serve --no-verify-jwt --env-file .env >nul 2>&1
cd ..\..
timeout /t 3 /nobreak >nul
echo ✅ Edge Functions iniciadas

REM PASO 4: Mostrar información
echo.
echo 🎉 ===============================================
echo 🎉           ¡APLICACIÓN LISTA!
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

REM PASO 5: Mostrar instrucciones
echo 🔄 Iniciando aplicación frontend...
echo.
echo ℹ️  Para iniciar la aplicación frontend, ejecuta:
echo   npm run dev
echo.
echo ℹ️  Para parar todos los servicios, ejecuta:
echo   stop-app.bat
echo.

echo ✅ ¡Backend listo! Ahora ejecuta 'npm run dev' para el frontend
echo.
pause
