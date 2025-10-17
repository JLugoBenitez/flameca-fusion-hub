@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🎭 ===============================================
echo 🎭    FLAMENCO FUSION HUB - INSTALACIÓN PASO A PASO
echo 🎭 ===============================================
echo.

echo ℹ️  Este script te guiará paso a paso para evitar que se cierre
echo.

REM Verificar directorio
if not exist "package.json" (
    echo ❌ No se encontró package.json
    echo Directorio actual: %CD%
    pause
    exit /b 1
)

echo ✅ Estamos en el directorio correcto
echo.

REM PASO 1: Verificar Docker
echo 🔄 PASO 1: Verificando Docker...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Probando docker --version...
docker --version
if errorlevel 1 (
    echo ❌ Docker no está instalado
    pause
    exit /b 1
)
echo ✅ Docker funciona
echo.

echo ℹ️  Probando docker info...
docker info
if errorlevel 1 (
    echo ❌ Docker no está ejecutándose
    pause
    exit /b 1
)
echo ✅ Docker está ejecutándose
echo.

REM PASO 2: Verificar Node.js
echo 🔄 PASO 2: Verificando Node.js...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Probando node --version...
node --version
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)
echo ✅ Node.js funciona
echo.

REM PASO 3: Verificar npm
echo 🔄 PASO 3: Verificando npm...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Probando npm --version...
npm --version
if errorlevel 1 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)
echo ✅ npm funciona
echo.

REM PASO 4: Verificar npx
echo 🔄 PASO 4: Verificando npx...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Probando npx --version...
npx --version
if errorlevel 1 (
    echo ❌ npx no está instalado
    pause
    exit /b 1
)
echo ✅ npx funciona
echo.

REM PASO 5: Crear .env
echo 🔄 PASO 5: Creando archivo .env...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

if not exist "supabase\functions\.env" (
    echo ℹ️  Creando archivo .env...
    if not exist "supabase\functions" (
        mkdir "supabase\functions"
    )
    echo # Configuración de APIs > "supabase\functions\.env"
    echo ✅ Archivo .env creado
) else (
    echo ✅ Archivo .env ya existe
)
echo.

REM PASO 6: Instalar dependencias
echo 🔄 PASO 6: Instalando dependencias...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Ejecutando npm install...
npm install
if errorlevel 1 (
    echo ❌ Error en npm install
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

REM PASO 7: Limpiar Docker
echo 🔄 PASO 7: Limpiando Docker...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Deteniendo contenedores...
docker stop $(docker ps -q) >nul 2>&1
docker rm $(docker ps -aq) >nul 2>&1
echo ✅ Docker limpiado
echo.

REM PASO 8: Iniciar Supabase
echo 🔄 PASO 8: Iniciando Supabase...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Deteniendo Supabase si está ejecutándose...
npx supabase@latest stop >nul 2>&1
echo ℹ️  Iniciando Supabase...
npx supabase@latest start
if errorlevel 1 (
    echo ❌ Error al iniciar Supabase
    pause
    exit /b 1
)
echo ✅ Supabase iniciado
echo.

REM PASO 9: Iniciar Edge Functions
echo 🔄 PASO 9: Iniciando Edge Functions...
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo ℹ️  Iniciando Edge Functions...
cd supabase\functions
start /b npx supabase@latest functions serve --no-verify-jwt --env-file .env
cd ..\..
timeout /t 3 /nobreak >nul
echo ✅ Edge Functions iniciadas
echo.

echo 🎉 ===============================================
echo 🎉        ¡INSTALACIÓN COMPLETADA!
echo 🎉 ===============================================
echo.
echo ℹ️  URLs disponibles:
echo   🌐 Aplicación: http://localhost:5173
echo   🗄️  Supabase Studio: http://localhost:54323
echo   🔌 API REST: http://localhost:54321
echo   📧 Mailpit: http://localhost:54324
echo.
echo ℹ️  Credenciales: admin@flamenca.com / admin123
echo.
echo ℹ️  Para iniciar la aplicación: npm run dev
echo.
pause
