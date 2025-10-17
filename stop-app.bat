@echo off

REM 🛑 SCRIPT DE PARADA - FLAMENCO FUSION HUB (WINDOWS)
REM Este script detiene todos los servicios de la aplicación

echo.
echo 🛑 ===============================================
echo 🛑    FLAMENCO FUSION HUB - PARANDO SERVICIOS
echo 🛑 ===============================================
echo.

REM Parar Edge Functions
echo ℹ️  Deteniendo Edge Functions...
taskkill /f /im "supabase.exe" >nul 2>&1
echo ✅ Edge Functions detenidas

REM Parar Supabase
echo ℹ️  Deteniendo Supabase...
supabase stop >nul 2>&1
echo ✅ Supabase detenido

REM Limpiar contenedores Docker
echo ℹ️  Limpiando contenedores Docker...
for /f %%i in ('docker ps -q') do docker stop %%i >nul 2>&1
for /f %%i in ('docker ps -aq') do docker rm %%i >nul 2>&1
echo ✅ Contenedores limpiados

echo.
echo 🛑 ===============================================
echo 🛑           ¡SERVICIOS DETENIDOS!
echo 🛑 ===============================================
echo.
echo ✅ Todos los servicios han sido detenidos correctamente
echo.
pause
