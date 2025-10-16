import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SessionManagerProps {
  children: React.ReactNode;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const [sessionValid, setSessionValid] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);
        
        if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setSessionValid(false);
          navigate("/auth");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
          setSessionValid(true);
        } else if (event === "SIGNED_IN") {
          console.log("User signed in");
          setSessionValid(true);
        }
      }
    );

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setSessionValid(false);
          return;
        }

        if (!session) {
          console.log("No active session found");
          setSessionValid(false);
          navigate("/auth");
        } else {
          console.log("Valid session found for user:", session.user.id);
          setSessionValid(true);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setSessionValid(false);
        navigate("/auth");
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // If session is invalid, don't render children
  if (!sessionValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
