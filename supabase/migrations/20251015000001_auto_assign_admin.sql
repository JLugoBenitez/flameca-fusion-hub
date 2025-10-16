-- Function to automatically assign admin role to the first user
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (no other users exist)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id != NEW.id) THEN
    -- Assign admin role to the first user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin role
CREATE TRIGGER auto_assign_admin_on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();

-- Also assign admin role to existing first user if no roles exist
DO $$
BEGIN
  -- If no user_roles exist, assign admin to the first user
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin' FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  END IF;
END $$;
