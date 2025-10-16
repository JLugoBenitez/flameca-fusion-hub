-- Crear tabla para notificaciones SMS
CREATE TABLE IF NOT EXISTS public.sms_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    twilio_sid VARCHAR(100),
    delivery_status VARCHAR(50)
);

-- Crear tabla para notificaciones WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    twilio_sid VARCHAR(100),
    delivery_status VARCHAR(50)
);

-- Crear tabla para notificaciones Email
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id VARCHAR(100)
);

-- Crear tabla para plantillas de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    channels TEXT[] NOT NULL DEFAULT '{}',
    template TEXT NOT NULL,
    variables TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para configuraciones de notificaciones de usuarios
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sms_enabled BOOLEAN DEFAULT false,
    whatsapp_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_phone VARCHAR(20),
    whatsapp_phone VARCHAR(20),
    email_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sms_notifications_user_id ON public.sms_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON public.sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_created_at ON public.sms_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_user_id ON public.whatsapp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON public.whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON public.whatsapp_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at);

-- Habilitar RLS
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sms_notifications
CREATE POLICY "Users can view their own SMS notifications" ON public.sms_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SMS notifications" ON public.sms_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert SMS notifications" ON public.sms_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update SMS notifications" ON public.sms_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para whatsapp_notifications
CREATE POLICY "Users can view their own WhatsApp notifications" ON public.whatsapp_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all WhatsApp notifications" ON public.whatsapp_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert WhatsApp notifications" ON public.whatsapp_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update WhatsApp notifications" ON public.whatsapp_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para email_notifications
CREATE POLICY "Users can view their own email notifications" ON public.email_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email notifications" ON public.email_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert email notifications" ON public.email_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update email notifications" ON public.email_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para notification_templates
CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para notification_settings
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification settings" ON public.notification_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insertar plantillas de notificaciones por defecto
INSERT INTO public.notification_templates (name, channels, template, variables) VALUES
('order_confirmation', ARRAY['sms', 'whatsapp', 'email'], 'Hola {{customer_name}}, tu pedido #{{order_id}} ha sido confirmado por un total de {{total_amount}}€. Fecha de entrega: {{delivery_date}}', ARRAY['customer_name', 'order_id', 'total_amount', 'delivery_date']),
('order_ready', ARRAY['sms', 'whatsapp'], '¡Hola {{customer_name}}! Tu pedido #{{order_id}} está listo para recoger. Puedes pasar por la tienda.', ARRAY['customer_name', 'order_id']),
('order_delivered', ARRAY['sms', 'whatsapp'], 'Tu pedido #{{order_id}} ha sido entregado. ¡Esperamos que disfrutes tu compra!', ARRAY['order_id']),
('low_stock_alert', ARRAY['email'], 'Alerta: El producto {{product_name}} tiene stock bajo ({{current_stock}} unidades restantes)', ARRAY['product_name', 'current_stock']),
('incident_created', ARRAY['email'], 'Nueva incidencia creada: {{incident_title}} - {{incident_description}}', ARRAY['incident_title', 'incident_description']),
('incident_resolved', ARRAY['email'], 'Incidencia resuelta: {{incident_title}}', ARRAY['incident_title']),
('time_entry_reminder', ARRAY['sms', 'whatsapp'], 'Recordatorio: No olvides fichar tu salida al finalizar tu turno.', ARRAY[]::text[]),
('password_reset', ARRAY['email'], 'Tu contraseña ha sido reseteada. Nueva contraseña temporal: {{temp_password}}', ARRAY['temp_password'])
ON CONFLICT (name) DO NOTHING;
