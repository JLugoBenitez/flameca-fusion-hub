# 🔔 Configuración de Notificaciones - Flamenca Store

## 📋 **ESTADO ACTUAL**

### ✅ **CONFIGURADO Y FUNCIONANDO:**
- **SMS**: ✅ Funcionando con Twilio
- **WhatsApp**: ✅ Funcionando con Twilio (modo desarrollo)
- **Email**: ⚠️ Requiere configuración de Resend

## 🔧 **CONFIGURACIÓN REQUERIDA**

### **1. 📱 TWILIO (SMS + WhatsApp)**
```bash
# Variables de entorno necesarias en supabase/functions/.env
TWILIO_ACCOUNT_SID=tu_token_aqui
TWILIO_AUTH_TOKEN=tu_token_aqui
TWILIO_PHONE_NUMBER=+18146214272
TWILIO_WHATSAPP_NUMBER=+14155238886
```

**Estado**: ✅ SMS funcionando, WhatsApp en modo desarrollo

### **2. 📧 RESEND (Email)**
```bash
# Variables de entorno necesarias en supabase/functions/.env
RESEND_API_KEY=tu_api_key_de_resend
FROM_EMAIL=noreply@flamenca-store.com
```

**Estado**: ⚠️ Requiere configuración

## 🚀 **PASOS PARA COMPLETAR LA CONFIGURACIÓN**

### **Paso 1: Configurar Resend**
1. Ir a [resend.com](https://resend.com)
2. Crear cuenta gratuita
3. Obtener API key
4. Verificar dominio (opcional, se puede usar el dominio de Resend)

### **Paso 2: Actualizar Variables de Entorno**
```bash
# Editar supabase/functions/.env
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@flamenca-store.com
```

### **Paso 3: Reiniciar Edge Functions**
```bash
npx supabase functions serve --env-file supabase/functions/.env
```

## 🧪 **PRUEBAS REALIZADAS**

### ✅ **SMS (Funcionando)**
- ✅ Contraseña temporal → Empleado
- ✅ Nuevo pedido → Admin
- ✅ Stock crítico → Admin

### ✅ **WhatsApp (Funcionando en desarrollo)**
- ✅ Check-in/Check-out → Admin
- ✅ Stock bajo → Admin

### ⚠️ **Email (Pendiente)**
- ⚠️ Reportes diarios → Admin
- ⚠️ Facturas generadas → Admin

## 📊 **TIPOS DE NOTIFICACIONES IMPLEMENTADAS**

### **📱 SMS (Urgente/Inmediato)**
- Contraseñas temporales → Empleado
- Pedidos nuevos → Admin
- Stock crítico (0 unidades) → Admin
- Incidencias críticas → Admin
- Problemas de pago → Admin

### **💬 WhatsApp (Importante/Diario)**
- Check-in/Check-out → Admin
- Stock bajo (1-5 unidades) → Admin
- Recordatorios de fichaje → Empleados
- Pedidos listos para recoger → Cliente

### **📧 Email (Información/Reportes)**
- Reportes diarios/semanales → Admin
- Facturas generadas → Admin
- Resúmenes de incidencias → Admin

## 🎯 **PRÓXIMOS PASOS**

1. **Configurar Resend** para completar el sistema de email
2. **Integrar notificaciones** en el flujo real de la aplicación
3. **Configurar WhatsApp Business API** para producción
4. **Implementar notificaciones agrupadas** para evitar spam
5. **Agregar plantillas personalizadas** para cada tipo de notificación

## 🔗 **ENLACES ÚTILES**
- [Twilio Console](https://console.twilio.com/)
- [Resend Dashboard](https://resend.com/dashboard)
- [Twilio WhatsApp Business API](https://www.twilio.com/docs/whatsapp)
- [Resend Documentation](https://resend.com/docs)
