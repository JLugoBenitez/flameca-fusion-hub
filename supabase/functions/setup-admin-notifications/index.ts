import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get admin user ID
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (roleError || !adminRole) {
      return new Response(
        JSON.stringify({ error: "No admin user found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create notification settings for admin
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("notification_settings")
      .upsert({
        user_id: adminRole.user_id,
        sms_enabled: true,
        whatsapp_enabled: true,
        email_enabled: true,
        push_enabled: false,
        sms_phone: "+34698948449",
        whatsapp_phone: "+34698948449",
        email_address: "admin@flamenca.com",
      })
      .select()
      .single();

    if (settingsError) {
      console.error("Error creating notification settings:", settingsError);
      throw settingsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin notification settings created",
        settings: settings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in setup-admin-notifications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
