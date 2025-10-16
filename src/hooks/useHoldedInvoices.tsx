import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  order_id: string;
  holded_invoice_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface CreateInvoiceRequest {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  total: number;
  notes?: string;
}

export function useHoldedInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener facturas
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear factura
  const createInvoice = useCallback(async (invoiceData: CreateInvoiceRequest) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-holded-invoice', {
        body: invoiceData
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Factura creada correctamente en Holded');
        await fetchInvoices(); // Recargar facturas
        return data.invoice;
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(`Error al crear factura: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Sincronizar pedidos de WooCommerce con Holded
  const syncWooCommerceOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-woocommerce-holded', {
        body: {}
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(`Sincronización completada: ${data.message}`);
        await fetchInvoices(); // Recargar facturas
        return data;
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error syncing orders:', error);
      toast.error(`Error en sincronización: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Actualizar estado de factura
  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: Invoice['status']) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;
      
      toast.success('Estado de factura actualizado');
      await fetchInvoices(); // Recargar facturas
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Error al actualizar el estado de la factura');
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Obtener factura por ID
  const getInvoiceById = useCallback((id: string) => {
    return invoices.find(invoice => invoice.id === id);
  }, [invoices]);

  // Obtener facturas por estado
  const getInvoicesByStatus = useCallback((status: Invoice['status']) => {
    return invoices.filter(invoice => invoice.status === status);
  }, [invoices]);

  // Obtener facturas por cliente
  const getInvoicesByCustomer = useCallback((email: string) => {
    return invoices.filter(invoice => invoice.customer_email === email);
  }, [invoices]);

  return {
    invoices,
    loading,
    fetchInvoices,
    createInvoice,
    syncWooCommerceOrders,
    updateInvoiceStatus,
    getInvoiceById,
    getInvoicesByStatus,
    getInvoicesByCustomer
  };
}
