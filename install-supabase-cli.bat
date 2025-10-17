@echo off

REM 🔧 SCRIPT DE INSTALACIÓN DE SUPABASE CLI PARA WINDOWS
REM Este script instala Supabase CLI usando diferentes métodos

echo.
echo 🔧 ===============================================
echo 🔧    INSTALACIÓN DE SUPABASE CLI PARA WINDOWS
echo 🔧 ===============================================
echo.

REM Verificar si ya está instalado
supabase --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ Supabase CLI ya está instalado
    supabase --version
    echo.
    echo ✅ No es necesario instalar nada más.
    pause
    exit /b 0
)

echo ℹ️  Supabase CLI no está instalado. Selecciona un método de instalación:
echo.
echo 1️⃣  Scoop (Recomendado - más fácil)
echo 2️⃣  Chocolatey
echo 3️⃣  Descarga manual
echo 4️⃣  Salir
echo.

set /p choice="Selecciona una opción (1-4): "

if "%choice%"=="1" goto install_scoop
if "%choice%"=="2" goto install_chocolatey
if "%choice%"=="3" goto install_manual
if "%choice%"=="4" goto exit
goto invalid_choice

:install_scoop
echo.
echo 🔄 Instalando Supabase CLI con Scoop...
echo.

REM Verificar si Scoop está instalado
scoop --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Scoop no está instalado. Instalando Scoop primero...
    echo.
    echo 📋 Ejecutando comandos de instalación de Scoop...
    echo.
    echo 1. Configurando política de ejecución...
    powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
    echo.
    echo 2. Descargando e instalando Scoop...
    powershell -Command "irm get.scoop.sh | iex"
    echo.
    echo 3. Verificando instalación de Scoop...
    scoop --version
    if errorlevel 1 (
        echo ❌ Error al instalar Scoop. Intenta con otro método.
        pause
        exit /b 1
    )
    echo ✅ Scoop instalado correctamente
) else (
    echo ✅ Scoop ya está instalado
)

echo.
echo 🔄 Instalando Supabase CLI...
scoop install supabase
if errorlevel 1 (
    echo ❌ Error al instalar Supabase CLI con Scoop
    pause
    exit /b 1
)

echo ✅ Supabase CLI instalado correctamente con Scoop
goto verify_installation

:install_chocolatey
echo.
echo 🔄 Instalando Supabase CLI con Chocolatey...
echo.

REM Verificar si Chocolatey está instalado
choco --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Chocolatey no está instalado. Instalando Chocolatey primero...
    echo.
    echo 📋 Ejecutando comandos de instalación de Chocolatey...
    echo.
    echo ⚠️  IMPORTANTE: Ejecuta este script como ADMINISTRADOR para instalar Chocolatey
    echo.
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    echo.
    echo 3. Verificando instalación de Chocolatey...
    choco --version
    if errorlevel 1 (
        echo ❌ Error al instalar Chocolatey. Intenta con otro método.
        pause
        exit /b 1
    )
    echo ✅ Chocolatey instalado correctamente
) else (
    echo ✅ Chocolatey ya está instalado
)

echo.
echo 🔄 Instalando Supabase CLI...
choco install supabase -y
if errorlevel 1 (
    echo ❌ Error al instalar Supabase CLI con Chocolatey
    pause
    exit /b 1
)

echo ✅ Supabase CLI instalado correctamente con Chocolatey
goto verify_installation

:install_manual
echo.
echo 📥 Instalación manual de Supabase CLI
echo.
echo 📋 Pasos para instalar manualmente:
echo.
echo 1. Ve a: https://github.com/supabase/cli/releases
echo 2. Descarga la versión para Windows (supabase_windows_amd64.zip)
echo 3. Extrae el archivo supabase.exe
echo 4. Añade la carpeta al PATH del sistema:
echo    - Abre "Variables de entorno" en Windows
echo    - Edita la variable PATH
echo    - Añade la carpeta donde extrajiste supabase.exe
echo.
echo ⚠️  Después de completar estos pasos, vuelve a ejecutar este script.
echo.
pause
exit /b 0

:verify_installation
echo.
echo 🔄 Verificando instalación...
supabase --version
if errorlevel 1 (
    echo ❌ Error: Supabase CLI no se instaló correctamente
    echo.
    echo 💡 Soluciones:
    echo 1. Reinicia la terminal
    echo 2. Verifica que la carpeta esté en el PATH
    echo 3. Intenta con otro método de instalación
    pause
    exit /b 1
)

echo.
echo 🎉 ===============================================
echo 🎉        ¡SUPABASE CLI INSTALADO!
echo 🎉 ===============================================
echo.
echo ✅ Supabase CLI está listo para usar
echo ✅ Ahora puedes ejecutar install-and-run.bat
echo.
pause
exit /b 0

:invalid_choice
echo.
echo ❌ Opción inválida. Por favor selecciona 1, 2, 3 o 4.
echo.
pause
goto :eof

:exit
echo.
echo 👋 Saliendo...
pause
exit /b 0
