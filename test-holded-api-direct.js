// Script para probar directamente la API de Holded
const HOLDED_API_KEY = 'e18055b14815e1606634a47e555090be'

async function testHoldedAPI() {
  try {
    console.log('🔗 Probando API de Holded directamente...')
    console.log('🔑 API Key:', HOLDED_API_KEY.substring(0, 8) + '...')
    
    // 1. Probar obtener contactos
    console.log('\n📋 Probando obtener contactos...')
    const contactsResponse = await fetch('https://api.holded.com/api/accounting/v1/contacts', {
      method: 'GET',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', contactsResponse.status)
    console.log('📊 Headers:', Object.fromEntries(contactsResponse.headers.entries()))
    
    if (contactsResponse.ok) {
      const contacts = await contactsResponse.json()
      console.log('✅ Contactos obtenidos:', contacts.length, 'contactos')
      console.log('📋 Primeros contactos:', contacts.slice(0, 3))
    } else {
      const errorText = await contactsResponse.text()
      console.log('❌ Error obteniendo contactos:', errorText)
    }
    
    // 2. Probar obtener facturas
    console.log('\n🧾 Probando obtener facturas...')
    const invoicesResponse = await fetch('https://api.holded.com/api/accounting/v1/documents/invoice', {
      method: 'GET',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', invoicesResponse.status)
    
    if (invoicesResponse.ok) {
      const invoices = await invoicesResponse.json()
      console.log('✅ Facturas obtenidas:', invoices.length, 'facturas')
      console.log('🧾 Primeras facturas:', invoices.slice(0, 3))
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
    
    const createResponse = await fetch('https://api.holded.com/api/accounting/v1/documents/invoice', {
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

testHoldedAPI()
