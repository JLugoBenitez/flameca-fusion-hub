// Script simple para probar la API de Holded
const HOLDED_API_KEY = 'e18055b14815e1606634a47e555090be'

async function testHoldedSimple() {
  try {
    console.log('🔗 Probando API de Holded...')
    console.log('🔑 API Key:', HOLDED_API_KEY.substring(0, 8) + '...')
    
    // Probar diferentes URLs posibles
    const urls = [
      'https://api.holded.com/api/accounting/v1/contacts',
      'https://api.holded.com/api/contacts',
      'https://api.holded.com/contacts',
      'https://holded.com/api/accounting/v1/contacts'
    ]
    
    for (const url of urls) {
      console.log(`\n🔍 Probando URL: ${url}`)
      
      try {
        const response = await fetch(url, {
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

testHoldedSimple()
