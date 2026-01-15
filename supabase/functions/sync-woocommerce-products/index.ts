import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
    const storeUrl = Deno.env.get('WOOCOMMERCE_STORE_URL');

    if (!consumerKey || !consumerSecret || !storeUrl) {
      console.error('Missing WooCommerce credentials');
      throw new Error('WooCommerce credentials not configured');
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      console.error('❌ Error al parsear JSON del request:', err);
      throw new Error(`Error al parsear request body: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    
    const { action, productId, productData, params, limit } = requestBody;
    console.log('📥 Request recibido:', { action, hasParams: !!params, paramsType: typeof params });
    
    // Validar que params existe para acciones que lo requieren
    if ((action === 'get_categories' || action === 'list') && params === undefined) {
      console.warn('⚠️ Params no definido, usando valores por defecto');
    }
    
    // Validar que action existe
    if (!action) {
      throw new Error('Action is required');
    }

    let endpoint = '';
    let method = 'GET';
    let body = null;

    switch (action) {
      case 'get_products':
        const limitCount = limit || 20;
        endpoint = `/wp-json/wc/v3/products?per_page=${limitCount}&orderby=date&order=desc`;
        break;
        
      case 'list':
        const page = params?.page || 1;
        const perPage = params?.per_page || 20;
        const search = params?.search || '';
        const category = params?.category;
        const stockStatus = params?.stock_status || '';
        
        let queryParams = [];
        if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
        if (category !== undefined && category !== null && category !== '') {
          // WooCommerce espera el ID de categoría como número (sin encodeURIComponent para números)
          const categoryId = typeof category === 'number' ? category : parseInt(String(category));
          if (!isNaN(categoryId) && categoryId > 0) {
            queryParams.push(`category=${categoryId}`);
          }
        }
        if (stockStatus) queryParams.push(`stock_status=${encodeURIComponent(stockStatus)}`);
        
        const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
        endpoint = `/wp-json/wc/v3/products?page=${page}&per_page=${perPage}${queryString}`;
        console.log('📦 Filtros aplicados:', { page, perPage, search, category, stockStatus, endpoint, queryString });
        break;
      
      case 'get':
        if (!productId) throw new Error('Product ID required');
        endpoint = `/wp-json/wc/v3/products/${productId}`;
        break;
      
      case 'update':
        if (!productId) throw new Error('Product ID required');
        method = 'PUT';
        endpoint = `/wp-json/wc/v3/products/${productId}`;
        body = JSON.stringify(productData);
        break;
      
      case 'delete':
        if (!productId) throw new Error('Product ID required');
        method = 'DELETE';
        endpoint = `/wp-json/wc/v3/products/${productId}`;
        break;
      
      case 'create':
        method = 'POST';
        endpoint = `/wp-json/wc/v3/products`;
        body = JSON.stringify(productData);
        break;
      
      case 'get_categories':
        try {
          const catPage = (params && typeof params === 'object' && 'page' in params) ? Number(params.page) || 1 : 1;
          const catPerPage = (params && typeof params === 'object' && 'per_page' in params) ? Number(params.per_page) || 100 : 100;
          endpoint = `/wp-json/wc/v3/products/categories?page=${catPage}&per_page=${catPerPage}&orderby=name&order=asc`;
          console.log('📦 Obteniendo categorías:', { catPage, catPerPage, endpoint, paramsType: typeof params, params });
        } catch (err) {
          console.error('❌ Error en get_categories case:', err);
          throw new Error(`Error al procesar get_categories: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        break;
      
      default:
        throw new Error('Invalid action');
    }

    // Build the full URL
    if (!endpoint) {
      throw new Error(`Endpoint no definido para la acción: ${action}`);
    }
    
    const url = `${storeUrl}${endpoint}`;
    console.log('🌐 Calling WooCommerce:', { method, endpoint, url: url.substring(0, 100) + '...' });

    // Create Basic Auth header
    const auth = btoa(`${consumerKey}:${consumerSecret}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Flamenca-Store/1.0',
      },
      body,
      // Agregar configuración para evitar errores HTTP2
      keepalive: false,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API Error:', response.status, errorText);
      console.error('URL que falló:', url);
      throw new Error(`WooCommerce API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    // Get total count from headers for pagination
    const totalCount = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');

    // Log para depuración de categorías
    if (action === 'get_categories') {
      console.log('📦 Categorías obtenidas de WooCommerce:', {
        count: Array.isArray(data) ? data.length : 'No es array',
        isArray: Array.isArray(data),
        dataType: typeof data,
        firstItem: Array.isArray(data) && data.length > 0 ? {
          id: data[0].id,
          name: data[0].name,
          slug: data[0].slug
        } : null,
        totalCount,
        totalPages
      });
    }

    // Asegurar que data sea un array
    const responseData = Array.isArray(data) ? data : (data ? [data] : []);
    
    return new Response(
      JSON.stringify({ 
        data: responseData,
        pagination: totalCount ? {
          total: parseInt(totalCount),
          totalPages: parseInt(totalPages || '1')
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in woocommerce-products function:', error);
    console.error('Error type:', typeof error);
    console.error('Error instanceof Error:', error instanceof Error);
    
    // Manejar errores específicos de conexión
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
      
      // Si es un error de conexión, devolver un error más específico
      if (error.message.includes('connection error') || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con WooCommerce. Verifica la URL y las credenciales.';
        statusCode = 503; // Service Unavailable
      }
    } else {
      errorDetails = {
        error: String(error),
        type: typeof error
      };
    }
    
    console.error('📤 Enviando respuesta de error:', { errorMessage, statusCode, errorDetails });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});