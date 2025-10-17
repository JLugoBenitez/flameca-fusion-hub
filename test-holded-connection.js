// Script para probar la conexión con Holded
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testHoldedConnection() {
  try {
    console.log('🔗 Probando conexión con Holded...')
    
    // Probar la función de creación de factura
    const { data, error } = await supabase.functions.invoke('create-holded-invoice', {
      body: {
        order_id: 'test-order-123',
        customer_name: 'Cliente de Prueba',
        customer_email: 'cliente@prueba.com',
        customer_phone: '+34612345678',
        items: [
          {
            name: 'Vestido Flamenco Rojo',
            quantity: 1,
            price: 89.99,
            sku: 'VEST-ROJO-001'
          }
        ],
        total: 89.99,
        notes: 'Factura de prueba con API real de Holded'
      }
    })
    
    if (error) {
      console.error('❌ Error en la conexión:', error)
      return
    }
    
    if (data.success) {
      console.log('✅ ¡Conexión exitosa con Holded!')
      console.log('🧾 Factura creada:', data.invoice.id)
      console.log('🆔 ID de Holded:', data.invoice.holded_id)
      console.log('💰 Total:', data.invoice.total)
      console.log('📊 Estado:', data.invoice.status)
      
      console.log('\n🎉 ¡La integración con Holded funciona perfectamente!')
      console.log('📋 Puedes ver la factura en tu panel de Holded')
    } else {
      console.error('❌ Error en la respuesta:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testHoldedConnection()
