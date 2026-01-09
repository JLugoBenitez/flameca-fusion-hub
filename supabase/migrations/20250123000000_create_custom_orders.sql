-- Crear tabla para encargos personalizados
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  fabric TEXT,
  size TEXT,
  model TEXT,
  observations TEXT,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índice para búsqueda rápida por número de encargo
CREATE INDEX IF NOT EXISTS idx_custom_orders_order_number ON public.custom_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_name ON public.custom_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_custom_orders_order_date ON public.custom_orders(order_date);

-- Habilitar RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para encargos
CREATE POLICY "Users can view custom orders" ON public.custom_orders
  FOR SELECT USING (true);

CREATE POLICY "Users can insert custom orders" ON public.custom_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update custom orders" ON public.custom_orders
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete custom orders" ON public.custom_orders
  FOR DELETE USING (true);

-- Función para generar número de encargo automático
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Obtener el siguiente número de secuencia para este año
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.custom_orders
  WHERE order_number LIKE 'ENC-' || year_part || '-%';
  
  new_number := 'ENC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

