import { usePasswordChange } from "@/hooks/usePasswordChange";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { useUserRole } from "@/hooks/useUserRole";

interface PasswordChangeWrapperProps {
  children: React.ReactNode;
}

export function PasswordChangeWrapper({ children }: PasswordChangeWrapperProps) {
  const { mustChangePassword, loading, markPasswordChanged } = usePasswordChange();
  const { user } = useUserRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <>
      {children}
      {mustChangePassword && user?.id && (
        <PasswordChangeModal
          isOpen={mustChangePassword}
          userId={user.id}
          onSuccess={markPasswordChanged}
        />
      )}
    </>
  );
}
