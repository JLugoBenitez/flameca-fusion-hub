@echo off
chcp 65001 >nul

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
docker stop $(docker ps -q) >nul 2>&1
docker rm $(docker ps -aq) >nul 2>&1
echo ✅ Contenedores limpiados

echo.
echo 🛑 ===============================================
echo 🛑           ¡SERVICIOS DETENIDOS!
echo 🛑 ===============================================
echo.
echo ✅ Todos los servicios han sido detenidos correctamente
echo.
pause
