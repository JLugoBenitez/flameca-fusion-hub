-- Migración inicial para Store Management App
-- Esta migración se ejecuta automáticamente al crear el contenedor PostgreSQL

-- Crear base de datos si no existe
SELECT 'CREATE DATABASE flamenco_fusion'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'flamenco_fusion')\gexec

-- Conectar a la base de datos
\c flamenco_fusion;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear esquema público si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Configurar permisos básicos
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos flamenco_fusion inicializada correctamente';
END $$;
