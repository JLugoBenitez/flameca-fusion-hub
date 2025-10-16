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
    const { user_id, email, full_name, phone, role, requesting_user_id } = await req.json();

    console.log("Update user request:", { user_id, email, full_name, role, requesting_user_id });

    // Verify admin permissions
    if (requesting_user_id) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", requesting_user_id);

      const isAdmin = roles?.some((r) => r.role === "admin");

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can update users" }), {
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

    // Update user auth data (email and metadata) in one call
    const authUpdateData: any = {};
    if (email) {
      authUpdateData.email = email;
      authUpdateData.email_confirm = true; // Auto-confirm the new email
    }
    if (full_name) {
      authUpdateData.user_metadata = { full_name };
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdateData);

      if (authError) {
        console.error("Error updating user auth data:", authError);
        throw authError;
      }
    }

    // Update profile if provided
    if (full_name || phone || email) {
      const profileUpdate: any = {};
      if (full_name) profileUpdate.full_name = full_name;
      if (phone) profileUpdate.phone = phone;
      if (email) profileUpdate.email = email;

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user_id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }
    }

    // Update role if provided
    if (role) {
      // Delete all existing roles
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      // Insert new role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id, role });

      if (roleError) {
        console.error("Error updating role:", roleError);
        throw roleError;
      }
    }

    console.log("User updated successfully:", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in update-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
