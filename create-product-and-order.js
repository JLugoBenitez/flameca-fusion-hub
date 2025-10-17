// Script para crear un producto, pedido y factura
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createProductAndOrder() {
  try {
    console.log('🛍️ Creando producto de prueba...')
    
    const productId = uuidv4()
    const orderId = uuidv4()
    const orderItemId = uuidv4()
    
    // 1. Crear producto
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        id: productId,
        name: 'Vestido Flamenco Rojo',
        description: 'Hermoso vestido flamenco de color rojo',
        price: 89.99,
        stock: 10,
        sku: `VEST-ROJO-${Date.now()}`,
        category: 'Vestidos',
        created_at: new Date().toISOString()
      })
      .select()
    
    if (productError) {
      console.error('❌ Error creando producto:', productError)
      return
    }
    
    console.log('✅ Producto creado:', productData[0].id)
    
    // 2. Crear pedido
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        customer_name: 'María García',
        customer_email: 'maria.garcia@email.com',
        customer_phone: '+34612345678',
        total_amount: 89.99,
        status: 'delivered',
        payment_status: 'pending',
        notes: 'Pedido de prueba para facturación con Holded',
        woocommerce_id: 12345,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (orderError) {
      console.error('❌ Error creando pedido:', orderError)
      return
    }
    
    console.log('✅ Pedido creado:', orderData[0].id)
    
    // 3. Crear items del pedido
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert({
        id: orderItemId,
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        unit_price: 89.99,
        subtotal: 89.99
      })
      .select()
    
    if (itemsError) {
      console.error('❌ Error creando items:', itemsError)
      return
    }
    
    console.log('✅ Items creados:', itemsData[0].id)
    
    // 4. Actualizar el pedido con los items
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        items: [{
          id: orderItemId,
          product_id: productId,
          quantity: 1,
          unit_price: 89.99,
          subtotal: 89.99
        }]
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('❌ Error actualizando pedido:', updateError)
      return
    }
    
    console.log('✅ Pedido actualizado con items')
    
    // 5. Ahora crear la factura con Holded
    console.log('\n🧾 Creando factura con Holded...')
    
    const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('create-holded-invoice', {
      body: {
        order_id: orderId,
        customer_name: 'María García',
        customer_email: 'maria.garcia@email.com',
        customer_phone: '+34612345678',
        items: [
          {
            name: 'Vestido Flamenco Rojo',
            quantity: 1,
            price: 89.99,
            sku: `VEST-ROJO-${Date.now()}`
          }
        ],
        total: 89.99,
        notes: 'Factura de prueba con API real de Holded'
      }
    })
    
    if (invoiceError) {
      console.error('❌ Error creando factura:', invoiceError)
      return
    }
    
    if (invoiceData.success) {
      console.log('🎉 ¡FACTURA CREADA EXITOSAMENTE EN HOLDED!')
      console.log('🧾 ID de la factura:', invoiceData.invoice.id)
      console.log('🆔 ID de Holded:', invoiceData.invoice.holded_id)
      console.log('💰 Total:', invoiceData.invoice.total)
      console.log('📊 Estado:', invoiceData.invoice.status)
      console.log('👤 Cliente:', invoiceData.invoice.customer_name || 'María García')
      console.log('📧 Email:', invoiceData.invoice.customer_email || 'maria.garcia@email.com')
      
      console.log('\n✅ ¡El flujo completo funciona!')
      console.log('📋 Puedes ver la factura en tu panel de Holded')
      console.log('🔄 La factura también se guardó en la base de datos local')
    } else {
      console.error('❌ Error en la respuesta de Holded:', invoiceData.error)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createProductAndOrder()
