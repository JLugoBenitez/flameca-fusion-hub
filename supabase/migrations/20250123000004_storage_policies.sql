-- Políticas RLS para Storage Buckets
-- IMPORTANTE: Los buckets deben crearse primero en el Dashboard de Supabase
-- Bucket: custom-orders-files (público)
-- Bucket: suit-repairs-files (público)

-- Políticas para custom-orders-files
-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload custom order files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'custom-orders-files');

-- Permitir a todos ver archivos (si el bucket es público)
CREATE POLICY "Public can view custom order files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'custom-orders-files');

-- Permitir a usuarios autenticados eliminar sus propios archivos
CREATE POLICY "Authenticated users can delete custom order files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'custom-orders-files');

-- Políticas para suit-repairs-files
-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload suit repair files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'suit-repairs-files');

-- Permitir a todos ver archivos (si el bucket es público)
CREATE POLICY "Public can view suit repair files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'suit-repairs-files');

-- Permitir a usuarios autenticados eliminar sus propios archivos
CREATE POLICY "Authenticated users can delete suit repair files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'suit-repairs-files');

