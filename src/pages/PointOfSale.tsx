import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/PermissionGate";
import { LoadingSpinner, LoadingOverlay } from "@/components/LoadingSpinner";
import { useUserRole } from "@/hooks/useUserRole";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { useNotifications } from "@/hooks/useNotifications";
import { useAutoNotifications } from "@/hooks/useAutoNotifications";
import { toast } from "sonner";
import { ShoppingCart, Trash2, CreditCard, Banknote, Plus, Minus, Search, DollarSign, Percent, Loader2, Printer, Eye, ArrowLeft, Folder } from "lucide-react";
import { Product, CartItem } from "@/types";
import { useTicketPDF } from "@/hooks/useTicketPDF";

export default function PointOfSale() {
  const { can } = useUserRole();
  const { products, loading: productsLoading, updateProductStock, categories, categoriesLoading } = useWooCommerceProducts();
  const { showPromise } = useNotifications();
  const { notifyLowStock, notifyOutOfStock } = useAutoNotifications();
  const { generateTicket, printTicket, isGenerating: isGeneratingTicket } = useTicketPDF();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [processing, setProcessing] = useState(false);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);

  // Cargar todos los productos con stock para el TPV
  useEffect(() => {
    const loadAllProducts = async () => {
      if (productsLoading) return;
      
      setLoadingAllProducts(true);
      try {
        // Obtener todos los productos (no solo con stock, para incluir todos)
        // Luego filtraremos por stock > 0
        let allProductsList: Product[] = [];
        let currentPage = 1;
        let hasMore = true;
        const perPage = 100;

        console.log('🔄 TPV: Iniciando carga de todos los productos...');

        while (hasMore) {
          const { data, error } = await supabase.functions.invoke('sync-woocommerce-products', {
            body: { 
              action: 'list',
              params: {
                page: currentPage,
                per_page: perPage
                // No filtrar por stock_status aquí para obtener TODOS los productos
              }
            }
          });

          if (error) {
            console.error('Error en página', currentPage, error);
            break;
          }

          const pageProducts = data?.data || [];
          const pagination = data?.pagination;

          console.log(`📦 TPV: Página ${currentPage}: ${pageProducts.length} productos obtenidos`);

          // Transformar productos
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
            categories: p.categories || [], // Asegurar que siempre sea un array
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
            console.log(`📄 TPV: Total páginas: ${pagination.totalPages}, página actual: ${currentPage}`);
          } else {
            hasMore = pageProducts.length === perPage;
            currentPage++;
          }

          // Limitar a un máximo razonable
          if (currentPage > 30) {
            console.log('⚠️ TPV: Límite de páginas alcanzado (30)');
            break; // Máximo 3000 productos
          }
        }

        // Filtrar solo productos con stock > 0
        const productsWithStock = allProductsList.filter(p => p.stock > 0);
        
        console.log(`✅ TPV: Cargados ${allProductsList.length} productos totales, ${productsWithStock.length} con stock`);
        
        // Log de categorías de productos para debug
        const categoryCounts = new Map<number, number>();
        productsWithStock.forEach(p => {
          p.categories?.forEach(cat => {
            categoryCounts.set(cat.id, (categoryCounts.get(cat.id) || 0) + 1);
          });
        });
        console.log('📊 TPV: Productos por categoría:', Array.from(categoryCounts.entries()).slice(0, 10));
        
        setAllProducts(productsWithStock);
      } catch (err: any) {
        console.error('❌ Error cargando todos los productos para TPV:', err);
        // Si falla, usar los productos ya cargados
        const fallbackProducts = products.filter(p => p.stock > 0);
        console.log(`⚠️ TPV: Usando productos del hook como fallback: ${fallbackProducts.length} productos`);
        setAllProducts(fallbackProducts);
      } finally {
        setLoadingAllProducts(false);
      }
    };

    // Solo cargar si no hay productos ya cargados o si productsLoading cambió
    if (!productsLoading) {
      loadAllProducts();
    }
  }, [productsLoading, products]);

  useEffect(() => {
    // Usar allProducts en lugar de products para tener todos los productos
    let productsToFilter = allProducts.length > 0 ? allProducts : products.filter(p => p.stock > 0);
    
    console.log('📦 Productos disponibles para filtrar:', productsToFilter.length);
    console.log('📋 Categoría seleccionada:', selectedCategory);
    
    // Filtrar por categoría si hay una seleccionada
    if (selectedCategory !== null) {
      const beforeFilter = productsToFilter.length;
      productsToFilter = productsToFilter.filter(p => {
        const hasCategory = p.categories?.some(cat => cat.id === selectedCategory);
        if (!hasCategory && p.categories && p.categories.length > 0) {
          console.log('🔍 Producto sin categoría coincidente:', {
            productName: p.name,
            productCategories: p.categories.map(c => ({ id: c.id, name: c.name })),
            selectedCategoryId: selectedCategory
          });
        }
        return hasCategory;
      });
      console.log(`✅ Productos filtrados por categoría ${selectedCategory}: ${beforeFilter} -> ${productsToFilter.length}`);
      
      // Si no hay productos, verificar algunos productos para debug
      if (productsToFilter.length === 0 && productsToFilter.length > 0) {
        console.log('⚠️ No se encontraron productos. Ejemplo de producto:', {
          name: productsToFilter[0]?.name,
          categories: productsToFilter[0]?.categories,
          hasCategories: !!productsToFilter[0]?.categories,
          categoriesLength: productsToFilter[0]?.categories?.length || 0
        });
      }
    }
    
    // Filtrar por búsqueda si hay término de búsqueda
    if (searchTerm) {
      const filtered = productsToFilter.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(productsToFilter);
    }
    
    console.log('✅ Productos finales filtrados:', filteredProducts.length);
  }, [searchTerm, allProducts, products, selectedCategory]);


  const addToCart = (product: Product) => {
    // Verificar que el producto tenga stock
    if (product.stock <= 0) {
      toast.error(`${product.name} no tiene stock disponible`);
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Stock máximo alcanzado (${product.stock} disponibles)`);
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: (typeof product.price === 'number' ? product.price : parseFloat(product.price)) * 1.21, // Precio con IVA para el TPV
        subtotal: (typeof product.price === 'number' ? product.price : parseFloat(product.price)) * 1.21,
      };
      setCartItems([...cartItems, newItem]);
      toast.success(`${product.name} agregado al carrito`);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Verificar que el producto tenga stock
    if (product.stock <= 0) {
      toast.error(`${product.name} no tiene stock disponible`);
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      toast.error(`Stock máximo: ${product.stock} unidades disponibles`);
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(cartItems.map(item => 
      item.product_id === productId
        ? { ...item, quantity: newQuantity, subtotal: item.unit_price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
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
      const allProductsList = allProducts.length > 0 ? allProducts : products;
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
    }
  };

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
                            setSearchTerm("");
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {categories.find(c => c.id === selectedCategory)?.name || "Productos"}
                      </div>
                    ) : (
                      "Categorías"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedCategory !== null 
                      ? "Selecciona productos para agregar al carrito" 
                      : "Selecciona una categoría para ver sus productos"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buscador - Solo mostrar cuando hay categoría seleccionada */}
              {selectedCategory !== null && (
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

              {/* Mostrar categorías o productos según el estado */}
              {selectedCategory === null ? (
                // VISTA DE CATEGORÍAS
                (categoriesLoading || loadingAllProducts) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando categorías y productos...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
                    {categories.map((category) => {
                      // Contar productos con stock en esta categoría (usar allProducts si está disponible)
                      const productsToCount = allProducts.length > 0 ? allProducts : products.filter(p => p.stock > 0);
                      const productsInCategory = productsToCount.filter(p => {
                        if (p.stock <= 0) return false;
                        if (!p.categories || p.categories.length === 0) return false;
                        const hasCategory = p.categories.some(cat => cat.id === category.id);
                        return hasCategory;
                      });
                      
                      // Solo mostrar categorías que tienen productos o que están cargando
                      // (para evitar mostrar categorías vacías mientras se cargan)
                      if (productsInCategory.length === 0 && !loadingAllProducts && allProducts.length > 0) {
                        // Categoría realmente vacía - opcional: no mostrarla o mostrarla con estilo diferente
                        return null; // Ocultar categorías sin productos
                      }
                      
                      return (
                        <Card 
                          key={category.id}
                          className={`cursor-pointer hover:border-primary hover:shadow-md transition-all ${
                            productsInCategory.length === 0 ? 'opacity-50' : ''
                          }`}
                          onClick={() => {
                            console.log(`🖱️ Clic en categoría: ${category.name} (ID: ${category.id})`);
                            console.log(`📦 Productos en esta categoría: ${productsInCategory.length}`);
                            setSelectedCategory(category.id);
                          }}
                        >
                          <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                            <Folder className="h-12 w-12 text-primary mb-2" />
                            <h3 className="font-semibold text-sm text-center line-clamp-2 mb-1">
                              {category.name}
                            </h3>
                            <Badge variant={productsInCategory.length > 0 ? "secondary" : "outline"} className="text-xs">
                              {productsInCategory.length} {productsInCategory.length === 1 ? 'producto' : 'productos'}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    }).filter(Boolean)}
                    
                    {categories.length === 0 && !categoriesLoading && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No hay categorías disponibles
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
                              <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">{product.name}</h3>
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
                {cartItems.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
    </div>
  );
}

