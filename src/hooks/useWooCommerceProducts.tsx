import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useWooCommerceProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformProduct = useCallback((product: any): Product => ({
    id: product.id,
    name: product.name,
    price: parseFloat(product.price),
    stock: product.stock_quantity || 0,
    stock_quantity: product.stock_quantity || null,
    category: product.categories?.[0]?.name || 'General',
    woocommerce_id: product.id,
    description: product.description,
    sku: product.sku,
    status: product.status,
    stock_status: product.stock_status,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    on_sale: product.on_sale,
    purchasable: product.purchasable,
    virtual: product.virtual,
    downloadable: product.downloadable,
    weight: product.weight,
    dimensions: product.dimensions,
    shipping_required: product.shipping_required,
    reviews_allowed: product.reviews_allowed,
    average_rating: product.average_rating,
    rating_count: product.rating_count,
    categories: product.categories,
    tags: product.tags,
    images: product.images,
    attributes: product.attributes,
    default_attributes: product.default_attributes,
    variations: product.variations,
    grouped_products: product.grouped_products,
    menu_order: product.menu_order,
    price_html: product.price_html,
    related_ids: product.related_ids,
    meta_data: product.meta_data,
    has_options: product.has_options,
    post_password: product.post_password,
    global_unique_id: product.global_unique_id,
    exclude_global_add_ons: product.exclude_global_add_ons,
    addons: product.addons,
    jetpack_publicize_connections: product.jetpack_publicize_connections,
    jetpack_sharing_enabled: product.jetpack_sharing_enabled,
    jetpack_likes_enabled: product.jetpack_likes_enabled,
    _links: product._links
  }), []);

  const fetchProducts = useCallback(async (params: { per_page?: number; stock_status?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'list',
          params: {
            per_page: 100,
            ...params
          }
        }
      });

      if (error) throw error;

      // Transformar productos de WooCommerce al formato esperado
      const transformedProducts = (data.data || []).map(transformProduct);

      setProducts(transformedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.message || 'Error al cargar productos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [transformProduct]);

  const updateProductStock = useCallback(async (productId: number, newStock: number) => {
    try {
      await supabase.functions.invoke("sync-woocommerce-products", {
        body: { 
          action: "update",
          productId: productId,
          productData: {
            stock_quantity: newStock,
            stock_status: newStock > 0 ? 'instock' : 'outofstock'
          }
        }
      });

      // Actualizar el estado local
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, stock: newStock, stock_status: newStock > 0 ? 'instock' : 'outofstock' }
          : product
      ));
    } catch (err: any) {
      console.error('Error updating product stock:', err);
      toast.error('Error al actualizar stock del producto');
      throw err;
    }
  }, []);

  const syncProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { action: 'list' },
      });

      if (error) {
        throw new Error(`Error en sincronización de productos: ${error.message}`);
      }

      // Recargar los productos después de la sincronización
      await fetchProducts();
    } catch (error) {
      console.error('Error en sincronización de productos:', error);
      throw error;
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    updateProductStock,
    syncProducts,
    refetch: useCallback(() => fetchProducts(), [fetchProducts])
  };
}
