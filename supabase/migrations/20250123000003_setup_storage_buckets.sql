-- NOTA: Los buckets de storage deben crearse manualmente desde el Dashboard de Supabase
-- o usando la API. Este archivo contiene las políticas RLS para los buckets.
-- 
-- Pasos para crear los buckets:
-- 1. Ve a Storage en el Dashboard de Supabase
-- 2. Crea un bucket llamado "custom-orders-files" (público)
-- 3. Crea un bucket llamado "suit-repairs-files" (público)
-- 4. Luego ejecuta este SQL para aplicar las políticas

-- Políticas para el bucket custom-orders-files
-- (Estas políticas se aplican automáticamente si el bucket es público,
-- pero puedes personalizarlas según tus necesidades de seguridad)

-- Políticas para el bucket suit-repairs-files
-- (Estas políticas se aplican automáticamente si el bucket es público,
-- pero puedes personalizarlas según tus necesidades de seguridad)

-- Si necesitas políticas más restrictivas, puedes usar:
-- CREATE POLICY "Users can upload custom order files" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'custom-orders-files' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Users can view custom order files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'custom-orders-files');
--
-- CREATE POLICY "Users can delete custom order files" ON storage.objects
--   FOR DELETE USING (bucket_id = 'custom-orders-files' AND auth.role() = 'authenticated');

