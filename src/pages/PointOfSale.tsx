import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/PermissionGate";
import { LoadingSpinner, LoadingOverlay } from "@/components/LoadingSpinner";
import { useUserRole } from "@/hooks/useUserRole";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { useNotifications } from "@/hooks/useNotifications";
import { useAutoNotifications } from "@/hooks/useAutoNotifications";
import { toast } from "sonner";
import { ShoppingCart, Trash2, CreditCard, Banknote, Plus, Minus, Search, DollarSign, Percent, Loader2, Printer, Eye, ArrowLeft, Folder, ScanLine } from "lucide-react";
import { Product, CartItem } from "@/types";
import { useTicketPDF } from "@/hooks/useTicketPDF";
import { useProductVariations } from "@/hooks/useProductVariations";

// Categorías generales del TPV (solo en nuestra app, no afecta WooCommerce)
interface GeneralCategory {
  id: string;
  name: string;
  icon: string;
  keywords: string[]; // Palabras clave generales para buscar en nombre de categoría
  productKeywords: string[]; // Palabras clave para analizar en nombres de productos dentro de la categoría
}

const GENERAL_CATEGORIES: GeneralCategory[] = [
  {
    id: 'zapatos',
    name: 'Zapatos',
    icon: '👠',
    keywords: ['zapat', 'calzad', 'espart', 'bota', 'sandal', 'alpargat', 'tacón'],
    productKeywords: ['zapat', 'espart', 'bota', 'sandal', 'alpargat', 'calzad', 'tacón', 'tacones']
  },
  {
    id: 'trajes',
    name: 'Trajes',
    icon: '👗',
    keywords: ['traje', 'vestid', 'bata', 'delantal', 'flamenca', 'talla'],
    productKeywords: ['traje', 'vestid', 'bata', 'delantal', 'flamenca', 'falda', 'prenda']
  },
  {
    id: 'accesorios',
    name: 'Accesorios',
    icon: '✨',
    keywords: ['anill', 'pulser', 'pendiente', 'collar', 'broch', 'manton', 'peinet', 'flor', 'mantill', 'complement', 'accesori'],
    productKeywords: ['anill', 'pulser', 'pendiente', 'collar', 'broch', 'manton', 'peinet', 'flor', 'mantill', 'accesori', 'complement']
  },
  {
    id: 'bolsos',
    name: 'Bolsos',
    icon: '👜',
    keywords: ['bolso', 'carter', 'moneder', 'cinturón', 'cinturon'],
    productKeywords: ['bolso', 'carter', 'moneder', 'cinturón', 'cinturon']
  },
  {
    id: 'otras',
    name: 'Otras Categorías',
    icon: '📦',
    keywords: [],
    productKeywords: []
  }
];

export default function PointOfSale() {
  const { can } = useUserRole();
  const { products, loading: productsLoading, updateProductStock, categories, categoriesLoading } = useWooCommerceProducts();
  const { showPromise } = useNotifications();
  const { notifyLowStock, notifyOutOfStock } = useAutoNotifications();
  const { generateTicket, printTicket, isGenerating: isGeneratingTicket } = useTicketPDF();
  const { fetchVariations } = useProductVariations();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  // Cargar carrito y cache desde localStorage al iniciar
  const loadCartFromStorage = (): CartItem[] => {
    try {
      const saved = localStorage.getItem('tpv-cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar que la fecha no sea muy antigua (máximo 24 horas)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.items || [];
        }
      }
    } catch (err) {
      console.warn('Error cargando carrito desde localStorage:', err);
    }
    return [];
  };

  const loadVariationCacheFromStorage = (): Map<number, { productId: number; variation: any }> => {
    try {
      const saved = localStorage.getItem('tpv-variation-cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        // No expira nunca, se mantiene indefinidamente
        const map = new Map<number, { productId: number; variation: any }>();
        if (Array.isArray(parsed.data)) {
          parsed.data.forEach(([id, value]: [number, { productId: number; variation: any }]) => {
            map.set(id, value);
          });
        }
        return map;
      }
    } catch (err) {
      console.warn('Error cargando cache de variaciones desde localStorage:', err);
    }
    return new Map();
  };

  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGeneralCategory, setSelectedGeneralCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [processing, setProcessing] = useState(false);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [categoryProductCache, setCategoryProductCache] = useState<Map<number, Product[]>>(new Map());
  const [categoryCountsCache, setCategoryCountsCache] = useState<Map<number, number>>(new Map());
  const [categoryMappingCache, setCategoryMappingCache] = useState<Map<number, string>>(new Map());
  const [categoriesByGeneralCache, setCategoriesByGeneralCache] = useState<Map<string, number[]>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  // Cache de mapeo variación_id -> { product_id, variation_data }
  const [variationCache, setVariationCache] = useState<Map<number, { productId: number; variation: any }>>(loadVariationCacheFromStorage());
  const [variationDialogOpen, setVariationDialogOpen] = useState(false);
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<Product | null>(null);
  const [productVariations, setProductVariations] = useState<any[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [isFromBarcodeScan, setIsFromBarcodeScan] = useState(false);

  // Función para pre-cargar y cachear variaciones de productos (en background, SIN bloquear)
  const preloadVariationsForProducts = (products: Product[]) => {
    if (products.length === 0) return;
    
    // NO esperar, ejecutar completamente en background después de que la UI se haya renderizado
    setTimeout(() => {
      // Identificar productos que tienen variaciones
      const productsWithVariations = products.filter(p => 
        p.type === 'variable' || 
        p.has_options || 
        (p.variations && Array.isArray(p.variations) && p.variations.length > 0)
      );
      
      // Cargar variaciones en background (limitado a 20 productos y con delay entre lotes)
      const batchSize = 5; // Procesar 5 a la vez
      const maxProducts = 20; // Máximo 20 productos para no sobrecargar
      
      productsWithVariations.slice(0, maxProducts).forEach((product, index) => {
        // Distribuir las cargas en el tiempo para no sobrecargar
        setTimeout(async () => {
          try {
            const productId = product.id || product.woocommerce_id || 0;
            if (!productId) return;
            
            const variations = await fetchVariations(productId);
            
        // Cachear TODAS las variaciones de este producto
        setVariationCache(prev => {
          const updated = new Map(prev);
          variations.forEach(variation => {
            if (!updated.has(variation.id)) {
              updated.set(variation.id, {
                productId: productId,
                variation
              });
            }
          });
          
          // Guardar en localStorage (convertir Map a Array para JSON)
          try {
            localStorage.setItem('tpv-variation-cache', JSON.stringify({
              data: Array.from(updated.entries()),
              timestamp: Date.now()
            }));
          } catch (err) {
            console.warn('Error guardando cache de variaciones en localStorage:', err);
          }
          
          return updated;
        });
          } catch (err) {
            // Ignorar errores silenciosamente en background
          }
        }, index * 200); // Delay de 200ms entre cada producto para no sobrecargar
      });
    }, 500); // Esperar 500ms antes de empezar para no bloquear la carga inicial
  };

  // Cargar productos de una categoría específica (carga bajo demanda)
  const loadProductsByCategory = async (categoryId: number) => {
    // Si ya están en cache, no cargar de nuevo
    if (categoryProductCache.has(categoryId)) {
      setFilteredProducts(categoryProductCache.get(categoryId) || []);
      return;
    }

    setLoadingAllProducts(true);
    try {
      let allProductsList: Product[] = [];
      let currentPage = 1;
      let hasMore = true;
      const perPage = 100;

      while (hasMore && currentPage <= 10) { // Limitar a 10 páginas por categoría (1000 productos max)
        const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: { 
            action: 'list',
            params: {
              page: currentPage,
              per_page: perPage,
              category: categoryId
            }
          }
        });

        if (error) {
          console.error('Error cargando productos de categoría:', error);
          break;
        }

        const pageProducts = data?.data || [];
        const pagination = data?.pagination;

        const transformed = pageProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          stock: p.stock_quantity || 0,
          stock_quantity: p.stock_quantity || null,
          category: p.categories?.[0]?.name || 'General',
          woocommerce_id: p.id,
          description: p.description,
          sku: p.sku,
          status: p.status,
          stock_status: p.stock_status,
          regular_price: p.regular_price,
          sale_price: p.sale_price,
          on_sale: p.on_sale,
          purchasable: p.purchasable,
          virtual: p.virtual,
          downloadable: p.downloadable,
          weight: p.weight,
          dimensions: p.dimensions,
          shipping_required: p.shipping_required,
          reviews_allowed: p.reviews_allowed,
          average_rating: p.average_rating,
          rating_count: p.rating_count,
          categories: p.categories || [],
          tags: p.tags,
          images: p.images,
          attributes: p.attributes,
          default_attributes: p.default_attributes,
          variations: p.variations,
          grouped_products: p.grouped_products,
          menu_order: p.menu_order,
          price_html: p.price_html,
          related_ids: p.related_ids,
          meta_data: p.meta_data,
          has_options: p.has_options,
          post_password: p.post_password,
          global_unique_id: p.global_unique_id,
          exclude_global_add_ons: p.exclude_global_add_ons,
          addons: p.addons,
          jetpack_publicize_connections: p.jetpack_publicize_connections,
          jetpack_sharing_enabled: p.jetpack_sharing_enabled,
          jetpack_likes_enabled: p.jetpack_likes_enabled,
          _links: p._links
        }));

        allProductsList = [...allProductsList, ...transformed];

        if (pagination) {
          hasMore = currentPage < pagination.totalPages;
          currentPage++;
        } else {
          hasMore = pageProducts.length === perPage;
          currentPage++;
        }
      }

      // Filtrar productos para asegurarnos de que realmente pertenecen a esta categoría
      // Esto evita que productos mal categorizados en WooCommerce aparezcan donde no deben
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        const categoryName = category.name.toLowerCase();
        
        // Obtener palabras clave específicas de la categoría seleccionada
        const categoryKeywords = getCategoryKeywords(categoryName);
        
        // Filtrar productos que realmente corresponden a esta categoría
        const filteredList = allProductsList.filter(product => {
          // Verificar que el producto tenga esta categoría en su array de categorías
          const hasCategory = product.categories?.some(cat => cat.id === categoryId) || false;
          
          if (!hasCategory) return false;
          
          // Verificar también por nombre del producto (para evitar productos mal categorizados)
          const productName = (product.name || '').toLowerCase();
          const productDesc = (product.description || '').toLowerCase();
          const allText = `${productName} ${productDesc}`;
          
          // Si la categoría tiene palabras clave específicas, verificar coincidencia
          if (categoryKeywords.length > 0) {
            const matchesKeyword = categoryKeywords.some(keyword => {
              const regex = new RegExp(`\\b${keyword}`, 'i');
              return regex.test(allText);
            });
            
            // Si la categoría es muy específica (pulseras, collares, etc), ser más estricto
            if (isSpecificAccessoryCategory(categoryName)) {
              // Debe coincidir con las palabras clave
              return matchesKeyword;
            }
          }
          
          return true;
        });
        
        // Pre-cargar y cachear variaciones de todos los productos cargados (en background)
        // Esto permite que el escáner sea instantáneo
        preloadVariationsForProducts(filteredList);
        
        // Guardar en cache
        setCategoryProductCache(prev => new Map(prev).set(categoryId, filteredList));
        setFilteredProducts(filteredList);
      } else {
        // Pre-cargar y cachear variaciones de todos los productos cargados (en background)
        preloadVariationsForProducts(allProductsList);
        
        // Guardar en cache
        setCategoryProductCache(prev => new Map(prev).set(categoryId, allProductsList));
        setFilteredProducts(allProductsList);
      }
      
    } catch (error: any) {
      console.error('Error cargando productos de categoría:', error);
      toast.error("Error al cargar productos: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingAllProducts(false);
    }
  };

  // Cargar conteo de productos por categoría (solo muestra para contar)
  const loadCategoryCounts = async () => {
    if (categoryCountsCache.size > 0) return; // Ya se cargaron
    
    setLoadingAllProducts(true);
    try {
      // Solo cargar primera página de cada categoría para contar
      const countsMap = new Map<number, number>();
      
      // Cargar una muestra de productos (primera página) para contar por categoría
      const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'list',
          params: {
            page: 1,
            per_page: 100,
            stock_status: 'instock'
          }
        }
      });

      if (!error && data?.data) {
        data.data.forEach((p: any) => {
          if (p.categories && Array.isArray(p.categories)) {
            p.categories.forEach((cat: any) => {
              if (cat.id) {
                countsMap.set(cat.id, (countsMap.get(cat.id) || 0) + 1);
              }
            });
          }
        });
      }

      setCategoryCountsCache(countsMap);
    } catch (error: any) {
      console.error('Error cargando conteos:', error);
    } finally {
      setLoadingAllProducts(false);
    }
  };

  // Cargar conteos cuando las categorías estén disponibles
  useEffect(() => {
    if (categories.length > 0 && categoryCountsCache.size === 0 && !categoriesLoading) {
      loadCategoryCounts();
    }
  }, [categories, categoriesLoading]);

  // Función para analizar productos de una categoría y determinar a qué categoría general pertenece
  const analyzeCategoryByProducts = async (categoryId: number): Promise<string> => {
    try {
      // Cargar una muestra de productos de esta categoría (primera página)
      const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'list',
          params: {
            page: 1,
            per_page: 50,
            category: categoryId
          }
        }
      });

      if (error || !data?.data || data.data.length === 0) {
        return 'otras';
      }

      const products = data.data;
      const category = categories.find(c => c.id === categoryId);
      const categoryLower = category?.name.toLowerCase() || '';
      
      // Analizar nombres de productos
      const productText = products
        .map((p: any) => (p.name || '').toLowerCase())
        .join(' ');
      
      // Contar coincidencias con palabras clave de cada categoría general
      const scores: Record<string, number> = {};
      
      GENERAL_CATEGORIES.forEach(gc => {
        if (gc.id === 'otras') return;
        
        let score = 0;
        
        // Puntos por coincidencias en nombre de categoría (mayor peso, pero solo si es palabra completa)
        gc.keywords.forEach(keyword => {
          const keywordLower = keyword.toLowerCase();
          const regex = new RegExp(`\\b${keywordLower}`, 'i');
          if (regex.test(categoryLower)) {
            score += 5; // Mucho peso al nombre de categoría
          }
        });
        
        // Puntos por coincidencias en nombres de productos (menor peso pero más importante)
        gc.productKeywords.forEach(keyword => {
          const keywordLower = keyword.toLowerCase();
          // Buscar palabra completa en nombres de productos
          const regex = new RegExp(`\\b${keywordLower}`, 'gi');
          const matches = (productText.match(regex) || []).length;
          score += matches * 2; // 2 puntos por cada coincidencia en productos
        });
        
        scores[gc.id] = score;
      });
      
      // Encontrar la categoría con mayor puntuación
      const maxScore = Math.max(...Object.values(scores).filter(s => s > 0));
      if (maxScore === 0) return 'otras';
      
      const bestMatch = Object.entries(scores).find(([_, score]) => score === maxScore);
      return bestMatch ? bestMatch[0] : 'otras';
      
    } catch (error) {
      console.error('Error analizando categoría:', error);
      return 'otras';
    }
  };

  // Función síncrona para mapeo rápido por nombre (usando cache)
  const getCachedMapping = (categoryId: number): string => {
    return categoryMappingCache.get(categoryId) || 'otras';
  };

  // Obtener palabras clave específicas de una categoría
  const getCategoryKeywords = (categoryName: string): string[] => {
    const lower = categoryName.toLowerCase();
    const keywords: string[] = [];
    
    // Mapeo específico de categorías a palabras clave
    if (lower.includes('pulser')) {
      keywords.push('pulser', 'brazalet');
    } else if (lower.includes('collar')) {
      keywords.push('collar', 'necklace', 'gargantilla');
    } else if (lower.includes('anill')) {
      keywords.push('anill', 'ring');
    } else if (lower.includes('pendiente')) {
      keywords.push('pendiente', 'earring', 'arete');
    } else if (lower.includes('zapat') || lower.includes('espart') || lower.includes('calzad')) {
      keywords.push('zapat', 'espart', 'calzad', 'bota', 'sandal', 'alpargat', 'tacón');
    } else if (lower.includes('traje') || lower.includes('vestid') || lower.includes('flamenca')) {
      keywords.push('traje', 'vestid', 'flamenca', 'bata', 'delantal');
    } else if (lower.includes('bolso')) {
      keywords.push('bolso', 'carter', 'moneder');
    }
    
    return keywords;
  };

  // Verificar si es una categoría de accesorios muy específica que necesita filtrado estricto
  const isSpecificAccessoryCategory = (categoryName: string): boolean => {
    const lower = categoryName.toLowerCase();
    // Categorías que deben filtrarse estrictamente
    return lower.includes('pulser') || 
           lower.includes('collar') || 
           lower.includes('anill') || 
           lower.includes('pendiente');
  };

  // Analizar y cachear todas las categorías (solo una vez cuando las categorías se cargan)
  useEffect(() => {
    // Solo ejecutar si hay categorías, no están cargando, y el cache está vacío o incompleto
    if (categories.length === 0 || categoriesLoading) return;
    
    // Si ya tenemos todas las categorías mapeadas, no hacer nada
    if (categoryMappingCache.size >= categories.length) return;
    
    const analyzeAllCategories = async () => {
      console.log('🔄 Analizando categorías para clasificación correcta...');
      const newMappings = new Map<number, string>();
      
      // Primero: clasificar por nombre de categoría (rápido)
      for (const category of categories) {
        if (categoryMappingCache.has(category.id)) {
          continue; // Ya está en cache
        }

        const categoryLower = category.name.toLowerCase();
        let mapped = 'otras';
        
        // Buscar palabra completa en el nombre (evitar "pulser" en "collares")
        for (const generalCat of GENERAL_CATEGORIES) {
          if (generalCat.id === 'otras') continue;
          
          const hasMatch = generalCat.keywords.some(keyword => {
            const keywordLower = keyword.toLowerCase();
            // Buscar palabra completa con límites de palabra
            const regex = new RegExp(`\\b${keywordLower}`, 'i');
            return regex.test(categoryLower);
          });
          
          if (hasMatch) {
            mapped = generalCat.id;
            break;
          }
        }
        
        newMappings.set(category.id, mapped);
      }
      
      // Actualizar cache con clasificaciones por nombre
      if (newMappings.size > 0) {
        setCategoryMappingCache(prev => {
          const merged = new Map(prev);
          newMappings.forEach((value, key) => merged.set(key, value));
          return merged;
        });
      }

      // Segundo: analizar productos de categorías que no coincidieron por nombre (solo si es necesario)
      const categoriesToAnalyze = categories.filter(cat => {
        if (categoryMappingCache.has(cat.id)) return false;
        const mapped = newMappings.get(cat.id);
        return mapped === 'otras';
      });

      // Solo analizar si hay categorías pendientes (máximo 5 para no sobrecargar)
      if (categoriesToAnalyze.length > 0 && categoriesToAnalyze.length <= 10) {
        const analysisPromises = categoriesToAnalyze.slice(0, 5).map(async (category) => {
          const analyzed = await analyzeCategoryByProducts(category.id);
          return { categoryId: category.id, mapped: analyzed };
        });

        try {
          const analyzedResults = await Promise.all(analysisPromises);
          
          // Actualizar cache con resultados del análisis
          if (analyzedResults.length > 0) {
            setCategoryMappingCache(prev => {
              const updated = new Map(prev);
              analyzedResults.forEach(({ categoryId, mapped }) => {
                updated.set(categoryId, mapped);
              });
              return updated;
            });
          }
        } catch (error) {
          console.error('Error analizando categorías:', error);
        }
      }
    };

    analyzeAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, categoriesLoading]); // Solo cuando cambia la longitud de categorías o el estado de carga

  // Obtener categorías de WooCommerce agrupadas por categoría general (ordenadas alfabéticamente)
  const getCategoriesByGeneralCategory = (generalCategoryId: string) => {
    // Filtrar categorías según el cache de mapeo
    const result = categories.filter(cat => {
      const mapped = getCachedMapping(cat.id);
      return mapped === generalCategoryId;
    });
    
    // Ordenar alfabéticamente por nombre
    return result.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  };

  // Obtener conteo de productos en una categoría (desde cache o muestra)
  const getProductCountForCategory = (categoryId: number): number => {
    if (categoryCountsCache.has(categoryId)) {
      return categoryCountsCache.get(categoryId) || 0;
    }
    // Si no está en cache, usar productos cargados si están disponibles
    const cached = categoryProductCache.get(categoryId);
    return cached ? cached.length : 0;
  };

  // Cargar productos cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory !== null) {
      loadProductsByCategory(selectedCategory);
    } else {
      setFilteredProducts([]);
    }
  }, [selectedCategory]);

  // Filtrar productos por búsqueda cuando hay término de búsqueda
  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredProducts([]);
      return;
    }

    const cachedProducts = categoryProductCache.get(selectedCategory) || [];
    
    if (searchTerm) {
      const filtered = cachedProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(cachedProducts);
    }
  }, [searchTerm, selectedCategory, categoryProductCache]);


  const addToCart = async (product: Product) => {
    // Verificar si el producto tiene variaciones
    const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0;
    
    if (hasVariations) {
      // Mostrar diálogo para seleccionar variación
      setSelectedProductForVariation(product);
      setVariationDialogOpen(true);
      setLoadingVariations(true);
      
      try {
        const variations = await fetchVariations(product.woocommerce_id || product.id);
        setProductVariations(variations);
      } catch (error: any) {
        toast.error("Error al cargar variaciones: " + (error.message || "Error desconocido"));
        setVariationDialogOpen(false);
      } finally {
        setLoadingVariations(false);
      }
      return;
    }
    
    // Si no tiene variaciones, añadir directamente
    addProductToCart(product);
  };

  const addProductToCart = (product: Product, variation?: any, skipStockCheck: boolean = false) => {
    // Verificar stock solo si no viene de escaneo de código de barras
    if (!skipStockCheck) {
      const stock = variation ? (variation.stock_quantity || 0) : (product.stock || 0);
      if (stock <= 0) {
        toast.error(`${variation ? 'Esta variación' : product.name} no tiene stock disponible`);
        return;
      }
    }

    // Crear nombre del producto (con variación si aplica)
    const productName = variation 
      ? `${product.name} ${variation.attributes?.map((a: any) => a.option).join(' ') || ''}`
      : product.name;
    
    // Usar ID de variación si existe, sino ID del producto
    const productId = variation ? variation.id : product.id;
    
    // Precio de la variación o del producto
    const price = variation 
      ? parseFloat(variation.price || variation.regular_price || '0')
      : (typeof product.price === 'number' ? product.price : parseFloat(product.price));
    
    const existingItem = cartItems.find(item => item.product_id === productId);
    
    if (existingItem) {
      // Si viene de escaneo, no validar stock máximo
      if (!skipStockCheck) {
        const stock = variation ? (variation.stock_quantity || 0) : (product.stock || 0);
        if (existingItem.quantity >= stock) {
          toast.error(`Stock máximo alcanzado (${stock} disponibles)`);
          return;
        }
      }
      updateQuantity(productId, existingItem.quantity + 1, skipStockCheck);
    } else {
      const newItem: CartItem = {
        product_id: productId,
        name: productName,
        quantity: 1,
        unit_price: price * 1.21, // Precio con IVA para el TPV
        subtotal: price * 1.21,
      };
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      
      // Guardar en localStorage
      try {
        localStorage.setItem('tpv-cart', JSON.stringify({
          items: updatedCart,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.warn('Error guardando carrito en localStorage:', err);
      }
      
      toast.success(`${productName} agregado al carrito`);
    }
    
    // Cerrar diálogo si estaba abierto
    if (variationDialogOpen) {
      setVariationDialogOpen(false);
      setSelectedProductForVariation(null);
      setProductVariations([]);
      setIsFromBarcodeScan(false); // Resetear el estado al cerrar
    }
  };

  const updateQuantity = (productId: number, newQuantity: number, skipStockCheck: boolean = false) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Verificar stock solo si no viene de escaneo
    if (!skipStockCheck) {
      if (product.stock <= 0) {
        toast.error(`${product.name} no tiene stock disponible`);
        removeFromCart(productId);
        return;
      }

      if (newQuantity > product.stock) {
        toast.error(`Stock máximo: ${product.stock} unidades disponibles`);
        return;
      }
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cartItems.map(item => 
      item.product_id === productId
        ? { ...item, quantity: newQuantity, subtotal: item.unit_price * newQuantity }
        : item
    );
    setCartItems(updatedCart);
    
    // Guardar en localStorage
    try {
      localStorage.setItem('tpv-cart', JSON.stringify({
        items: updatedCart,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Error guardando carrito en localStorage:', err);
    }
  };

  const removeFromCart = (productId: number) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedCart);
    
    // Guardar en localStorage
    try {
      localStorage.setItem('tpv-cart', JSON.stringify({
        items: updatedCart,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Error guardando carrito en localStorage:', err);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDiscount = () => {
    if (discountAmount <= 0) return 0;
    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return (subtotal * discountAmount) / 100;
    } else {
      return Math.min(discountAmount, subtotal);
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const processSale = async () => {
    if (cartItems.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    if (!confirm(`¿Confirmar venta por ${calculateTotal().toFixed(2)}€?`)) {
      return;
    }

    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const totalAmount = calculateTotal() / 1.21; // Total sin IVA para la BD

      // 1. Crear orden de venta
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_name: "Venta en Tienda",
          customer_email: "venta@tienda.local", // Email por defecto para ventas en tienda
          customer_phone: "N/A",
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: "paid", // Venta directa = pagado
          status: "pending", // Venta directa = pendiente (se completará al facturar)
          created_by: session?.user.id || null,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insertar items de la venta (guardamos precios sin IVA)
      const itemsToInsert = cartItems.map(item => ({
        order_id: order.id,
        product_id: null, // Para ventas directas, no tenemos producto en la BD local
        name: item.name, // Incluir el nombre del producto
        quantity: item.quantity,
        unit_price: parseFloat((item.unit_price / 1.21).toFixed(2)), // Precio sin IVA
        subtotal: parseFloat((item.subtotal / 1.21).toFixed(2)), // Subtotal sin IVA
      }));

      console.log("Order created:", order);
      console.log("Items to insert:", itemsToInsert);
      console.log("First item details:", itemsToInsert[0]);

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Actualizar stock de productos en WooCommerce y enviar notificaciones si es necesario
      // Buscar productos necesarios para el procesamiento
      const productsToCheck = [...Array.from(categoryProductCache.values()).flat(), ...products];
      for (const item of cartItems) {
        const product = allProductsList.find(p => p.id === item.product_id);
        if (!product) continue;

        const oldStock = product.stock;
        const newStock = product.stock - item.quantity;
        
        // Actualizar stock usando el hook
        try {
          await updateProductStock(product.id, newStock);
          
          // Enviar notificaciones de stock si es necesario
          if (oldStock !== newStock) {
            
            if (newStock === 0) {
              // Stock agotado
              try {
                const result = await notifyOutOfStock([{
                  id: product.id.toString(),
                  name: product.name,
                  stock: newStock
                }]);
              } catch (error) {
                console.error(`❌ Error enviando notificación stock agotado:`, error);
              }
            } else if (newStock <= 2 && oldStock > 2) {
              // Stock bajo (solo notificar si antes tenía más de 2)
              try {
                const result = await notifyLowStock([{
                  id: product.id.toString(),
                  name: product.name,
                  stock: newStock
                }]);
              } catch (error) {
                console.error(`❌ Error enviando notificación stock bajo:`, error);
              }
            } else {
            }
          } else {
          }
        } catch (syncError) {
          console.error("Error actualizando stock en WooCommerce:", syncError);
          // No lanzar error para no interrumpir la venta
        }
      }

      // 4. Limpiar carrito y mostrar éxito
      setCartItems([]);
      
      // Limpiar carrito del localStorage
      try {
        localStorage.removeItem('tpv-cart');
      } catch (err) {
        console.warn('Error limpiando carrito del localStorage:', err);
      }
      
      setPaymentMethod("cash");
      setSearchTerm("");
      setDiscountAmount(0);

      toast.success(`¡Venta realizada! Total: ${totalAmount.toFixed(2)}€`);
    } catch (error: any) {
      toast.error("Error al procesar la venta: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm("¿Vaciar el carrito?")) {
      setCartItems([]);
      
      // Limpiar carrito del localStorage
      try {
        localStorage.removeItem('tpv-cart');
      } catch (err) {
        console.warn('Error limpiando carrito del localStorage:', err);
      }
    }
  };

  // Función para manejar el escaneo de código de barras
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode || barcode.trim() === '') return;

    try {
      // Limpiar el input
      setBarcodeInput('');
      
      // Buscar producto o variación por código de barras
      let productToAdd: Product | null = null;
      
      // Formato VAR-{variation_id} para variaciones
      if (barcode.startsWith('VAR-')) {
        const variationId = parseInt(barcode.replace('VAR-', ''));
        if (isNaN(variationId)) {
          toast.error("Código de barras inválido");
          return;
        }
        
        // PRIMERO: Verificar si está en cache (INSTANTÁNEO)
        const cachedVariation = variationCache.get(variationId);
        if (cachedVariation) {
          const { productId, variation } = cachedVariation;
          // Obtener información del producto padre (puede estar en cache de productos cargados)
          const cachedProducts = Array.from(categoryProductCache.values()).flat();
          let product = cachedProducts.find(p => p.id === productId || p.woocommerce_id === productId);
          
          // Si no está en cache, obtenerlo rápidamente
          if (!product) {
            try {
              const { data: productData, error: productError } = await supabase.functions.invoke('sync-woocommerce-products', {
                body: { action: 'get', productId: productId }
              });
              
              if (!productError && productData?.data) {
                const productArray = productData.data || (Array.isArray(productData) ? productData : [productData]);
                const p = Array.isArray(productArray) && productArray.length > 0 ? productArray[0] : productArray;
                if (p && p.id) {
                  product = {
                    id: p.id,
                    name: p.name,
                    categories: p.categories || [],
                    images: p.images || []
                  } as Product;
                }
              }
            } catch (err) {
              console.warn('Error obteniendo producto padre:', err);
            }
          }
          
          if (variation && product) {
            // Manejar el precio correctamente
            let variationPrice = 0;
            if (variation.price !== undefined && variation.price !== null && variation.price !== '') {
              const priceValue = typeof variation.price === 'string' 
                ? parseFloat(variation.price.replace(',', '.')) 
                : variation.price;
              if (!isNaN(priceValue) && priceValue > 0) {
                variationPrice = priceValue;
              }
            }
            
            if (variationPrice === 0 && variation.regular_price !== undefined && variation.regular_price !== null && variation.regular_price !== '') {
              const regularPriceValue = typeof variation.regular_price === 'string' 
                ? parseFloat(variation.regular_price.replace(',', '.')) 
                : variation.regular_price;
              if (!isNaN(regularPriceValue) && regularPriceValue > 0) {
                variationPrice = regularPriceValue;
              }
            }

            const variationName = `${product.name} ${variation.attributes?.map((a: any) => a.option || '').filter(Boolean).join(' ') || ''}`.trim();
            
            productToAdd = {
              id: variation.id,
              name: variationName || product.name,
              price: variationPrice,
              stock: variation.stock_quantity || 0,
              stock_quantity: variation.stock_quantity || null,
              sku: variation.sku || product.sku,
              woocommerce_id: product.id,
              categories: product.categories || [],
              images: variation.image ? [variation.image] : product.images
            } as Product;
          }
        }
        
        // SEGUNDO: Si no está en cache, buscar solo en productos ya cargados en el TPV (RÁPIDO)
        if (!productToAdd) {
          const cachedProducts = Array.from(categoryProductCache.values()).flat();
          
          // Buscar solo en productos con variaciones que ya están cargados
          for (const product of cachedProducts) {
            if (product.variations && product.variations.length > 0) {
              try {
                const variations = await fetchVariations(product.id || product.woocommerce_id || 0);
                
                // Cachear TODAS las variaciones de este producto para futuras búsquedas
                const productId = product.id || product.woocommerce_id || 0;
                setVariationCache(prev => {
                  const updated = new Map(prev);
                  variations.forEach(v => {
                    if (!updated.has(v.id)) {
                      updated.set(v.id, { productId, variation: v });
                    }
                  });
                  
                  // Guardar en localStorage
                  try {
                    localStorage.setItem('tpv-variation-cache', JSON.stringify({
                      data: Array.from(updated.entries()),
                      timestamp: Date.now()
                    }));
                  } catch (err) {
                    console.warn('Error guardando cache de variaciones en localStorage:', err);
                  }
                  
                  return updated;
                });
                
                const variation = variations.find(v => v.id === variationId);
                
                if (variation) {
                  
                  // Manejar precio
                  let variationPrice = 0;
                  if (variation.price !== undefined && variation.price !== null && variation.price !== '') {
                    const priceValue = typeof variation.price === 'string' 
                      ? parseFloat(variation.price.replace(',', '.')) 
                      : variation.price;
                    if (!isNaN(priceValue) && priceValue > 0) variationPrice = priceValue;
                  }
                  
                  if (variationPrice === 0 && variation.regular_price) {
                    const regularPriceValue = typeof variation.regular_price === 'string' 
                      ? parseFloat(variation.regular_price.replace(',', '.')) 
                      : variation.regular_price;
                    if (!isNaN(regularPriceValue) && regularPriceValue > 0) variationPrice = regularPriceValue;
                  }

                  const variationName = `${product.name} ${variation.attributes?.map((a: any) => a.option || '').filter(Boolean).join(' ') || ''}`.trim();
                  
                  productToAdd = {
                    id: variation.id,
                    name: variationName || product.name,
                    price: variationPrice,
                    stock: variation.stock_quantity || 0,
                    stock_quantity: variation.stock_quantity || null,
                    sku: variation.sku || product.sku,
                    woocommerce_id: product.id || product.woocommerce_id,
                    categories: product.categories || [],
                    images: variation.image ? [variation.image] : product.images
                  } as Product;
                  break;
                }
              } catch (err) {
                console.warn(`Error buscando variaciones para producto ${product.id}:`, err);
              }
            }
          }
        }
        
        // TERCERO: Si aún no se encuentra, búsqueda limitada solo en primera página (ÚLTIMO RECURSO)
        if (!productToAdd) {
          const { data: productsData, error: productsError } = await supabase.functions.invoke('sync-woocommerce-products', {
            body: { 
              action: 'list',
              params: { page: 1, per_page: 50 } // Solo primera página, menos productos
            }
          });

          if (!productsError && productsData?.data) {
            for (const product of productsData.data) {
              if (product.type === 'variable' || product.has_options) {
                try {
              const variations = await fetchVariations(product.id);
              const variation = variations.find(v => v.id === variationId);
              
              // Guardar en cache cuando se encuentra una variación
              if (variation) {
                setVariationCache(prev => {
                  const updated = new Map(prev).set(variationId, { productId: product.id, variation });
                  
                  // Guardar en localStorage
                  try {
                    localStorage.setItem('tpv-variation-cache', JSON.stringify({
                      data: Array.from(updated.entries()),
                      timestamp: Date.now()
                    }));
                  } catch (err) {
                    console.warn('Error guardando cache de variaciones en localStorage:', err);
                  }
                  
                  return updated;
                });
              }
                  
                  if (variation) {
                    // Guardar en cache
                    setVariationCache(prev => {
                      const updated = new Map(prev).set(variationId, { productId: product.id, variation });
                      
                      // Guardar en localStorage
                      try {
                        localStorage.setItem('tpv-variation-cache', JSON.stringify({
                          data: Array.from(updated.entries()),
                          timestamp: Date.now()
                        }));
                      } catch (err) {
                        console.warn('Error guardando cache de variaciones en localStorage:', err);
                      }
                      
                      return updated;
                    });
                    
                    // Manejar precio
                    let variationPrice = 0;
                    if (variation.price !== undefined && variation.price !== null && variation.price !== '') {
                      const priceValue = typeof variation.price === 'string' 
                        ? parseFloat(variation.price.replace(',', '.')) 
                        : variation.price;
                      if (!isNaN(priceValue) && priceValue > 0) variationPrice = priceValue;
                    }
                    
                    if (variationPrice === 0 && variation.regular_price) {
                      const regularPriceValue = typeof variation.regular_price === 'string' 
                        ? parseFloat(variation.regular_price.replace(',', '.')) 
                        : variation.regular_price;
                      if (!isNaN(regularPriceValue) && regularPriceValue > 0) variationPrice = regularPriceValue;
                    }

                    const variationName = `${product.name} ${variation.attributes?.map((a: any) => a.option || '').filter(Boolean).join(' ') || ''}`.trim();
                    
                    productToAdd = {
                      id: variation.id,
                      name: variationName || product.name,
                      price: variationPrice,
                      stock: variation.stock_quantity || 0,
                      stock_quantity: variation.stock_quantity || null,
                      sku: variation.sku || product.sku,
                      woocommerce_id: product.id,
                      categories: product.categories || [],
                      images: variation.image ? [variation.image] : product.images
                    } as Product;
                    break;
                  }
                } catch (err) {
                  console.warn(`Error buscando variaciones para producto ${product.id}:`, err);
                }
              }
              
              if (productToAdd) break;
            }
          }
        }
        
        if (!productToAdd) {
          toast.error("Variación no encontrada");
          return;
        }
      } 
      // Formato PROD-{product_id} para productos sin variaciones
      else if (barcode.startsWith('PROD-')) {
        const productId = parseInt(barcode.replace('PROD-', ''));
        if (isNaN(productId)) {
          toast.error("Código de barras inválido");
          return;
        }
        
        // Buscar producto específico por ID
        const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: { 
            action: 'get',
            productId: productId
          }
        });

        if (error || !data) {
          console.error('Error buscando producto:', error, data);
          toast.error("Producto no encontrado");
          return;
        }

        // La función de Supabase envuelve la respuesta en { data: [...], pagination: {...} }
        // Para 'get', devuelve un array con un solo elemento
        const productArray = data.data || (Array.isArray(data) ? data : [data]);
        const p = Array.isArray(productArray) && productArray.length > 0 ? productArray[0] : productArray;
        
        if (!p || !p.id) {
          console.error('Producto inválido en respuesta:', { data, productArray, p });
          toast.error("Producto no encontrado");
          return;
        }

        // Manejar el precio correctamente - WooCommerce puede devolver el precio como string o número
        let price = 0;
        if (p.price !== undefined && p.price !== null && p.price !== '') {
          const priceValue = typeof p.price === 'string' ? parseFloat(p.price.replace(',', '.')) : p.price;
          if (!isNaN(priceValue) && priceValue > 0) {
            price = priceValue;
          }
        }
        
        // Si no hay precio, intentar con regular_price
        if (price === 0 && p.regular_price !== undefined && p.regular_price !== null && p.regular_price !== '') {
          const regularPriceValue = typeof p.regular_price === 'string' ? parseFloat(p.regular_price.replace(',', '.')) : p.regular_price;
          if (!isNaN(regularPriceValue) && regularPriceValue > 0) {
            price = regularPriceValue;
          }
        }

        // Si aún no hay precio válido, mostrar advertencia pero permitir continuar
        if (price === 0 || isNaN(price)) {
          console.warn('⚠️ Precio inválido o cero para producto:', {
            id: p.id,
            name: p.name,
            price: p.price,
            regular_price: p.regular_price,
            sale_price: p.sale_price
          });
          // No bloquear la venta, pero el usuario verá 0€ y puede corregir manualmente
        }

        productToAdd = {
          id: p.id,
          name: p.name || 'Producto sin nombre',
          price: price,
          stock: p.stock_quantity || 0,
          stock_quantity: p.stock_quantity || null,
          category: p.categories?.[0]?.name || 'General',
          woocommerce_id: p.id,
          sku: p.sku,
          categories: p.categories || [],
          description: p.description,
          images: p.images,
          variations: p.variations,
          regular_price: p.regular_price,
          sale_price: p.sale_price
        } as Product;
      }
      // Si no tiene prefijo, buscar por SKU directamente
      else {
        // Primero buscar en productos principales por SKU
        let page = 1;
        let found = false;
        const maxPages = 10; // Limitar búsqueda
        
        while (page <= maxPages && !found) {
          const { data: productsData, error: productsError } = await supabase.functions.invoke('sync-woocommerce-products', {
            body: { 
              action: 'list',
              params: {
                page: page,
                per_page: 100,
                search: barcode
              }
            }
          });

          if (productsError) {
            break;
          }

          if (productsData?.data) {
            // Buscar por SKU exacto en productos
            const foundProduct = productsData.data.find((p: any) => p.sku === barcode);
            
            if (foundProduct) {
              productToAdd = {
                id: foundProduct.id,
                name: foundProduct.name,
                price: parseFloat(foundProduct.price),
                stock: foundProduct.stock_quantity || 0,
                stock_quantity: foundProduct.stock_quantity || null,
                category: foundProduct.categories?.[0]?.name || 'General',
                woocommerce_id: foundProduct.id,
                sku: foundProduct.sku,
                categories: foundProduct.categories || []
              } as Product;
              found = true;
              break;
            }
            
            // Si no se encontró en productos principales, buscar en variaciones
            for (const product of productsData.data) {
              try {
                const variations = await fetchVariations(product.id);
                const variation = variations.find((v: any) => v.sku === barcode);
                
                if (variation) {
                  const variationName = `${product.name} ${variation.attributes?.map((a: any) => a.option).join(' ') || ''}`;
                  const variationPrice = parseFloat(variation.price || variation.regular_price || '0');
                  
                  productToAdd = {
                    id: variation.id,
                    name: variationName,
                    price: variationPrice,
                    stock: variation.stock_quantity || 0,
                    sku: variation.sku || product.sku,
                    woocommerce_id: product.id,
                    categories: product.categories || []
                  } as Product;
                  found = true;
                  break;
                }
              } catch (varError) {
                // Continuar buscando en otros productos si hay error
                console.warn(`Error buscando variaciones para producto ${product.id}:`, varError);
              }
              
              if (found) break;
            }
          }
          
          // Si no hay más páginas o no se encontró en esta página
          if (!productsData?.pagination || page >= productsData.pagination.totalPages) {
            break;
          }
          
          page++;
        }
        
        if (!productToAdd) {
          toast.error("Producto no encontrado");
          return;
        }
      }
      
      // Añadir al carrito (sin validar stock, ya que se está escaneando físicamente)
      if (productToAdd) {
        // Si tiene variaciones, mostrar el diálogo pero sin validar stock
        const hasVariations = productToAdd.variations && Array.isArray(productToAdd.variations) && productToAdd.variations.length > 0;
        
        // Marcar que viene de escaneo de código de barras
        setIsFromBarcodeScan(true);
        
        if (hasVariations) {
          // Mostrar diálogo para seleccionar variación
          setSelectedProductForVariation(productToAdd);
          setVariationDialogOpen(true);
          setLoadingVariations(true);
          
          try {
            const variations = await fetchVariations(productToAdd.woocommerce_id || productToAdd.id);
            setProductVariations(variations);
          } catch (error: any) {
            toast.error("Error al cargar variaciones: " + (error.message || "Error desconocido"));
            setVariationDialogOpen(false);
            setIsFromBarcodeScan(false);
          } finally {
            setLoadingVariations(false);
          }
        } else {
          // Añadir directamente sin validar stock
          addProductToCart(productToAdd, undefined, true);
          setIsFromBarcodeScan(false);
        }
      }
    } catch (error: any) {
      console.error('Error escaneando código:', error);
      toast.error("Error al procesar el código escaneado: " + (error.message || "Error desconocido"));
    }
  };

  // Manejar el input del escáner
  useEffect(() => {
    if (isScanning && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isScanning]);

  // Manejar cuando se escribe en el input del escáner
  useEffect(() => {
    if (barcodeInput && barcodeInput.length > 0) {
      // Esperar un momento para asegurar que el código completo se haya escaneado
      const timeout = setTimeout(() => {
        handleBarcodeScan(barcodeInput);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [barcodeInput]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Punto de Venta (TPV)</h1>
        <p className="text-muted-foreground">Sistema de ventas en tienda física</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRODUCTOS/CATEGORÍAS - 2/3 del espacio */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedCategory !== null ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(null);
                            setSelectedGeneralCategory(null);
                            setSearchTerm("");
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {categories.find(c => c.id === selectedCategory)?.name || "Productos"}
                      </div>
                    ) : selectedGeneralCategory !== null ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGeneralCategory(null);
                            setSearchTerm("");
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {GENERAL_CATEGORIES.find(gc => gc.id === selectedGeneralCategory)?.name || "Categorías"}
                      </div>
                    ) : (
                      "Categorías"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedCategory !== null 
                      ? "Selecciona productos para agregar al carrito" 
                      : selectedGeneralCategory !== null
                      ? "Selecciona una subcategoría para ver sus productos"
                      : "Selecciona una categoría general para comenzar"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buscador - Solo mostrar cuando hay categoría seleccionada */}
              {selectedCategory !== null && selectedGeneralCategory !== null && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Mostrar categorías generales, subcategorías o productos según el estado */}
              {selectedCategory === null && selectedGeneralCategory === null ? (
                // VISTA DE CATEGORÍAS GENERALES
                (categoriesLoading || loadingAllProducts) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando categorías...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto">
                    {GENERAL_CATEGORIES.slice().sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })).map((generalCat) => {
                      const subCategories = getCategoriesByGeneralCategory(generalCat.id);
                      
                      return (
                        <Card 
                          key={generalCat.id}
                          className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                          onClick={() => {
                            setSelectedGeneralCategory(generalCat.id);
                          }}
                        >
                          <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                            <div className="text-4xl mb-2">{generalCat.icon}</div>
                            <h3 className="font-semibold text-sm text-center">
                              {generalCat.name}
                            </h3>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              ) : selectedCategory === null && selectedGeneralCategory !== null ? (
                // VISTA DE SUBCATEGORÍAS DE WOOCOMMERCE (cuando se selecciona una categoría general)
                (categoriesLoading || loadingAllProducts) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando subcategorías...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
                    {(() => {
                      const subCategories = getCategoriesByGeneralCategory(selectedGeneralCategory);
                      
                      // Mostrar TODAS las subcategorías, incluso las vacías
                      return subCategories.map((category) => {
                        const productsInCategory = getProductCountForCategory(category.id);
                        
                        return (
                          <Card 
                            key={category.id}
                            className={`cursor-pointer hover:border-primary hover:shadow-md transition-all ${
                              productsInCategory === 0 ? 'opacity-60' : ''
                            }`}
                            onClick={() => {
                              setSelectedCategory(category.id);
                            }}
                          >
                            <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[100px]">
                              <Folder className="h-10 w-10 text-primary mb-2" />
                              <h3 className="font-semibold text-xs text-center line-clamp-2">
                                {category.name}
                              </h3>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                    
                    {getCategoriesByGeneralCategory(selectedGeneralCategory).length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No hay subcategorías en esta categoría general
                      </div>
                    )}
                  </div>
                )
              ) : (
                // VISTA DE PRODUCTOS DE LA CATEGORÍA SELECCIONADA
                (productsLoading || loadingAllProducts) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando productos...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                    {filteredProducts.map((product) => {
                      const isLowStock = product.stock <= 5;
                      const isVeryLowStock = product.stock <= 2;
                      const firstImage = product.images && product.images.length > 0 ? product.images[0].src : null;
                      
                      return (
                        <Card 
                          key={product.id}
                          className={`cursor-pointer hover:border-primary hover:shadow-md transition-all ${
                            isVeryLowStock ? 'border-destructive border-2' : 
                            isLowStock ? 'border-orange-500' : ''
                          }`}
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-3 flex flex-col h-full">
                            {/* Imagen del producto */}
                            {firstImage && (
                              <div className="relative w-full h-32 overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center mb-2">
                                <img 
                                  src={firstImage} 
                                  alt={product.images[0].alt || product.name}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            <div className="flex-1 space-y-1.5 mb-3">
                              <div className="flex items-start gap-2">
                                <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px] flex-1">{product.name}</h3>
                                {product.variations && Array.isArray(product.variations) && product.variations.length > 0 && (
                                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                                    {product.variations.length} variaciones
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="text-xl font-bold text-primary">
                                {(typeof product.price === 'number' ? product.price : parseFloat(product.price)) * 1.21}€
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(typeof product.price === 'number' ? product.price : parseFloat(product.price)).toFixed(2)}€ (sin IVA)
                              </div>
                              
                              <div className={`text-xs font-semibold px-2 py-1 rounded-md inline-block ${
                                isVeryLowStock 
                                  ? 'bg-destructive/10 text-destructive animate-pulse' 
                                  : isLowStock 
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {isVeryLowStock ? '⚠️ ¡ÚLTIMAS! ' : isLowStock ? '⚠️ Poco stock: ' : 'Stock: '}
                                {product.stock}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {filteredProducts.length === 0 && !productsLoading && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        {searchTerm 
                          ? "No se encontraron productos con ese término de búsqueda" 
                          : "No hay productos disponibles en esta categoría"}
                      </div>
                    )}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* CARRITO - 1/3 del espacio */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrito ({cartItems.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={isScanning ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => {
                      setIsScanning(!isScanning);
                      if (!isScanning && barcodeInputRef.current) {
                        setTimeout(() => barcodeInputRef.current?.focus(), 100);
                      }
                    }}
                  >
                    <ScanLine className="h-4 w-4 mr-1" />
                    {isScanning ? "Escaneando..." : "Escanear"}
                  </Button>
                  {cartItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input oculto para capturar el escaneo */}
              {isScanning && (
                <div className="mb-2">
                  <Input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onBlur={() => {
                      // Mantener el foco si está en modo escaneo
                      if (isScanning && barcodeInputRef.current) {
                        setTimeout(() => barcodeInputRef.current?.focus(), 100);
                      }
                    }}
                    placeholder="Escanea el código de barras..."
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Escanea el código de barras de la etiqueta
                  </p>
                </div>
              )}
              {/* Items del carrito */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Carrito vacío</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.product_id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product_id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-primary">
                          {item.subtotal.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <>
                  {/* Resumen de precios */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal (sin IVA):</span>
                        <span>{(calculateSubtotal() / 1.21).toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (21%):</span>
                        <span>{(calculateSubtotal() - (calculateSubtotal() / 1.21)).toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Subtotal (con IVA):</span>
                        <span>{calculateSubtotal().toFixed(2)}€</span>
                      </div>
                      
                      <PermissionGate permission="apply_discount">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Descuento:</Label>
                            <Select value={discountType} onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}>
                              <SelectTrigger className="h-8 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">€</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={discountAmount}
                              onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                              className="h-8 w-20"
                              min="0"
                              max={discountType === "percentage" ? 100 : calculateSubtotal()}
                            />
                          </div>
                          {calculateDiscount() > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Descuento aplicado:</span>
                              <span>-{calculateDiscount().toFixed(2)}€</span>
                            </div>
                          )}
                        </div>
                      </PermissionGate>
                    </div>
                    
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>TOTAL:</span>
                      <span className="text-2xl text-primary">
                        {calculateTotal().toFixed(2)}€
                      </span>
                    </div>
                  </div>

                    {/* Método de pago */}
                    <div className="space-y-2">
                      <Label>Método de Pago</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Efectivo">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              Efectivo
                            </div>
                          </SelectItem>
                          <SelectItem value="Tarjeta">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Tarjeta
                            </div>
                          </SelectItem>
                          <SelectItem value="Mixto">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Mixto
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Botones de ticket */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (cartItems.length === 0) {
                            toast.error("El carrito está vacío");
                            return;
                          }
                          generateTicket({
                            items: cartItems,
                            subtotal: calculateSubtotal(),
                            discount: calculateDiscount(),
                            total: calculateTotal(),
                            paymentMethod: paymentMethod,
                            ticketNumber: `TICKET-${Date.now()}`
                          }, { preview: true });
                        }}
                        disabled={cartItems.length === 0 || isGeneratingTicket}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Ticket
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (cartItems.length === 0) {
                            toast.error("El carrito está vacío");
                            return;
                          }
                          printTicket({
                            items: cartItems,
                            subtotal: calculateSubtotal(),
                            discount: calculateDiscount(),
                            total: calculateTotal(),
                            paymentMethod: paymentMethod,
                            ticketNumber: `TICKET-${Date.now()}`
                          });
                        }}
                        disabled={cartItems.length === 0 || isGeneratingTicket}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </Button>
                    </div>

                    {/* Botón procesar venta */}
                    <Button 
                      className="w-full bg-gradient-hero text-lg h-12"
                      onClick={processSale}
                      disabled={processing}
                    >
                      {processing ? "Procesando..." : "Procesar Venta"}
                    </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo para seleccionar variación */}
      <Dialog open={variationDialogOpen} onOpenChange={setVariationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Seleccionar variación - {selectedProductForVariation?.name}
            </DialogTitle>
            <DialogDescription>
              Este producto tiene variaciones. Selecciona la talla y color que deseas añadir al carrito.
            </DialogDescription>
          </DialogHeader>
          
          {loadingVariations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando variaciones...</span>
            </div>
          ) : productVariations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay variaciones disponibles para este producto
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productVariations.map((variation) => {
                const varStock = variation.stock_quantity || 0;
                const varAttributes = variation.attributes?.map((a: any) => `${a.name}: ${a.option}`).join(', ') || 'Sin atributos';
                const varPrice = parseFloat(variation.price || variation.regular_price || '0');
                const hasStock = varStock > 0;
                
                return (
                  <Card
                    key={variation.id}
                    className={`cursor-pointer hover:border-primary transition-all ${
                      !hasStock ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      // Usar el estado para saber si viene del escáner
                      addProductToCart(selectedProductForVariation!, variation, isFromBarcodeScan);
                      setIsFromBarcodeScan(false); // Resetear el estado después de añadir
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{varAttributes}</div>
                            {variation.sku && (
                              <div className="text-xs text-muted-foreground mt-1">
                                SKU: {variation.sku}
                              </div>
                            )}
                          </div>
                          <Badge variant={hasStock ? "secondary" : "destructive"}>
                            {hasStock ? `Stock: ${varStock}` : 'Sin stock'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Precio:</span>
                          <span className="font-bold text-primary">
                            {(varPrice * 1.21).toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariationDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

