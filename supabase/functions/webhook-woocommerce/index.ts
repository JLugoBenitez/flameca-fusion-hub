import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔔 Webhook recibido de WooCommerce');
    
    const body = await req.json();
    console.log('📦 Datos del webhook:', JSON.stringify(body, null, 2));

    // Verificar que es un webhook válido de WooCommerce
    if (!body || !body.type) {
      console.log('❌ Webhook inválido - no hay tipo');
      return new Response(JSON.stringify({ error: 'Invalid webhook' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Procesar según el tipo de evento
    switch (body.type) {
      case 'product.updated':
        console.log('📦 Producto actualizado - sincronizando stock...');
        await syncProduct(body.data);
        break;
        
      case 'order.created':
        console.log('🛒 Nuevo pedido creado - sincronizando...');
        await syncOrder(body.data);
        break;
        
      case 'order.updated':
        console.log('🛒 Pedido actualizado - sincronizando...');
        await syncOrder(body.data);
        break;
        
      default:
        console.log(`ℹ️ Evento no manejado: ${body.type}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Webhook processed' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncProduct(productData: any) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🔄 Sincronizando producto ${productData.id}: ${productData.name}`);
    console.log(`📊 Stock actual: ${productData.stock_quantity}`);

    // Actualizar el producto en la base de datos local
    const { error } = await supabase
      .from('products')
      .upsert({
        woocommerce_id: productData.id,
        name: productData.name,
        price: parseFloat(productData.price || '0'),
        stock_quantity: parseInt(productData.stock_quantity || '0'),
        stock_status: productData.stock_status,
        sku: productData.sku,
        description: productData.description,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'woocommerce_id'
      });

    if (error) {
      console.error('❌ Error actualizando producto:', error);
    } else {
      console.log('✅ Producto sincronizado correctamente');
    }

  } catch (error) {
    console.error('❌ Error en syncProduct:', error);
  }
}

async function syncOrder(orderData: any) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🛒 Sincronizando pedido ${orderData.id}`);

    // Verificar si el pedido ya existe
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('woocommerce_order_id', orderData.id.toString())
      .maybeSingle();

    if (existingOrder) {
      console.log('📝 Pedido ya existe, actualizando...');
      
      // Mapear estados de WooCommerce a nuestros enums
      const mapOrderStatus = (wcStatus: string) => {
        switch (wcStatus) {
          case 'completed': return 'delivered';
          case 'processing': return 'in_progress';
          case 'pending': return 'pending';
          case 'cancelled': return 'cancelled';
          case 'refunded': return 'cancelled';
          default: return 'pending';
        }
      };

      // Actualizar pedido existente
      const { error } = await supabase
        .from('orders')
        .update({
          status: mapOrderStatus(orderData.status),
          payment_status: orderData.payment_status,
          total_amount: parseFloat(orderData.total || '0'),
          updated_at: new Date().toISOString()
        })
        .eq('woocommerce_order_id', orderData.id.toString());

      if (error) {
        console.error('❌ Error actualizando pedido:', error);
      } else {
        console.log('✅ Pedido actualizado correctamente');
      }
    } else {
      console.log('🆕 Nuevo pedido, creando...');
      
      // Mapear estados de WooCommerce a nuestros enums
      const mapOrderStatus = (wcStatus: string) => {
        switch (wcStatus) {
          case 'completed': return 'delivered';
          case 'processing': return 'in_progress';
          case 'pending': return 'pending';
          case 'cancelled': return 'cancelled';
          case 'refunded': return 'cancelled';
          default: return 'pending';
        }
      };

      // Crear nuevo pedido
      const { error } = await supabase
        .from('orders')
        .insert({
          woocommerce_order_id: orderData.id.toString(),
          customer_name: `${orderData.billing.first_name} ${orderData.billing.last_name}`,
          customer_email: orderData.billing.email,
          customer_phone: orderData.billing.phone,
          status: mapOrderStatus(orderData.status),
          payment_status: orderData.payment_status,
          total_amount: parseFloat(orderData.total || '0'),
          created_at: orderData.date_created,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error creando pedido:', error);
      } else {
        console.log('✅ Pedido creado correctamente');
      }
    }

  } catch (error) {
    console.error('❌ Error en syncOrder:', error);
  }
}
