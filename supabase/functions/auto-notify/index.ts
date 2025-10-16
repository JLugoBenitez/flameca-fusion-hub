import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoNotificationRequest {
  type: 'password_reset' | 'new_order' | 'low_stock' | 'critical_stock' | 'check_in' | 'check_out' | 'incident' | 'payment_issue';
  data: any;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { type, data, user_id }: AutoNotificationRequest = await req.json();

    console.log("Auto notification request:", { type, data, user_id });

    // Obtener configuración de notificaciones del admin
    const { data: adminSettings, error: settingsError } = await supabaseAdmin
      .from("notification_settings")
      .select("*")
      .eq("user_id", (await getAdminUserId(supabaseAdmin)))
      .single();

    if (settingsError) {
      console.error("Error fetching admin settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Admin settings not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let notificationSent = false;

    switch (type) {
      case 'password_reset':
        notificationSent = await handlePasswordReset(supabaseAdmin, data, adminSettings);
        break;
      
      case 'new_order':
        notificationSent = await handleNewOrder(supabaseAdmin, data, adminSettings);
        break;
      
      case 'low_stock':
        notificationSent = await handleLowStock(supabaseAdmin, data, adminSettings);
        break;
      
      case 'critical_stock':
        notificationSent = await handleCriticalStock(supabaseAdmin, data, adminSettings);
        break;
      
      case 'check_in':
      case 'check_out':
        notificationSent = await handleCheckInOut(supabaseAdmin, data, adminSettings, type);
        break;
      
      case 'incident':
        notificationSent = await handleIncident(supabaseAdmin, data, adminSettings);
        break;
      
      case 'payment_issue':
        notificationSent = await handlePaymentIssue(supabaseAdmin, data, adminSettings);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: "Unknown notification type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Auto notification processed",
        sent: notificationSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-notify function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to get admin user ID
async function getAdminUserId(supabaseAdmin: any): Promise<string> {
  const { data: adminRole, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (error || !adminRole) {
    throw new Error("No admin user found");
  }

  return adminRole.user_id;
}

// Helper function to get employees on active shift
async function getActiveEmployees(supabaseAdmin: any): Promise<any[]> {
  try {
    const { data: activeEmployees, error } = await supabaseAdmin
      .from("time_entries")
      .select(`
        user_id,
        profiles!inner(full_name, phone)
      `)
      .is("clock_out", null)
      .not("clock_in", "is", null);

    if (error) {
      console.error("Error fetching active employees:", error);
      return [];
    }

    console.log("Active employees found:", activeEmployees);
    return activeEmployees || [];
  } catch (error) {
    console.error("Exception in getActiveEmployees:", error);
    return [];
  }
}

// Handle password reset notifications
async function handlePasswordReset(supabaseAdmin: any, data: any, adminSettings: any): Promise<boolean> {
  const { employee_phone, temp_password, employee_name } = data;
  
  if (!adminSettings.sms_enabled || !employee_phone) {
    return false;
  }

  const message = `¡Hola ${employee_name}! Tu contraseña temporal es: ${temp_password}. Por favor, cámbiala en tu próximo inicio de sesión. - Flamenca Store`;

  try {
    const { data: result, error } = await supabaseAdmin.functions.invoke("send-sms", {
      body: {
        phone: employee_phone,
        message: message,
        user_id: data.employee_id,
      },
    });

    return !error;
  } catch (error) {
    console.error("Error sending password reset SMS:", error);
    return false;
  }
}

// Handle new order notifications
async function handleNewOrder(supabaseAdmin: any, data: any, adminSettings: any): Promise<boolean> {
  const { order_id, customer_name, total_amount, items } = data;
  
  if (!adminSettings.sms_enabled || !adminSettings.sms_phone) {
    return false;
  }

  const itemsText = items.slice(0, 2).map((item: any) => item.name).join(", ");
  const moreItems = items.length > 2 ? ` y ${items.length - 2} más` : "";
  
  const baseMessage = `🛍️ NUEVO PEDIDO #${order_id}\nCliente: ${customer_name}\nTotal: ${total_amount}€\nProductos: ${itemsText}${moreItems}`;

  let notificationsSent = 0;

  try {
    // 1. Enviar al admin siempre
    const adminMessage = `👑 [ADMIN] ${baseMessage}\n\nFlamenca Store`;
    const { data: adminResult, error: adminError } = await supabaseAdmin.functions.invoke("send-sms", {
      body: {
        phone: adminSettings.sms_phone,
        message: adminMessage,
        user_id: adminSettings.user_id,
      },
    });

    if (!adminError) {
      notificationsSent++;
      console.log("New order notification sent to admin");
    }

    // 2. Enviar a empleados en turno activo (check-in sin check-out)
    const activeEmployees = await getActiveEmployees(supabaseAdmin);

    if (activeEmployees.length > 0) {
      console.log(`Found ${activeEmployees.length} employees on active shift`);
      
      for (const entry of activeEmployees) {
        const employee = entry.profiles;
        if (employee.phone) {
          try {
            const employeeMessage = `👷 [EMPLEADO] ${baseMessage}\n\nFlamenca Store`;
            const { data: employeeResult, error: employeeError } = await supabaseAdmin.functions.invoke("send-sms", {
              body: {
                phone: employee.phone,
                message: employeeMessage,
                user_id: entry.user_id,
              },
            });

            if (!employeeError) {
              notificationsSent++;
              console.log(`New order notification sent to employee: ${employee.full_name}`);
            }
          } catch (error) {
            console.error(`Error sending notification to employee ${employee.full_name}:`, error);
          }
        }
      }
    } else {
      console.log("No employees on active shift found");
    }

    console.log(`Total notifications sent: ${notificationsSent}`);
    return notificationsSent > 0;

  } catch (error) {
    console.error("Error sending new order notifications:", error);
    return false;
  }
}

// Handle low stock notifications (WhatsApp)
async function handleLowStock(supabaseAdmin: any, data: any, adminSettings: any): Promise<boolean> {
  const { products } = data;
  
  if (!adminSettings.whatsapp_enabled || !adminSettings.whatsapp_phone) {
    return false;
  }

  const productsText = products.map((product: any) => 
    `• ${product.name}: ${product.stock} unidades`
  ).join("\n");
  
  const message = `⚠️ STOCK BAJO\n\n${productsText}\n\nRevisa el inventario en Flamenca Store`;

  try {
    const { data: result, error } = await supabaseAdmin.functions.invoke("send-whatsapp", {
      body: {
        phone: adminSettings.whatsapp_phone,
        message: message,
        user_id: adminSettings.user_id,
      },
    });

    return !error;
  } catch (error) {
    console.error("Error sending low stock WhatsApp:", error);
    return false;
  }
}

// Handle critical stock notifications (SMS)
async function handleCriticalStock(supabaseAdmin: any, data: any, adminSettings: any): Promise<boolean> {
  const { products } = data;
  
  if (!adminSettings.sms_enabled || !adminSettings.sms_phone) {
    return false;
  }

  const productsText = products.map((product: any) => 
    `${product.name} (${product.stock})`
  ).join(", ");
  
  const message = `🚨 STOCK CRÍTICO: ${productsText} - Flamenca Store`;

  try {
    const { data: result, error } = await supabaseAdmin.functions.invoke("send-sms", {
      body: {
        phone: adminSettings.sms_phone,
        message: message,
        user_id: adminSettings.user_id,
      },
    });

    return !error;
  } catch (error) {
    console.error("Error sending critical stock SMS:", error);
    return false;
  }
}

// Handle check-in/check-out notifications (WhatsApp)
async function handleCheckInOut(supabaseAdmin: any, data: any, adminSettings: any, type: string): Promise<boolean> {
  const { employee_name, time, location } = data;
  
  const action = type === 'check_in' ? 'ENTRADA' : 'SALIDA';
  const emoji = type === 'check_in' ? '✅' : '🚪';
  
  const message = `${emoji} FICHAJE ${action}\n\nEmpleado: ${employee_name}\nHora: ${time}\nUbicación: ${location}\n\nFlamenca Store`;

  // Intentar WhatsApp primero si está habilitado
  if (adminSettings.whatsapp_enabled && adminSettings.whatsapp_phone) {
    try {
      const { data: result, error } = await supabaseAdmin.functions.invoke("send-whatsapp", {
        body: {
          phone: adminSettings.whatsapp_phone,
          message: message,
          user_id: adminSettings.user_id,
        },
      });

      if (!error) {
        console.log(`Check-in/out WhatsApp sent successfully: ${type}`);
        return true;
      } else {
        console.log(`WhatsApp failed, trying SMS as fallback: ${error.message}`);
      }
    } catch (error) {
      console.error("Error sending check-in/out WhatsApp:", error);
    }
  }

  // Fallback a SMS si WhatsApp falla o no está habilitado
  if (adminSettings.sms_enabled && adminSettings.sms_phone) {
    try {
      const { data: result, error } = await supabaseAdmin.functions.invoke("send-sms", {
        body: {
          phone: adminSettings.sms_phone,
          message: message,
          user_id: adminSettings.user_id,
        },
      });

      if (!error) {
        console.log(`Check-in/out SMS sent successfully as fallback: ${type}`);
        return true;
      } else {
        console.error(`SMS fallback also failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Error sending check-in/out SMS fallback:", error);
    }
  }

  console.error("Both WhatsApp and SMS failed for check-in/out notification");
  return false;
}

// Handle incident notifications (SMS)
async function handleIncident(supabaseAdmin: any, data: any, adminSettings: any): Promise<boolean> {
  const { incident_title, incident_type, reported_by, priority } = data;
  
  if (!adminSettings.sms_enabled || !adminSettings.sms_phone) {
    return false;
  }

  const priorityEmoji = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : 'ℹ️';
  
  const message = `${priorityEmoji} INCIDENCIA ${priority.toUpperCase()}\n\nTipo: ${incident_type}\nTítulo: ${incident_title}\nReportado por: ${reported_by}\n\nFlamenca Store`;

  try {
    const { data: result, error } = await supabaseAdmin.functions.invoke("send-sms", {
      body: {
        phone: adminSettings.sms_phone,
        message: message,
        user_id: adminSettings.user_id,
      },
    });

    return !error;
  } catch (error) {
    console.error("Error sending incident SMS:", error);
    return false;
  }
}

// Handle payment issue notifications (SMS)
async function handlePaymentIssue(supabaseAdmin: any, data: any, adminSettings: any): Promise<boolean> {
  const { order_id, customer_name, issue_type, amount } = data;
  
  if (!adminSettings.sms_enabled || !adminSettings.sms_phone) {
    return false;
  }

  const message = `💳 PROBLEMA DE PAGO\n\nPedido: #${order_id}\nCliente: ${customer_name}\nProblema: ${issue_type}\nImporte: ${amount}€\n\nFlamenca Store`;

  try {
    const { data: result, error } = await supabaseAdmin.functions.invoke("send-sms", {
      body: {
        phone: adminSettings.sms_phone,
        message: message,
        user_id: adminSettings.user_id,
      },
    });

    return !error;
  } catch (error) {
    console.error("Error sending payment issue SMS:", error);
    return false;
  }
}
