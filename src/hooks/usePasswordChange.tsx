import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export function usePasswordChange() {
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUserRole();

  useEffect(() => {
    checkPasswordChange();
  }, [user?.id]);


  const markPasswordChanged = () => {
    setMustChangePassword(false);
    // After password change, the session might be invalid
    // We'll let the auth state change listener handle the re-check
    console.log("Password changed - modal should close");
  };

  const checkPasswordChange = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking password change flag:", error);
        setMustChangePassword(false);
      } else if (!data) {
        // Si no hay perfil, asumir que no necesita cambiar contraseña
        console.log("No profile found for user:", user.id, "- assuming no password change needed");
        setMustChangePassword(false);
      } else {
        setMustChangePassword(data.must_change_password || false);
      }
    } catch (error) {
      console.error("Error in checkPasswordChange:", error);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    mustChangePassword,
    loading,
    markPasswordChanged,
  };
}
