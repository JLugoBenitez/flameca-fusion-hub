-- Add tracking fields to orders for external integrations
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS woocommerce_order_id text,
  ADD COLUMN IF NOT EXISTS holded_invoice_id text,
  ADD COLUMN IF NOT EXISTS holded_document_id text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Create invoices table for Holded integration
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  holded_invoice_id text UNIQUE,
  holded_document_id text,
  invoice_number text,
  invoice_date date DEFAULT CURRENT_DATE,
  total_amount numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  status text DEFAULT 'draft',
  payment_status text DEFAULT 'unpaid',
  payment_method text,
  customer_name text NOT NULL,
  customer_email text,
  customer_tax_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices (only authenticated users, managers and admins can manage)
CREATE POLICY "Authenticated users can view invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage invoices"
  ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- Create delivery notes table
CREATE TABLE IF NOT EXISTS public.delivery_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  holded_document_id text,
  note_number text,
  delivery_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view delivery notes"
  ON public.delivery_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage delivery notes"
  ON public.delivery_notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- Create notifications log table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'sms', 'whatsapp', 'email'
  recipient text NOT NULL, -- phone or email
  message text NOT NULL,
  status text DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add WooCommerce sync tracking to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS woocommerce_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Add trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on delivery_notes
CREATE TRIGGER update_delivery_notes_updated_at
  BEFORE UPDATE ON public.delivery_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();