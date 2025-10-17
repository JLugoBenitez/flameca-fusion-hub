@echo off

echo.
echo VERIFICACION DE NPX
echo ===================
echo.

echo Directorio actual: %CD%
echo.

echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no funciona
    pause
    exit /b 1
)
echo OK: Node.js funciona
echo.

echo Verificando npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm no funciona
    pause
    exit /b 1
)
echo OK: npm funciona
echo.

echo Verificando npx...
npx --version
if errorlevel 1 (
    echo ERROR: npx no funciona
    pause
    exit /b 1
)
echo OK: npx funciona
echo.

echo Verificando npx con comando simple...
npx --help
if errorlevel 1 (
    echo ERROR: npx --help no funciona
    pause
    exit /b 1
)
echo OK: npx --help funciona
echo.

echo Verificando npx con supabase...
npx supabase@latest --help
if errorlevel 1 (
    echo ERROR: npx supabase no funciona
    pause
    exit /b 1
)
echo OK: npx supabase funciona
echo.

echo TODAS LAS VERIFICACIONES PASARON
echo.
pause
