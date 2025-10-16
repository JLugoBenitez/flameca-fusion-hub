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

    // Get request data
    const { user_id, new_password } = await req.json();

    console.log("Change password request for user:", user_id);

    if (!user_id || !new_password) {
      return new Response(JSON.stringify({ error: "user_id and new_password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user password without invalidating current session
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: new_password,
      // Don't invalidate current session
    });

    if (passwordError) {
      console.error("Error changing password:", passwordError);
      throw passwordError;
    }

    // Remove the must_change_password flag
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user_id);

    if (profileError) {
      console.error("Error updating profile flag:", profileError);
      // Don't throw error here, password was changed successfully
    }

    console.log("Password changed successfully for user:", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password changed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in change-password function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
