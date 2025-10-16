import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  NotificationChannel, 
  NotificationRequest, 
  SMSNotification, 
  WhatsAppNotification, 
  EmailNotification,
  NotificationTemplate,
  NotificationSettings 
} from "@/types";

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);

  // Enviar notificación unificada
  const sendNotification = useCallback(async (request: NotificationRequest) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: request,
      });

      if (error) {
        console.error("Error sending notification:", error);
        throw error;
      }

      toast.success(`${request.channel.toUpperCase()} enviado correctamente`);
      return data;
    } catch (error: any) {
      console.error("Error in sendNotification:", error);
      toast.error(`Error al enviar ${request.channel}: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar SMS
  const sendSMS = useCallback(async (phone: string, message: string, templateId?: string, variables?: Record<string, string>) => {
    return sendNotification({
      channel: 'sms',
      recipient: phone,
      message,
      template_id: templateId,
      variables,
    });
  }, [sendNotification]);

  // Enviar WhatsApp
  const sendWhatsApp = useCallback(async (phone: string, message: string, templateId?: string, variables?: Record<string, string>) => {
    return sendNotification({
      channel: 'whatsapp',
      recipient: phone,
      message,
      template_id: templateId,
      variables,
    });
  }, [sendNotification]);

  // Enviar Email
  const sendEmail = useCallback(async (email: string, subject: string, body: string, templateId?: string, variables?: Record<string, string>) => {
    return sendNotification({
      channel: 'email',
      recipient: email,
      message: body,
      subject,
      template_id: templateId,
      variables,
    });
  }, [sendNotification]);

  // Obtener plantillas de notificaciones
  const getTemplates = useCallback(async (): Promise<NotificationTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching templates:", error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getTemplates:", error);
      throw error;
    }
  }, []);

  // Obtener configuración de notificaciones del usuario
  const getNotificationSettings = useCallback(async (userId: string): Promise<NotificationSettings | null> => {
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error fetching notification settings:", error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error in getNotificationSettings:", error);
      throw error;
    }
  }, []);

  // Actualizar configuración de notificaciones
  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .upsert(settings, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error("Error updating notification settings:", error);
        throw error;
      }

      toast.success("Configuración de notificaciones actualizada");
      return data;
    } catch (error: any) {
      console.error("Error in updateNotificationSettings:", error);
      toast.error("Error al actualizar configuración");
      throw error;
    }
  }, []);

  // Obtener historial de notificaciones SMS
  const getSMSHistory = useCallback(async (userId?: string): Promise<SMSNotification[]> => {
    try {
      let query = supabase
        .from("sms_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching SMS history:", error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getSMSHistory:", error);
      throw error;
    }
  }, []);

  // Obtener historial de notificaciones WhatsApp
  const getWhatsAppHistory = useCallback(async (userId?: string): Promise<WhatsAppNotification[]> => {
    try {
      let query = supabase
        .from("whatsapp_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching WhatsApp history:", error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getWhatsAppHistory:", error);
      throw error;
    }
  }, []);

  // Obtener historial de notificaciones Email
  const getEmailHistory = useCallback(async (userId?: string): Promise<EmailNotification[]> => {
    try {
      let query = supabase
        .from("email_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching email history:", error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getEmailHistory:", error);
      throw error;
    }
  }, []);

  // Notificaciones automáticas para eventos del sistema
  const sendOrderConfirmation = useCallback(async (order: any, customerPhone?: string, customerEmail?: string) => {
    const variables = {
      customer_name: order.customer_name,
      order_id: order.id.toString(),
      total_amount: order.total_amount.toString(),
      delivery_date: order.delivery_date,
    };

    const promises = [];

    if (customerPhone) {
      promises.push(
        sendSMS(customerPhone, "", "order_confirmation", variables),
        sendWhatsApp(customerPhone, "", "order_confirmation", variables)
      );
    }

    if (customerEmail) {
      promises.push(
        sendEmail(customerEmail, "Confirmación de Pedido", "", "order_confirmation", variables)
      );
    }

    return Promise.allSettled(promises);
  }, [sendSMS, sendWhatsApp, sendEmail]);

  const sendLowStockAlert = useCallback(async (product: any, adminEmails: string[]) => {
    const variables = {
      product_name: product.name,
      current_stock: product.stock.toString(),
    };

    const promises = adminEmails.map(email =>
      sendEmail(email, "Alerta de Stock Bajo", "", "low_stock_alert", variables)
    );

    return Promise.allSettled(promises);
  }, [sendEmail]);

  return {
    loading,
    sendNotification,
    sendSMS,
    sendWhatsApp,
    sendEmail,
    getTemplates,
    getNotificationSettings,
    updateNotificationSettings,
    getSMSHistory,
    getWhatsAppHistory,
    getEmailHistory,
    sendOrderConfirmation,
    sendLowStockAlert,
  };
};