-- Add password change flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.must_change_password IS 'Flag to indicate if user must change their password on next login';
