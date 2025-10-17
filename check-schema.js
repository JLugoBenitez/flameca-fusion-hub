// Script para verificar la estructura de las tablas
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  try {
    console.log('🔍 Verificando estructura de tablas...')
    
    // Verificar estructura de orders
    console.log('\n📋 Tabla ORDERS:')
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
    
    if (ordersError) {
      console.error('❌ Error en orders:', ordersError)
    } else {
      console.log('✅ Estructura de orders:', Object.keys(ordersData[0] || {}))
    }
    
    // Verificar estructura de order_items
    console.log('\n📦 Tabla ORDER_ITEMS:')
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1)
    
    if (itemsError) {
      console.error('❌ Error en order_items:', itemsError)
    } else {
      console.log('✅ Estructura de order_items:', Object.keys(itemsData[0] || {}))
    }
    
    // Verificar estructura de invoices
    console.log('\n🧾 Tabla INVOICES:')
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1)
    
    if (invoicesError) {
      console.error('❌ Error en invoices:', invoicesError)
    } else {
      console.log('✅ Estructura de invoices:', Object.keys(invoicesData[0] || {}))
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkSchema()
