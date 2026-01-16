import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Variation } from '@/types';
import { toast } from 'sonner';

export function useProductVariations() {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariations = useCallback(async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todas las variaciones del producto (puede haber múltiples páginas)
      let allVariations: Variation[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const { data, error: fetchError } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: {
            action: 'get_variations',
            productId,
            params: {
              page: currentPage,
              per_page: 100
            }
          }
        });

        if (fetchError) {
          throw fetchError;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const pageVariations = (data?.data || []) as Variation[];
        allVariations = [...allVariations, ...pageVariations];

        // Verificar si hay más páginas
        const totalPages = data?.pagination?.totalPages || 1;
        hasMore = currentPage < totalPages;
        currentPage++;
      }

      setVariations(allVariations);
      return allVariations;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al obtener variaciones';
      setError(errorMessage);
      console.error('❌ Error fetching variations:', err);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    variations,
    loading,
    error,
    fetchVariations
  };
}
