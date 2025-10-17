// Script para probar la API de Holded con la URL correcta
const HOLDED_API_KEY = '2c76b53c95bd62662c55d0db77133c5e'

async function testHoldedCorrectURL() {
  try {
    console.log('🔗 Probando API de Holded con URL correcta...')
    console.log('🔑 API Key:', HOLDED_API_KEY.substring(0, 8) + '...')
    
    // Probar con la URL correcta de la API de Holded
    const baseURL = 'https://api.holded.com/api/accounting/v1'
    
    // 1. Probar obtener contactos
    console.log('\n📋 Probando obtener contactos...')
    const contactsResponse = await fetch(`${baseURL}/contacts`, {
      method: 'GET',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', contactsResponse.status)
    console.log('📊 Content-Type:', contactsResponse.headers.get('content-type'))
    
    if (contactsResponse.ok) {
      const text = await contactsResponse.text()
      console.log('📄 Respuesta:', text.substring(0, 500))
      
      try {
        const contacts = JSON.parse(text)
        console.log('✅ Contactos obtenidos:', contacts)
      } catch (e) {
        console.log('❌ No es JSON válido')
      }
    } else {
      const errorText = await contactsResponse.text()
      console.log('❌ Error obteniendo contactos:', errorText)
    }
    
    // 2. Probar obtener facturas
    console.log('\n🧾 Probando obtener facturas...')
    const invoicesResponse = await fetch(`${baseURL}/documents/invoice`, {
      method: 'GET',
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', invoicesResponse.status)
    
    if (invoicesResponse.ok) {
      const text = await invoicesResponse.text()
      console.log('📄 Respuesta:', text.substring(0, 500))
      
      try {
        const invoices = JSON.parse(text)
        console.log('✅ Facturas obtenidas:', invoices)
      } catch (e) {
        console.log('❌ No es JSON válido')
      }
    } else {
      const errorText = await invoicesResponse.text()
      console.log('❌ Error obteniendo facturas:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testHoldedCorrectURL()
