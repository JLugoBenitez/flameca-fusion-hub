// Script para probar la API de Holded según la documentación oficial
const HOLDED_API_KEY = '2c76b53c95bd62662c55d0db77133c5e'

async function testHoldedDocs() {
  try {
    console.log('🔗 Probando API de Holded según documentación...')
    console.log('🔑 API Key:', HOLDED_API_KEY.substring(0, 8) + '...')
    
    // Probar diferentes URLs base según la documentación
    const baseURLs = [
      'https://api.holded.com/api/accounting/v1',
      'https://api.holded.com/api/accounting/v1/documents',
      'https://api.holded.com/api/accounting/v1/contacts',
      'https://api.holded.com/api/accounting/v1/invoices',
      'https://api.holded.com/api/accounting/v1/documents/invoice'
    ]
    
    for (const baseURL of baseURLs) {
      console.log(`\n🔍 Probando URL: ${baseURL}`)
      
      try {
        const response = await fetch(baseURL, {
          method: 'GET',
          headers: {
            'key': HOLDED_API_KEY,
            'Content-Type': 'application/json'
          }
        })
        
        console.log(`📊 Status: ${response.status}`)
        console.log(`📊 Content-Type: ${response.headers.get('content-type')}`)
        
        if (response.status === 200) {
          const text = await response.text()
          console.log(`✅ Respuesta exitosa (${text.length} caracteres)`)
          
          // Intentar parsear como JSON
          try {
            const json = JSON.parse(text)
            console.log('📋 JSON válido:', Array.isArray(json) ? `${json.length} elementos` : 'Objeto')
            if (Array.isArray(json) && json.length > 0) {
              console.log('📋 Primer elemento:', json[0])
            } else if (typeof json === 'object' && json !== null) {
              console.log('📋 Objeto:', json)
            }
          } catch (e) {
            console.log('❌ No es JSON válido, es HTML o texto')
            console.log('📄 Primeros 200 caracteres:', text.substring(0, 200))
          }
        } else {
          const text = await response.text()
          console.log(`❌ Error ${response.status}: ${text.substring(0, 200)}`)
        }
        
      } catch (error) {
        console.log(`❌ Error de red: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testHoldedDocs()
