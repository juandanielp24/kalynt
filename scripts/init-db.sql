-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear schema para auditoría
CREATE SCHEMA IF NOT EXISTS audit;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully!';
END $$;
