// Script para obtener un producto existente
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function getExistingProduct() {
  try {
    console.log('🔍 Buscando productos existentes...')
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(1)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (products && products.length > 0) {
      console.log('✅ Producto encontrado:', products[0])
      return products[0]
    } else {
      console.log('❌ No hay productos en la base de datos')
      return null
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return null
  }
}

getExistingProduct()
