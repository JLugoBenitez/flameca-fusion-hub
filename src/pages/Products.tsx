import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, RefreshCw, Search, Loader2, X, Filter, Check, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Product } from "@/types";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { useAutoNotifications } from "@/hooks/useAutoNotifications";
import { PermissionGate } from "@/components/PermissionGate";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useProductLabel } from "@/hooks/useProductLabel";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function Products() {
  const { 
    products, 
    loading, 
    refetch, 
    fetchProducts, 
    syncProducts,
    currentPage,
    totalPages,
    totalProducts,
    productsPerPage,
    stockStats,
    fetchStockStats,
    categories,
    categoriesLoading,
    fetchCategories,
    goToPage,
    nextPage,
    prevPage
  } = useWooCommerceProducts();
  const { notifyLowStock, notifyOutOfStock } = useAutoNotifications();
  const { fetchVariations, loading: loadingVariations } = useProductVariations();
  const { generateLabel, generateMultipleLabels, isGenerating: isGeneratingLabel } = useProductLabel();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low-stock" | "very-low-stock" | "out-of-stock">("all");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [productVariationsCache, setProductVariationsCache] = useState<Record<number, any[]>>({});
  const [formData, setFormData] = useState({
    name: "",
    regular_price: "",
    sale_price: "",
    description: "",
    short_description: "",
    sku: "",
    stock_quantity: "",
    manage_stock: false,
  });

  // Debounce para la búsqueda
  useEffect(() => {
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Crear nuevo timeout
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms de debounce

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Construir parámetros de filtro para el backend
  const buildFilterParams = useCallback(() => {
    const params: { search?: string; category?: number; stock_status?: string; stockFilter?: string } = {};
    
    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim();
    }
    
    if (selectedCategory !== null) {
      params.category = selectedCategory;
    }
    
    // Mapear filtros de stock
    if (stockFilter === "out-of-stock") {
      params.stock_status = "outofstock";
    } else if (stockFilter !== "all") {
      // Para filtros específicos (in-stock, low-stock, very-low-stock), pasamos el stockFilter
      // para que el hook obtenga todos los productos y los filtre globalmente
      params.stockFilter = stockFilter;
      params.stock_status = "instock"; // Base para obtener productos con stock
    }
    
    return params;
  }, [debouncedSearchTerm, selectedCategory, stockFilter]);

  // Buscar productos cuando cambia el término de búsqueda, categoría o stock
  useEffect(() => {
    const params = buildFilterParams();
    console.log('🔍 Aplicando filtros:', params);
    console.log('📋 Estado actual:', { 
      selectedCategory, 
      stockFilter, 
      debouncedSearchTerm,
      params 
    });
    fetchProducts(1, params);
  }, [debouncedSearchTerm, selectedCategory, stockFilter, fetchProducts, buildFilterParams]);

  // Funciones de paginación que mantienen todos los filtros
  const handleGoToPage = (page: number) => {
    const params = buildFilterParams();
    fetchProducts(page, params);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const params = buildFilterParams();
      fetchProducts(currentPage + 1, params);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const params = buildFilterParams();
      fetchProducts(currentPage - 1, params);
    }
  };

  const handleRefetch = () => {
    const params = buildFilterParams();
    fetchProducts(currentPage, params);
  };

  // Los productos ya vienen filtrados del backend/hook según los filtros aplicados
  // No necesitamos filtrar adicionalmente aquí
  const filteredProducts = products;

  // Crear o actualizar producto directamente en WooCommerce
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        type: "simple",
        status: "publish",
        regular_price: formData.regular_price,
        sale_price: formData.sale_price || "",
        description: formData.description,
        short_description: formData.short_description,
        sku: formData.sku,
        stock_status: formData.stock_quantity && parseInt(formData.stock_quantity) > 0 ? "instock" : "outofstock",
        manage_stock: formData.stock_quantity !== "",
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
      };

      if (editingProduct) {
        // Obtener el stock anterior para comparar
        const oldStock = editingProduct.stock_quantity || 0;
        const newStock = productData.stock_quantity || 0;
        
        // Actualizar producto existente en WooCommerce
        const { error } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: { 
            action: 'update',
            productId: editingProduct.id,
            productData
          }
        });

        if (error) throw error;
        
        // Enviar notificaciones si el stock cambió significativamente
        if (oldStock !== newStock) {
          
          if (newStock === 0) {
            // Stock agotado
            await notifyOutOfStock([{
              id: editingProduct.id.toString(),
              name: editingProduct.name,
              stock: newStock
            }]);
          } else if (newStock <= 2 && oldStock > 2) {
            // Stock bajo (solo notificar si antes tenía más de 2)
            await notifyLowStock([{
              id: editingProduct.id.toString(),
              name: editingProduct.name,
              stock: newStock
            }]);
          }
        }
        
        toast.success("Producto actualizado en WooCommerce");
      } else {
        // Crear nuevo producto en WooCommerce
        const { error } = await supabase.functions.invoke('sync-woocommerce-products', {
          body: { 
            action: 'create',
            productData
          }
        });

        if (error) throw error;
        toast.success("Producto creado en WooCommerce");
      }

      setDialogOpen(false);
      resetForm();
      handleRefetch();
      fetchStockStats(); // Actualizar estadísticas globales después de editar
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error("Error al guardar producto en WooCommerce: " + error.message);
    }
  };

  // Generar etiquetas para un producto
  const handleGenerateLabels = async (product: Product) => {
    try {
      // Verificar si el producto tiene variaciones
      const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0;

      if (hasVariations) {
        // Obtener todas las variaciones
        const variations = await fetchVariations(product.woocommerce_id || product.id);
        
        if (variations.length === 0) {
          toast.error("No se encontraron variaciones para este producto");
          return;
        }
        
        // Generar etiqueta para cada variación
        const labelsData = variations.map(variation => ({
          product,
          variation,
          barcode: `VAR-${variation.id}`
        }));
        
        await generateMultipleLabels(labelsData);
      } else {
        // Producto sin variaciones - generar una sola etiqueta
        await generateLabel({
          product,
          barcode: `PROD-${product.woocommerce_id || product.id}`
        });
      }
    } catch (error: any) {
      toast.error("Error al generar etiquetas: " + (error.message || "Error desconocido"));
    }
  };

  // Eliminar producto directamente de WooCommerce
  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;

    try {
      console.log('Deleting product from WooCommerce:', deleteProduct.id);
      
      const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
        body: { 
          action: 'delete',
          productId: deleteProduct.id
        }
      });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Delete response:', data);
      toast.success(`Producto "${deleteProduct.name}" eliminado de WooCommerce`);
      handleRefetch();
      fetchStockStats(); // Actualizar estadísticas globales después de eliminar
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error("Error al eliminar producto de WooCommerce: " + error.message);
    } finally {
      setDeleteProduct(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      regular_price: product.regular_price,
      sale_price: product.sale_price || "",
      description: product.description || "",
      short_description: product.short_description || "",
      sku: product.sku || "",
      stock_quantity: product.stock_quantity?.toString() || "",
      stock_status: product.stock_status,
      manage_stock: product.stock_quantity !== null,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      regular_price: "",
      sale_price: "",
      description: "",
      short_description: "",
      sku: "",
      stock_quantity: "",
      manage_stock: false,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { handleRefetch(); fetchStockStats(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <PermissionGate permission="create_product">
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-hero">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar" : "Nuevo"} Producto</DialogTitle>
                <DialogDescription>
                  Completa los datos del producto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Camiseta Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Código único del producto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regular_price">Precio Regular *</Label>
                    <Input
                      id="regular_price"
                      type="number"
                      step="0.01"
                      value={formData.regular_price}
                      onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Precio Oferta</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="Dejar vacío para sin gestión"
                    />
                  </div>

                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Descripción Corta</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={3}
                    className="resize-none"
                    placeholder="Resumen breve que aparecerá en las listas de productos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción Completa</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="resize-none"
                    placeholder="Descripción detallada del producto"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" className="bg-gradient-hero">
                    {editingProduct ? "Actualizar" : "Crear"} Producto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </PermissionGate>
        </div>
      </div>

      {/* Estadísticas de Stock - Globales de toda la tienda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/10 dark:bg-green-500/20 dark:border-green-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">En Stock</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {stockStats.loading ? (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              ) : (
                stockStats.inStock
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/20 dark:border-orange-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Poco Stock</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {stockStats.loading ? (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              ) : (
                stockStats.lowStock
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-500/30 bg-red-500/10 dark:bg-red-500/20 dark:border-red-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">¡Últimas!</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {stockStats.loading ? (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              ) : (
                stockStats.veryLowStock
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/30 bg-destructive/10 dark:bg-destructive/20 dark:border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive dark:bg-red-400 rounded-full"></div>
              <span className="text-sm font-medium text-destructive dark:text-red-300">Agotados</span>
            </div>
            <div className="text-2xl font-bold text-destructive dark:text-red-400 mt-1">
              {stockStats.loading ? (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              ) : (
                stockStats.outOfStock
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar y Filtros */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos por nombre, SKU o categoría (búsqueda global en todas las páginas)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {loading && debouncedSearchTerm && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => { handleRefetch(); fetchStockStats(); }} 
            disabled={loading || stockStats.loading}
          >
            {loading || stockStats.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Actualizar</span>
          </Button>
        </div>
        
        {/* Menú de Filtros */}
        <div className="flex gap-2 flex-wrap items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
                {(stockFilter !== "all" || selectedCategory !== null) && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Filtros</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Submenú de Categorías */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Categorías</span>
                  {selectedCategory !== null && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory(null)}
                    className={selectedCategory === null ? "bg-accent" : ""}
                  >
                    <Check className={`mr-2 h-4 w-4 ${selectedCategory === null ? "opacity-100" : "opacity-0"}`} />
                    Todas las categorías
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categoriesLoading ? (
                    <DropdownMenuItem disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando categorías...
                    </DropdownMenuItem>
                  ) : categories.length === 0 ? (
                    <DropdownMenuItem disabled>
                      {categoriesLoading ? 'Cargando...' : 'No hay categorías disponibles'}
                    </DropdownMenuItem>
                  ) : (
                    categories.map((category) => {
                      // Verificar que la categoría tenga la estructura correcta
                      if (!category || !category.id || !category.name) {
                        console.warn('Categoría inválida:', category);
                        return null;
                      }
                      return (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={selectedCategory === category.id ? "bg-accent" : ""}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedCategory === category.id ? "opacity-100" : "opacity-0"}`} />
                          {category.name}
                        </DropdownMenuItem>
                      );
                    }).filter(Boolean)
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              {/* Submenú de Stock */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Stock</span>
                  {stockFilter !== "all" && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setStockFilter("all")}
                    className={stockFilter === "all" ? "bg-accent" : ""}
                  >
                    <Check className={`mr-2 h-4 w-4 ${stockFilter === "all" ? "opacity-100" : "opacity-0"}`} />
                    Todos ({totalProducts > 0 ? totalProducts : products.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setStockFilter("in-stock")}
                    className={stockFilter === "in-stock" ? "bg-accent" : ""}
                  >
                    <Check className={`mr-2 h-4 w-4 ${stockFilter === "in-stock" ? "opacity-100" : "opacity-0"}`} />
                    <span className="text-green-600">✅ En Stock</span>
                    <span className="ml-auto text-sm text-muted-foreground">({stockStats.inStock})</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStockFilter("low-stock")}
                    className={stockFilter === "low-stock" ? "bg-accent" : ""}
                  >
                    <Check className={`mr-2 h-4 w-4 ${stockFilter === "low-stock" ? "opacity-100" : "opacity-0"}`} />
                    <span className="text-orange-600">⚠️ Poco Stock</span>
                    <span className="ml-auto text-sm text-muted-foreground">({stockStats.lowStock})</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStockFilter("very-low-stock")}
                    className={stockFilter === "very-low-stock" ? "bg-accent" : ""}
                  >
                    <Check className={`mr-2 h-4 w-4 ${stockFilter === "very-low-stock" ? "opacity-100" : "opacity-0"}`} />
                    <span className="text-red-600">🚨 ¡Últimas!</span>
                    <span className="ml-auto text-sm text-muted-foreground">({stockStats.veryLowStock})</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStockFilter("out-of-stock")}
                    className={stockFilter === "out-of-stock" ? "bg-accent" : ""}
                  >
                    <Check className={`mr-2 h-4 w-4 ${stockFilter === "out-of-stock" ? "opacity-100" : "opacity-0"}`} />
                    <span className="text-destructive">❌ Agotados</span>
                    <span className="ml-auto text-sm text-muted-foreground">({stockStats.outOfStock})</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              {/* Limpiar filtros */}
              {(stockFilter !== "all" || selectedCategory !== null) && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setStockFilter("all");
                      setSelectedCategory(null);
                    }}
                  >
                    Limpiar todos los filtros
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mostrar filtros activos como badges */}
          {(stockFilter !== "all" || selectedCategory !== null) && (
            <div className="flex gap-2 flex-wrap">
              {selectedCategory !== null && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.id === selectedCategory)?.name || "Categoría"}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {stockFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {stockFilter === "in-stock" && "✅ En Stock"}
                  {stockFilter === "low-stock" && "⚠️ Poco Stock"}
                  {stockFilter === "very-low-stock" && "🚨 ¡Últimas!"}
                  {stockFilter === "out-of-stock" && "❌ Agotados"}
                  <button
                    onClick={() => setStockFilter("all")}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton loading
          [...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-md">
              <Skeleton className="w-full h-64 rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-16 mr-2" />
                <Skeleton className="h-8 w-16" />
              </CardFooter>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground">
              {debouncedSearchTerm 
                ? `No se encontraron productos que coincidan con "${debouncedSearchTerm}". Intenta con otros términos de búsqueda.` 
                : stockFilter !== "all"
                  ? `No hay productos con el filtro de stock seleccionado.`
                  : "No hay productos disponibles"}
            </p>
            {debouncedSearchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm("")}
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            // Verificar si tiene variaciones
            const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0;
            const isExpanded = expandedProducts.has(product.id);
            
            // Si tiene variaciones, calcular stock total desde las variaciones en caché
            let stock = product.stock_quantity || 0;
            if (hasVariations && productVariationsCache[product.id]) {
              stock = productVariationsCache[product.id].reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
            }
            
            const isLowStock = stock <= 5;
            const isVeryLowStock = stock <= 2;
            const isOutOfStock = stock === 0;
            
            const firstImage = product.images && product.images.length > 0 ? product.images[0].src : null;
            
            // Función para cargar variaciones si no están en caché
            const loadVariations = async () => {
              if (productVariationsCache[product.id]) return;
              
              try {
                const variations = await fetchVariations(product.woocommerce_id || product.id);
                setProductVariationsCache(prev => ({
                  ...prev,
                  [product.id]: variations
                }));
              } catch (error) {
                console.error('Error cargando variaciones:', error);
              }
            };
            
            // Función para toggle expandir
            const toggleExpand = () => {
              if (!isExpanded) {
                loadVariations();
                setExpandedProducts(prev => new Set([...prev, product.id]));
              } else {
                setExpandedProducts(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(product.id);
                  return newSet;
                });
              }
            };
            
            return (
            <Card 
              key={product.id} 
              className={`shadow-md hover:shadow-lg transition-all ${
                isOutOfStock ? 'border-destructive border-2 opacity-75' :
                isVeryLowStock ? 'border-destructive border-2' : 
                isLowStock ? 'border-orange-500 border-2' : 
                'hover:border-primary'
              }`}
            >
              {/* Imagen del producto */}
              {firstImage && (
                <div className="relative w-full h-64 overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                  <img 
                    src={firstImage} 
                    alt={product.images[0].alt || product.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // Si la imagen falla al cargar, ocultar el contenedor
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isOutOfStock ? 'bg-destructive' :
                    isVeryLowStock ? 'bg-destructive/80' :
                    isLowStock ? 'bg-orange-500' :
                    'bg-gradient-hero'
                  }`}>
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {hasVariations && (
                    <Badge variant="outline" className="ml-2">
                      {product.variations?.length || 0} variaciones
                    </Badge>
                  )}
                </div>
                {product.short_description && (
                  <CardDescription className="line-clamp-2">{product.short_description}</CardDescription>
                )}
                {hasVariations && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleExpand}
                    className="mt-2 w-full justify-between"
                  >
                    <span className="text-xs">
                      {isExpanded ? 'Ocultar' : 'Ver'} variaciones (tallas/colores)
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <div className="text-right">
                      {product.sale_price ? (
                        <>
                          <div className="font-semibold text-primary text-destructive">
                            ${(parseFloat(product.sale_price) * 1.21).toFixed(2)} (con IVA)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${product.sale_price} (sin IVA)
                          </div>
                          <div className="text-xs text-muted-foreground line-through">
                            ${(parseFloat(product.regular_price) * 1.21).toFixed(2)} (con IVA)
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-primary">
                            ${(parseFloat(product.price) * 1.21).toFixed(2)} (con IVA)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${product.price} (sin IVA)
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Stock con indicador visual */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Stock:</span>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-md inline-block ${
                      isOutOfStock 
                        ? 'bg-destructive/10 text-destructive' 
                        : isVeryLowStock 
                          ? 'bg-destructive/10 text-destructive animate-pulse' 
                          : isLowStock 
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-green-100 text-green-600'
                    }`}>
                      {isOutOfStock ? '❌ Agotado' : 
                       isVeryLowStock ? '⚠️ ¡ÚLTIMAS! ' : 
                       isLowStock ? '⚠️ Poco stock: ' : 
                       '✅ Stock: '}
                      {stock}
                    </div>
                  </div>
                  
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <span>{product.sku}</span>
                    </div>
                  )}
                  {product.categories && product.categories.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoría:</span>
                      <span>{product.categories[0].name}</span>
                    </div>
                  )}
                  
                  {/* Mostrar variaciones si está expandido */}
                  {hasVariations && isExpanded && productVariationsCache[product.id] && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        Variaciones disponibles:
                      </div>
                      {productVariationsCache[product.id].map((variation) => {
                        const varStock = variation.stock_quantity || 0;
                        const varAttributes = variation.attributes?.map(a => `${a.name}: ${a.option}`).join(', ') || 'Sin atributos';
                        const varPrice = parseFloat(variation.price || variation.regular_price || '0');
                        
                        return (
                          <div 
                            key={variation.id} 
                            className="p-2 bg-muted rounded-md text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{varAttributes}</span>
                              <Badge variant={varStock > 0 ? "secondary" : "destructive"} className="text-xs">
                                {varStock > 0 ? `Stock: ${varStock}` : 'Sin stock'}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>SKU: {variation.sku || 'N/A'}</span>
                              <span>{(varPrice * 1.21).toFixed(2)}€</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleGenerateLabels(product)} 
                  disabled={isGeneratingLabel || loadingVariations}
                  className="flex-1"
                >
                  {isGeneratingLabel || loadingVariations ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="mr-2 h-4 w-4" />
                  )}
                  Etiquetas
                </Button>
                <PermissionGate permission="edit_product">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(product)} 
                    className="flex-1"
                    disabled={false}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </PermissionGate>
                <PermissionGate permission="delete_product">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDeleteProduct(product)} 
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PermissionGate>
              </CardFooter>
            </Card>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, totalProducts)} de {totalProducts} productos
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={handlePrevPage} 
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Mostrar números de página */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handleGoToPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={handleNextPage} 
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {!loading && products.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay productos en tu tienda'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el producto "{deleteProduct?.name}" de tu tienda WooCommerce.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}