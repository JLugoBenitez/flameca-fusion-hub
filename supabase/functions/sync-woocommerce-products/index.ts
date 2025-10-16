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

    const { action, productId, productData, params } = await req.json();
    console.log('Action:', action, 'ProductId:', productId);

    let endpoint = '';
    let method = 'GET';
    let body = null;

    switch (action) {
      case 'list':
        const page = params?.page || 1;
        const perPage = params?.per_page || 20;
        const search = params?.search || '';
        endpoint = `/wp-json/wc/v3/products?page=${page}&per_page=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
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
      
      default:
        throw new Error('Invalid action');
    }

    // Build the full URL
    const url = `${storeUrl}${endpoint}`;
    console.log('Calling WooCommerce:', method, endpoint);

    // Create Basic Auth header
    const auth = btoa(`${consumerKey}:${consumerSecret}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API Error:', response.status, errorText);
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Get total count from headers for pagination
    const totalCount = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');

    return new Response(
      JSON.stringify({ 
        data,
        pagination: totalCount ? {
          total: parseInt(totalCount),
          totalPages: parseInt(totalPages || '1')
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in woocommerce-products function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});