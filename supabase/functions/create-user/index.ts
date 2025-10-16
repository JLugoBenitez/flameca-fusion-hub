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
    const { email, password, full_name, phone, role, requesting_user_id } = await req.json();

    console.log("Create user request:", { email, full_name, role, requesting_user_id });

    // Verify admin permissions
    if (requesting_user_id) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", requesting_user_id);

      const isAdmin = roles?.some((r) => r.role === "admin");

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can create users" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "email, password, and full_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
      },
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating user:", authError);
      throw authError;
    }

    console.log("User created successfully:", authData.user?.email);

    // Update profile with phone if provided
    if (authData.user && phone) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ phone })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    }

    // Assign role if provided
    if (authData.user && role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: authData.user.id, role }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        throw roleError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          full_name: authData.user?.user_metadata?.full_name,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
