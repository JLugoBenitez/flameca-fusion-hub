@echo off
chcp 65001 >nul

echo.
echo 🔍 DIAGNÓSTICO DE NPX
echo ====================
echo.

echo Directorio actual: %CD%
echo.

echo Probando npx --version...
npx --version
echo.

echo ¿Llegaste hasta aquí?
echo.

echo Probando npx supabase --version...
npx supabase@latest --version
echo.

echo ¿Llegaste hasta aquí también?
echo.

pause
