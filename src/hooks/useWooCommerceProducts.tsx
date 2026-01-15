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

  const fetchProducts = useCallback(async (page: number = 1, params: { stock_status?: string; search?: string; category?: number; stockFilter?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Si hay un filtro de stock específico (no "all" ni "out-of-stock"), necesitamos obtener TODOS los productos
      // y filtrarlos en el frontend porque WooCommerce solo distingue instock/outofstock
      const needsGlobalFilter = params.stockFilter && params.stockFilter !== "all" && params.stockFilter !== "out-of-stock";
      
      if (needsGlobalFilter) {
        // Obtener todos los productos con stock para filtrar globalmente
        let allProducts: any[] = [];
        let currentPageNum = 1;
        let hasMore = true;
        const perPage = 100; // Máximo permitido

        // Construir parámetros base (sin stockFilter)
        const baseParams: any = {};
        if (params.search) baseParams.search = params.search;
        if (params.category) baseParams.category = params.category;
        baseParams.stock_status = "instock"; // Solo productos con stock

        while (hasMore) {
          const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
            body: { 
              action: 'list',
              params: {
                page: currentPageNum,
                per_page: perPage,
                ...baseParams
              }
            }
          });

          if (error) throw error;

          const pageProducts = data?.data || [];
          allProducts = [...allProducts, ...pageProducts];

          const pagination = data?.pagination;
          if (pagination) {
            hasMore = currentPageNum < pagination.totalPages;
            currentPageNum++;
          } else {
            hasMore = pageProducts.length === perPage;
            currentPageNum++;
          }

          // Limitar a un máximo razonable
          if (currentPageNum > 50) break; // Máximo 5000 productos
        }

        // Transformar y filtrar por cantidad de stock
        let transformedProducts = allProducts.map(transformProduct);
        
        // Aplicar filtro de stock específico
        switch (params.stockFilter) {
          case "in-stock":
            transformedProducts = transformedProducts.filter(p => (p.stock_quantity || 0) > 5);
            break;
          case "low-stock":
            transformedProducts = transformedProducts.filter(p => {
              const stock = p.stock_quantity || 0;
              return stock > 2 && stock <= 5;
            });
            break;
          case "very-low-stock":
            transformedProducts = transformedProducts.filter(p => {
              const stock = p.stock_quantity || 0;
              return stock > 0 && stock <= 2;
            });
            break;
        }

        // Aplicar filtro de categoría si existe (ya que lo obtenemos antes del filtro de stock)
        if (params.category) {
          transformedProducts = transformedProducts.filter(p => 
            p.categories?.some(cat => cat.id === params.category)
          );
        }

        // Aplicar filtro de búsqueda si existe
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          transformedProducts = transformedProducts.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.sku?.toLowerCase().includes(searchLower) ||
            p.category?.toLowerCase().includes(searchLower)
          );
        }

        // Aplicar paginación en el frontend
        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = transformedProducts.slice(startIndex, endIndex);

        setProducts(paginatedProducts);
        setCurrentPage(page);
        setTotalPages(Math.ceil(transformedProducts.length / productsPerPage) || 1);
        setTotalProducts(transformedProducts.length);

        console.log(`✅ Filtro global: ${transformedProducts.length} productos totales, mostrando página ${page} (${paginatedProducts.length} productos)`);
      } else {
        // Filtro normal con paginación del backend
        // Construir parámetros limpiando stockFilter que no es para el backend
        const backendParams: any = {
          page,
          per_page: productsPerPage
        };
        
        if (params.search) backendParams.search = params.search;
        if (params.category !== undefined && params.category !== null) {
          backendParams.category = params.category;
        }
        if (params.stock_status) backendParams.stock_status = params.stock_status;
        
        console.log('📤 Enviando al backend:', { action: 'list', params: backendParams });
        
        const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: { 
            action: 'list',
            params: backendParams
          }
        });

        if (error) throw error;

        const pageProducts = data?.data || [];
        const pagination = data?.pagination;

        console.log(`📥 Respuesta del backend: ${pageProducts.length} productos, categoría filtro: ${params.category || 'ninguna'}`);

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
      }
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

  const [stockStats, setStockStats] = useState({
    inStock: 0,
    lowStock: 0,
    veryLowStock: 0,
    outOfStock: 0,
    loading: false
  });

  const fetchStockStats = useCallback(async () => {
    try {
      setStockStats(prev => ({ ...prev, loading: true }));
      
      // Primero obtenemos el total de productos para saber cuántas páginas necesitamos
      const firstPageResponse = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'list',
          params: {
            page: 1,
            per_page: 100 // Máximo permitido por WooCommerce
          }
        }
      });

      if (firstPageResponse.error) throw firstPageResponse.error;

      const firstPageData = firstPageResponse.data?.data || [];
      const pagination = firstPageResponse.data?.pagination;
      const totalPages = pagination?.totalPages || 1;

      // Si solo hay una página, calculamos directamente
      if (totalPages === 1) {
        const stats = {
          inStock: 0,
          lowStock: 0,
          veryLowStock: 0,
          outOfStock: 0
        };

        firstPageData.forEach((product: any) => {
          const stock = product.stock_quantity || 0;
          if (stock === 0) {
            stats.outOfStock++;
          } else if (stock > 0 && stock <= 2) {
            stats.veryLowStock++;
          } else if (stock > 2 && stock <= 5) {
            stats.lowStock++;
          } else if (stock > 5) {
            stats.inStock++;
          }
        });

        setStockStats({
          ...stats,
          loading: false
        });
        return;
      }

      // Si hay múltiples páginas, obtenemos todas en paralelo (limitado a 20 páginas para no sobrecargar)
      const maxPages = Math.min(totalPages, 20); // Máximo 2000 productos
      const pagePromises = [];
      
      for (let page = 1; page <= maxPages; page++) {
        pagePromises.push(
          supabase.functions.invoke('sync-woocommerce-products', {
            body: { 
              action: 'list',
              params: {
                page,
                per_page: 100
              }
            }
          })
        );
      }

      const responses = await Promise.all(pagePromises);
      let allProducts: any[] = [];

      responses.forEach((response) => {
        if (response.error) {
          console.error('Error fetching page:', response.error);
          return;
        }
        const pageProducts = response.data?.data || [];
        allProducts = [...allProducts, ...pageProducts];
      });

      // Calcular estadísticas
      const stats = {
        inStock: 0,
        lowStock: 0,
        veryLowStock: 0,
        outOfStock: 0
      };

      allProducts.forEach((product: any) => {
        const stock = product.stock_quantity || 0;
        if (stock === 0) {
          stats.outOfStock++;
        } else if (stock > 0 && stock <= 2) {
          stats.veryLowStock++;
        } else if (stock > 2 && stock <= 5) {
          stats.lowStock++;
        } else if (stock > 5) {
          stats.inStock++;
        }
      });

      setStockStats({
        ...stats,
        loading: false
      });
    } catch (err: any) {
      console.error('Error fetching stock stats:', err);
      setStockStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      console.log('🔄 Iniciando carga de categorías...');
      
      // Intentar obtener categorías directamente desde WooCommerce
      try {
        const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: { 
            action: 'get_categories',
            params: {
              page: 1,
              per_page: 100
            }
          }
        });

        if (error) {
          console.warn('⚠️ Error al obtener categorías directamente, usando fallback:', error);
          throw error; // Lanzar para usar el fallback
        }

        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          // Obtener todas las páginas si hay más
          let allCategories: any[] = [...data.data];
          const pagination = data?.pagination;
          
          if (pagination && pagination.totalPages > 1) {
            // Obtener las páginas restantes
            for (let page = 2; page <= pagination.totalPages && page <= 20; page++) {
              const { data: pageData, error: pageError } = await supabase.functions.invoke('sync-woocommerce-products', {
                body: { 
                  action: 'get_categories',
                  params: {
                    page,
                    per_page: 100
                  }
                }
              });
              
              if (!pageError && pageData?.data) {
                allCategories = [...allCategories, ...pageData.data];
              }
            }
          }

          allCategories.sort((a: any, b: any) => a.name.localeCompare(b.name));
          console.log(`✅ Categorías cargadas desde API: ${allCategories.length}`);
          setCategories(allCategories);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Fallback: Extrayendo categorías de productos cargados');
      }

      // Fallback: Extraer categorías de los productos ya cargados
      console.log('📦 Extrayendo categorías de productos existentes...');
      const uniqueCategories = new Map<number, { id: number; name: string; slug: string }>();
      
      // Obtener algunos productos para extraer categorías
      const { data: productsData, error: productsError } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'list',
          params: {
            page: 1,
            per_page: 100
          }
        }
      });

      if (!productsError && productsData?.data) {
        productsData.data.forEach((product: any) => {
          if (product.categories && Array.isArray(product.categories)) {
            product.categories.forEach((cat: any) => {
              if (cat.id && cat.name && !uniqueCategories.has(cat.id)) {
                uniqueCategories.set(cat.id, {
                  id: cat.id,
                  name: cat.name,
                  slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
                });
              }
            });
          }
        });
      }

      const categoriesArray = Array.from(uniqueCategories.values());
      categoriesArray.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Categorías extraídas de productos: ${categoriesArray.length}`);
      setCategories(categoriesArray);
      
    } catch (err: any) {
      console.error('❌ Error fetching categories:', err);
      toast.error(`Error al cargar categorías: ${err.message || 'Error desconocido'}`);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
      console.log('✅ Carga de categorías finalizada');
    }
  }, []);

  useEffect(() => {
    fetchProducts(1);
    fetchStockStats();
  }, [fetchProducts, fetchStockStats]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalProducts,
    productsPerPage,
    stockStats,
    categories,
    categoriesLoading,
    fetchCategories,
    fetchProducts,
    updateProductStock,
    syncProducts,
    fetchStockStats,
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
