import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HoldedInvoiceRequest {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  total: number;
  notes?: string;
}

interface HoldedCustomer {
  name: string;
  email: string;
  phone?: string;
  type: 'customer';
}

interface HoldedInvoice {
  customer: HoldedCustomer;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  total: number;
  notes?: string;
  type: 'invoice';
  status: 'draft' | 'sent' | 'paid';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, customer_name, customer_email, customer_phone, items, total, notes }: HoldedInvoiceRequest = await req.json()

    // Verificar que tenemos la API key de Holded
    const holdedApiKey = Deno.env.get('HOLDED_API_KEY')
    console.log('🔑 API Key detectada:', holdedApiKey ? `${holdedApiKey.substring(0, 8)}...` : 'NO ENCONTRADA')
    
    // Por ahora, siempre usar modo de prueba hasta que la API funcione correctamente
    const isTestMode = true // !holdedApiKey || holdedApiKey === 'test_api_key_12345' || holdedApiKey.startsWith('test_')
    
    if (isTestMode) {
      console.log('🧪 Modo de prueba: Simulando creación de factura en Holded')
      console.log('📝 Nota: Las facturas se crean en la base de datos local para desarrollo')
    } else {
      console.log('🚀 Modo REAL: Creando factura en Holded con API real')
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let customerId = null
    let holdedInvoiceId = null

    if (isTestMode) {
      // Modo de prueba: simular IDs
      customerId = `test_customer_${Date.now()}`
      holdedInvoiceId = `test_invoice_${Date.now()}`
      console.log('🧪 Simulando cliente en Holded:', customerId)
      console.log('🧪 Simulando factura en Holded:', holdedInvoiceId)
    } else {
      // 1. Crear o buscar cliente en Holded
      const customer: HoldedCustomer = {
        name: customer_name,
        email: customer_email,
        phone: customer_phone,
        type: 'customer'
      }

      // Buscar cliente existente en Holded
      const customerSearchResponse = await fetch('https://api.holded.com/api/accounting/v1/contacts', {
        method: 'GET',
        headers: {
          'key': holdedApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (customerSearchResponse.ok) {
        const customers = await customerSearchResponse.json()
        const existingCustomer = customers.find((c: any) => c.email === customer_email)
        if (existingCustomer) {
          customerId = existingCustomer.id
        }
      }

      // Si no existe, crear el cliente
      if (!customerId) {
        const createCustomerResponse = await fetch('https://api.holded.com/api/accounting/v1/contacts', {
          method: 'POST',
          headers: {
            'key': holdedApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customer)
        })

        if (createCustomerResponse.ok) {
          const newCustomer = await createCustomerResponse.json()
          customerId = newCustomer.id
          console.log('✅ Cliente creado en Holded:', newCustomer.id)
        } else {
          console.error('❌ Error creando cliente en Holded:', await createCustomerResponse.text())
        }
      } else {
        console.log('✅ Cliente existente encontrado en Holded:', customerId)
      }
    }

    if (!isTestMode) {
      // 2. Crear factura en Holded
      const invoice: HoldedInvoice = {
        customer: {
          name: customer_name,
          email: customer_email,
          phone: customer_phone,
          type: 'customer',
          id: customerId
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        total: total,
        notes: notes || `Factura generada automáticamente para el pedido ${order_id}`,
        type: 'invoice',
        status: 'draft'
      }

      const createInvoiceResponse = await fetch('https://api.holded.com/api/accounting/v1/documents/invoice', {
        method: 'POST',
        headers: {
          'key': holdedApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoice)
      })

      if (!createInvoiceResponse.ok) {
        const errorText = await createInvoiceResponse.text()
        console.error('❌ Error creando factura en Holded:', errorText)
        throw new Error(`Error creando factura en Holded: ${errorText}`)
      }

      const holdedInvoice = await createInvoiceResponse.json()
      holdedInvoiceId = holdedInvoice.id
      console.log('✅ Factura creada en Holded:', holdedInvoice.id)
    }

    // 3. Guardar la factura en nuestra base de datos
    const invoiceData = {
      order_id: order_id,
      holded_invoice_id: holdedInvoiceId,
      customer_name: customer_name,
      customer_email: customer_email,
      total_amount: total,
      status: 'draft',
      notes: notes
    }

    const { data: invoiceResult, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) {
      console.error('❌ Error guardando factura en base de datos:', invoiceError)
      throw new Error(`Error guardando factura: ${invoiceError.message}`)
    }

    console.log('✅ Factura guardada en base de datos:', invoiceResult.id)

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoiceResult.id,
          holded_id: holdedInvoiceId,
          order_id: order_id,
          customer_name: customer_name,
          customer_email: customer_email,
          total: total,
          status: 'draft'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error en create-holded-invoice:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})