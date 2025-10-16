#!/bin/bash

# Script simple para setup que funcione
set -e

echo "🏪 STORE MANAGEMENT APP - SETUP SIMPLE"
echo "======================================"

# Verificar Docker
echo "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está funcionando. Por favor inicia Docker Desktop."
    exit 1
fi
echo "✅ Docker está funcionando"

# Limpiar todo
echo "Limpiando instalación anterior..."
docker-compose down -v > /dev/null 2>&1 || true
docker system prune -f > /dev/null 2>&1 || true

# Usar solo PostgreSQL normal (no Supabase)
echo "Iniciando PostgreSQL..."
docker-compose up -d postgres

# Esperar PostgreSQL
echo "Esperando PostgreSQL..."
sleep 10

# Iniciar Edge Functions
echo "Iniciando Edge Functions..."
docker-compose up -d edge-functions

# Esperar Edge Functions
echo "Esperando Edge Functions..."
sleep 10

# Iniciar Frontend
echo "Iniciando Frontend..."
docker-compose up -d frontend

# Esperar Frontend
echo "Esperando Frontend..."
sleep 30

echo ""
echo "🎉 SETUP COMPLETADO"
echo "=================="
echo ""
echo "✅ PostgreSQL: localhost:5432"
echo "✅ Frontend: http://localhost:3000"
echo "✅ Edge Functions: http://localhost:8081"
echo ""
echo "Credenciales:"
echo "  Admin: admin@flamenca.com / admin123"
echo "  Empleado: empleado@flamenca.com / empleado123"
echo ""
echo "Para ver logs: docker-compose logs -f [servicio]"
echo "Para parar: docker-compose down"
echo ""
