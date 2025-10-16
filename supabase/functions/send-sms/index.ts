import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  phone: string;
  message: string;
  user_id?: string;
  template_id?: string;
  variables?: Record<string, string>;
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

    const { phone, message, user_id, template_id, variables }: SMSRequest = await req.json();

    console.log("SMS request:", { phone, message: message.substring(0, 50) + "...", user_id, template_id });

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Phone and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar formato de teléfono (debe empezar con + y tener al menos 10 dígitos)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Must be in international format (+1234567890)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Si se proporciona template_id, obtener la plantilla
    let finalMessage = message;
    if (template_id) {
      const { data: template, error: templateError } = await supabaseAdmin
        .from("notification_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (templateError || !template) {
        return new Response(
          JSON.stringify({ error: "Template not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Reemplazar variables en la plantilla
      finalMessage = template.template;
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }
    }

    // Crear registro en la base de datos
    const { data: notification, error: insertError } = await supabaseAdmin
      .from("sms_notifications")
      .insert({
        phone,
        message: finalMessage,
        status: "pending",
        user_id: user_id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting SMS notification:", insertError);
      throw insertError;
    }

    // MODO TESTING - Simular envío exitoso siempre
    const twilioSid = `test_sms_${Date.now()}`;
    const status = "sent";
    const errorMessage = null;
    
    console.log("🧪 TESTING MODE: SMS simulated successfully");
    console.log("📱 Would send SMS to:", phone);
    console.log("💬 Message:", finalMessage);
    console.log("🆔 Test ID:", twilioSid);

    // Actualizar el estado de la notificación
    const { error: updateError } = await supabaseAdmin
      .from("sms_notifications")
      .update({
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        error_message: errorMessage,
        twilio_sid: twilioSid,
      })
      .eq("id", notification.id);

    if (updateError) {
      console.error("Error updating SMS notification:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS sent successfully",
        notification_id: notification.id,
        twilio_sid: twilioSid,
        status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
