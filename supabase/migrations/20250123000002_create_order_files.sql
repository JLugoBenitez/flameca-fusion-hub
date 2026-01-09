-- Crear tabla para archivos de encargos
CREATE TABLE IF NOT EXISTS public.custom_order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para archivos de arreglos
CREATE TABLE IF NOT EXISTS public.suit_repair_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suit_repair_id UUID NOT NULL REFERENCES public.suit_repairs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_custom_order_files_order_id ON public.custom_order_files(custom_order_id);
CREATE INDEX IF NOT EXISTS idx_suit_repair_files_repair_id ON public.suit_repair_files(suit_repair_id);

-- Habilitar RLS
ALTER TABLE public.custom_order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suit_repair_files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para archivos de encargos
CREATE POLICY "Users can view custom order files" ON public.custom_order_files
  FOR SELECT USING (true);

CREATE POLICY "Users can insert custom order files" ON public.custom_order_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete custom order files" ON public.custom_order_files
  FOR DELETE USING (true);

-- Políticas RLS para archivos de arreglos
CREATE POLICY "Users can view suit repair files" ON public.suit_repair_files
  FOR SELECT USING (true);

CREATE POLICY "Users can insert suit repair files" ON public.suit_repair_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete suit repair files" ON public.suit_repair_files
  FOR DELETE USING (true);

-- Crear buckets de storage si no existen (esto se ejecuta manualmente en Supabase Dashboard)
-- Bucket: custom-orders-files
-- Bucket: suit-repairs-files

