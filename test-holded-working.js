// Script para probar la API de Holded con la URL que funciona
const HOLDED_API_KEY = '2c76b53c95bd62662c55d0db77133c5e'

async function testHoldedWorking() {
  try {
    console.log('🔗 Probando API de Holded con URL que funciona...')
    console.log('🔑 API Key:', HOLDED_API_KEY.substring(0, 8) + '...')
    
    // 1. Probar obtener contactos
    console.log('\n📋 Probando obtener contactos...')
    const contactsResponse = await fetch('https://api.holded.com/contacts', {
      method: 'GET',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', contactsResponse.status)
    
    if (contactsResponse.ok) {
      const contacts = await contactsResponse.json()
      console.log('✅ Contactos obtenidos:', contacts)
    } else {
      const errorText = await contactsResponse.text()
      console.log('❌ Error obteniendo contactos:', errorText)
    }
    
    // 2. Probar obtener facturas
    console.log('\n🧾 Probando obtener facturas...')
    const invoicesResponse = await fetch('https://api.holded.com/invoices', {
      method: 'GET',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', invoicesResponse.status)
    
    if (invoicesResponse.ok) {
      const invoices = await invoicesResponse.json()
      console.log('✅ Facturas obtenidas:', invoices)
    } else {
      const errorText = await invoicesResponse.text()
      console.log('❌ Error obteniendo facturas:', errorText)
    }
    
    // 3. Probar crear una factura de prueba
    console.log('\n🆕 Probando crear factura de prueba...')
    const testInvoice = {
      type: 'invoice',
      status: 'draft',
      customer: {
        name: 'Cliente de Prueba',
        email: 'cliente@prueba.com',
        type: 'customer'
      },
      items: [
        {
          name: 'Producto de Prueba',
          quantity: 1,
          price: 10.00
        }
      ],
      total: 10.00,
      notes: 'Factura de prueba desde script directo'
    }
    
    const createResponse = await fetch('https://api.holded.com/invoices', {
      method: 'POST',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testInvoice)
    })
    
    console.log('📊 Status:', createResponse.status)
    
    if (createResponse.ok) {
      const newInvoice = await createResponse.json()
      console.log('🎉 ¡Factura creada exitosamente!')
      console.log('🆔 ID:', newInvoice.id)
      console.log('📊 Estado:', newInvoice.status)
      console.log('💰 Total:', newInvoice.total)
    } else {
      const errorText = await createResponse.text()
      console.log('❌ Error creando factura:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testHoldedWorking()
