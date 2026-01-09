-- Crear tabla para arreglos de trajes
CREATE TABLE IF NOT EXISTS public.suit_repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_number TEXT UNIQUE NOT NULL,
  repair_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  garment_type TEXT,
  repair_type TEXT,
  size TEXT,
  observations TEXT,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  price DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_suit_repairs_repair_number ON public.suit_repairs(repair_number);
CREATE INDEX IF NOT EXISTS idx_suit_repairs_customer_name ON public.suit_repairs(customer_name);
CREATE INDEX IF NOT EXISTS idx_suit_repairs_repair_date ON public.suit_repairs(repair_date);
CREATE INDEX IF NOT EXISTS idx_suit_repairs_status ON public.suit_repairs(status);

-- Habilitar RLS
ALTER TABLE public.suit_repairs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para arreglos de trajes
CREATE POLICY "Users can view suit repairs" ON public.suit_repairs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert suit repairs" ON public.suit_repairs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update suit repairs" ON public.suit_repairs
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete suit repairs" ON public.suit_repairs
  FOR DELETE USING (true);

-- Función para generar número de arreglo automático
CREATE OR REPLACE FUNCTION generate_repair_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Obtener el siguiente número de secuencia para este año
  SELECT COALESCE(MAX(CAST(SUBSTRING(repair_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.suit_repairs
  WHERE repair_number LIKE 'ARR-' || year_part || '-%';
  
  new_number := 'ARR-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_suit_repairs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suit_repairs_updated_at
  BEFORE UPDATE ON public.suit_repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_suit_repairs_updated_at();

