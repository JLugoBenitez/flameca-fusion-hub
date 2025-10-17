#!/usr/bin/env node

// Instalador automático para Flamenco Fusion Hub
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎭 ===============================================');
console.log('🎭    FLAMENCO FUSION HUB - INSTALADOR .EXE');
console.log('🎭 ===============================================');
console.log('');

// Verificar que estamos en el directorio correcto
if (!fs.existsSync('package.json')) {
  console.log('❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.');
  process.exit(1);
}

console.log('✅ Estamos en el directorio correcto');
console.log('');

// Función para ejecutar comandos
function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado`);
    console.log('');
  } catch (error) {
    console.log(`❌ Error en ${description}: ${error.message}`);
    process.exit(1);
  }
}

// Función para verificar si un comando existe
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Verificar requisitos
console.log('🔍 Verificando requisitos...');

if (!commandExists('docker')) {
  console.log('❌ Docker no está instalado. Por favor instala Docker Desktop.');
  process.exit(1);
}
console.log('✅ Docker está disponible');

if (!commandExists('node')) {
  console.log('❌ Node.js no está instalado. Por favor instala Node.js 18+.');
  process.exit(1);
}
console.log('✅ Node.js está disponible');

if (!commandExists('npm')) {
  console.log('❌ npm no está disponible. Por favor instala Node.js.');
  process.exit(1);
}
console.log('✅ npm está disponible');
console.log('');

// Crear directorio supabase si no existe
if (!fs.existsSync('supabase/functions')) {
  console.log('🔄 Creando directorio supabase/functions...');
  fs.mkdirSync('supabase/functions', { recursive: true });
  console.log('✅ Directorio creado');
  console.log('');
}

// Crear archivo .env
console.log('🔄 Creando archivo .env...');
const envContent = `# Configuración de APIs externas
WOOCOMMERCE_URL=https://tu-tienda.com
WOOCOMMERCE_CONSUMER_KEY=ck_tu_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=cs_tu_consumer_secret
HOLDED_API_KEY=tu_holded_api_key
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password`;

fs.writeFileSync('supabase/functions/.env', envContent);
console.log('✅ Archivo .env creado');
console.log('');

// Instalar dependencias
runCommand('npm install', 'Instalando dependencias de Node.js');

// Instalar Supabase CLI localmente
runCommand('npm install supabase --save-dev', 'Instalando Supabase CLI localmente');

// Limpiar Docker
runCommand('docker stop $(docker ps -q) 2>/dev/null || true', 'Limpiando contenedores Docker');
runCommand('docker rm $(docker ps -aq) 2>/dev/null || true', 'Limpiando contenedores Docker');

// Iniciar Supabase
runCommand('npx supabase stop', 'Deteniendo Supabase si está ejecutándose');
runCommand('npx supabase start', 'Iniciando Supabase');

// Iniciar Edge Functions en background
console.log('🔄 Iniciando Edge Functions...');
const edgeFunctions = spawn('npx', ['supabase', 'functions', 'serve', '--no-verify-jwt', '--env-file', '.env'], {
  cwd: 'supabase/functions',
  stdio: 'ignore',
  detached: true
});
edgeFunctions.unref();
console.log('✅ Edge Functions iniciadas');
console.log('');

// Mostrar información final
console.log('🎉 ===============================================');
console.log('🎉        ¡INSTALACIÓN COMPLETADA!');
console.log('🎉 ===============================================');
console.log('');
console.log('ℹ️  URLs disponibles:');
console.log('  🌐 Aplicación Frontend: http://localhost:5173');
console.log('  🗄️  Supabase Studio: http://localhost:54323');
console.log('  🔌 API REST: http://localhost:54321');
console.log('  📧 Mailpit: http://localhost:54324');
console.log('');
console.log('ℹ️  Credenciales de prueba:');
console.log('  👤 Admin: admin@flamenca.com / admin123');
console.log('');
console.log('ℹ️  Para iniciar la aplicación frontend:');
console.log('  npm run dev');
console.log('');
console.log('✅ ¡Instalación completada! Ejecuta "npm run dev" para iniciar la aplicación.');
console.log('');

// Pausa para que el usuario pueda leer
console.log('Presiona Enter para continuar...');
process.stdin.once('data', () => {
  process.exit(0);
});
