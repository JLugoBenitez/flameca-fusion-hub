-- Actualizar los valores de status existentes a los nuevos valores
UPDATE public.suit_repairs
SET status = CASE
  WHEN status IN ('completed', 'pending', 'in_progress') THEN 'Procesando'
  WHEN status = 'cancelled' THEN 'Procesando'
  ELSE 'Procesando'
END;

-- Eliminar la restricción CHECK anterior (buscar el nombre real en pg_constraint)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar el nombre de la restricción CHECK para status
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.suit_repairs'::regclass
    AND contype = 'c'
    AND EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = conrelid 
      AND attnum = ANY(conkey) 
      AND attname = 'status'
    );
  
  -- Si encontramos la restricción, eliminarla
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.suit_repairs DROP CONSTRAINT %I', constraint_name);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay algún error, simplemente continuar
    NULL;
END $$;

-- Agregar nueva restricción CHECK con los valores simplificados
ALTER TABLE public.suit_repairs
ADD CONSTRAINT suit_repairs_status_check 
CHECK (status IN ('Completado', 'Procesando'));

-- Establecer el valor por defecto
ALTER TABLE public.suit_repairs
ALTER COLUMN status SET DEFAULT 'Procesando';
