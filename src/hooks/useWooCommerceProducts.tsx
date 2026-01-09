import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useWooCommerceProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 50;

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

  const fetchProducts = useCallback(async (page: number = 1, params: { stock_status?: string; search?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'list',
          params: {
            page,
            per_page: productsPerPage,
            ...params
          }
        }
      });

      if (error) throw error;

      const pageProducts = data?.data || [];
      const pagination = data?.pagination;

      // Transformar productos de WooCommerce al formato esperado
      const transformedProducts = pageProducts.map(transformProduct);

      setProducts(transformedProducts);
      setCurrentPage(page);
      
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalProducts(pagination.total || 0);
      } else {
        // Si no hay paginación, asumir que hay más páginas si obtuvimos productosPerPage productos
        setTotalPages(pageProducts.length === productsPerPage ? page + 1 : page);
        setTotalProducts(pageProducts.length);
      }

      console.log(`✅ Página ${page}: ${transformedProducts.length} productos de WooCommerce`);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.message || 'Error al cargar productos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [transformProduct, productsPerPage]);

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
        body: { action: 'list', params: { page: 1, per_page: 1 } },
      });

      if (error) {
        throw new Error(`Error en sincronización de productos: ${error.message}`);
      }

      // Recargar los productos después de la sincronización (primera página)
      await fetchProducts(1);
    } catch (error) {
      console.error('Error en sincronización de productos:', error);
      throw error;
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalProducts,
    productsPerPage,
    fetchProducts,
    updateProductStock,
    syncProducts,
    goToPage: useCallback((page: number) => fetchProducts(page), [fetchProducts]),
    nextPage: useCallback(() => {
      if (currentPage < totalPages) {
        fetchProducts(currentPage + 1);
      }
    }, [currentPage, totalPages, fetchProducts]),
    prevPage: useCallback(() => {
      if (currentPage > 1) {
        fetchProducts(currentPage - 1);
      }
    }, [currentPage, fetchProducts]),
    refetch: useCallback(() => fetchProducts(currentPage), [currentPage, fetchProducts])
  };
}
