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
    const { user_id, requesting_user_id } = await req.json();

    console.log("Reset password request:", { user_id, requesting_user_id });

    // Verify admin permissions
    if (requesting_user_id) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", requesting_user_id);

      const isAdmin = roles?.some((r) => r.role === "admin");

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can reset passwords" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

    // Update user password
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: tempPassword,
    });

    if (passwordError) {
      console.error("Error resetting password:", passwordError);
      throw passwordError;
    }

    // Mark user as needing to change password
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", user_id);

    if (profileError) {
      console.error("Error updating profile flag:", profileError);
      // Don't throw error here, password was reset successfully
    }

    // Get employee data for notification
    const { data: employeeProfile, error: profileFetchError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user_id)
      .single();

    // Send SMS notification with temporary password
    let smsSent = false;
    if (employeeProfile && employeeProfile.phone) {
      try {
        await supabaseAdmin.functions.invoke("auto-notify", {
          body: {
            type: "password_reset",
            data: {
              employee_id: user_id,
              employee_name: employeeProfile.full_name || "Empleado",
              employee_phone: employeeProfile.phone,
              temp_password: tempPassword,
            },
          },
        });
        console.log("Password reset SMS notification sent");
        smsSent = true;
      } catch (notificationError) {
        console.error("Error sending password reset notification:", notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    console.log("Password reset successfully for user:", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset successfully",
        tempPassword: tempPassword, // Return the temporary password to admin
        smsSent: smsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
