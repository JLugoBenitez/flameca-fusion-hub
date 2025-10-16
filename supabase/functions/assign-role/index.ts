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
    const { user_id, role, action = "upsert", requesting_user_id } = await req.json();

    console.log("Assign role request:", { user_id, role, action, requesting_user_id });

    // Verify admin permissions using service role
    if (requesting_user_id) {
      try {
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", requesting_user_id);

        console.log("Role check for user:", requesting_user_id, "roles:", roles);

        const isAdmin = roles?.some((r) => r.role === "admin");

        if (!isAdmin) {
          console.log("User is not admin:", requesting_user_id);
          return new Response(JSON.stringify({ error: "Only admins can assign roles" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("Error checking admin permissions:", error);
        // Continue anyway for now, but log the error
      }
    }

    if (!user_id || !role) {
      return new Response(JSON.stringify({ error: "user_id and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return new Response(JSON.stringify({ error: "Invalid user_id format. Must be a valid UUID." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (requesting_user_id && !uuidRegex.test(requesting_user_id)) {
      return new Response(JSON.stringify({ error: "Invalid requesting_user_id format. Must be a valid UUID." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // Delete role
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Role deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "update") {
      // Delete all roles and insert new one
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id, role });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Role updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Upsert role (default)
      console.log("Upserting role:", { user_id, role });
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id, role }, { onConflict: "user_id,role" });

      if (error) {
        console.error("Error upserting role:", error);
        throw error;
      }

      console.log("Role upserted successfully");
      return new Response(JSON.stringify({ success: true, message: "Role assigned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


