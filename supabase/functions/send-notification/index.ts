import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  channel: 'sms' | 'whatsapp' | 'email';
  recipient: string; // phone number or email
  message: string;
  subject?: string; // for email
  template_id?: string;
  variables?: Record<string, string>;
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

    const { channel, recipient, message, subject, template_id, variables, user_id }: NotificationRequest = await req.json();

    console.log("Notification request:", { channel, recipient, message: message.substring(0, 50) + "...", template_id, user_id });

    if (!channel || !recipient || !message) {
      return new Response(
        JSON.stringify({ error: "Channel, recipient and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar canal
    if (!['sms', 'whatsapp', 'email'].includes(channel)) {
      return new Response(
        JSON.stringify({ error: "Invalid channel. Must be 'sms', 'whatsapp', or 'email'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar formato según el canal
    if (channel === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (channel === 'sms' || channel === 'whatsapp') {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(recipient)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number format. Must be in international format (+1234567890)" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Si se proporciona template_id, obtener la plantilla
    let finalMessage = message;
    let finalSubject = subject;
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

      // Verificar que el canal esté soportado por la plantilla
      if (!template.channels.includes(channel)) {
        return new Response(
          JSON.stringify({ error: `Channel '${channel}' not supported by this template` }),
          {
            status: 400,
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

    // Determinar la función Edge a llamar
    let functionName = '';
    let requestBody: any = {
      message: finalMessage,
      user_id,
      template_id,
      variables,
    };

    if (channel === 'sms') {
      functionName = 'send-sms';
      requestBody.phone = recipient;
    } else if (channel === 'whatsapp') {
      functionName = 'send-whatsapp';
      requestBody.phone = recipient;
    } else if (channel === 'email') {
      functionName = 'send-email';
      requestBody.email = recipient;
      requestBody.subject = finalSubject || 'Notificación de Flamenca Store';
      requestBody.body = finalMessage;
    }

    // Llamar a la función Edge correspondiente
    const { data, error } = await supabaseAdmin.functions.invoke(functionName, {
      body: requestBody,
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${channel.toUpperCase()} notification sent successfully`,
        data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});