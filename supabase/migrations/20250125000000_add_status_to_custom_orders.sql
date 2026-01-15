-- Agregar campo status a custom_orders
ALTER TABLE public.custom_orders
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Procesando' 
CHECK (status IN ('Completado', 'Procesando'));

-- Crear índice para búsqueda rápida por estado
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);
