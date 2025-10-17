# 🔔 Configuración del Sistema de Notificaciones

## 📋 Variables de Entorno Requeridas

### Para Desarrollo Local (Supabase Local)

Crea un archivo `.env` en la carpeta `supabase/functions/` con las siguientes variables:

```bash
# Twilio Configuration (SMS y WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Resend Configuration (Email)
RESEND_API_KEY=tu_api_key_resend_aqui
FROM_EMAIL=noreply@flamenca.com

# Supabase Configuration (ya configurado para desarrollo local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### Para Producción (Supabase Cloud)

En el dashboard de Supabase, ve a:
1. **Settings** → **Edge Functions**
2. **Environment Variables**
3. Agrega las siguientes variables:

```
TWILIO_ACCOUNT_SID=tu_account_sid_real
TWILIO_AUTH_TOKEN=tu_auth_token_real
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
RESEND_API_KEY=tu_api_key_resend_real
FROM_EMAIL=noreply@tudominio.com
```

## 🚀 Cómo Obtener las Credenciales

### 1. Twilio (SMS y WhatsApp)

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Crea una cuenta o inicia sesión
3. En el Dashboard, encontrarás:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Para WhatsApp, necesitas:
   - Un número de teléfono verificado
   - Configurar WhatsApp Business API

### 2. Resend (Email)

1. Ve a [Resend](https://resend.com/)
2. Crea una cuenta
3. En el Dashboard, ve a **API Keys**
4. Crea una nueva API key
5. Configura tu dominio para enviar emails

## 🛠️ Configuración Paso a Paso

### Desarrollo Local:

1. **Crea el archivo de variables:**
   ```bash
   # En la raíz del proyecto
   cp supabase/functions/.env.example supabase/functions/.env
   ```

2. **Edita el archivo `.env`:**
   ```bash
   nano supabase/functions/.env
   ```

3. **Reinicia las Edge Functions:**
   ```bash
   npx supabase functions serve
   ```

### Producción:

1. **En Supabase Dashboard:**
   - Ve a tu proyecto
   - Settings → Edge Functions
   - Environment Variables
   - Agrega cada variable una por una

2. **Despliega las funciones:**
   ```bash
   npx supabase functions deploy
   ```

## 🧪 Modo Desarrollo vs Producción

### Modo Desarrollo (Sin credenciales reales):
- Las notificaciones se simulan
- Se registran en la base de datos
- Se muestran en consola
- No se envían realmente

### Modo Producción (Con credenciales reales):
- Las notificaciones se envían realmente
- SMS via Twilio
- WhatsApp via Twilio
- Email via Resend

## 🔍 Verificar Configuración

### Probar SMS:
```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/send-sms" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+34123456789", "message": "Prueba SMS"}'
```

### Probar WhatsApp:
```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+34123456789", "message": "Prueba WhatsApp"}'
```

### Probar Email:
```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/send-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@ejemplo.com", "subject": "Prueba", "body": "Mensaje de prueba"}'
```

## 📱 Formato de Números de Teléfono

**Importante:** Los números deben estar en formato internacional:
- ✅ Correcto: `+34123456789`
- ❌ Incorrecto: `612345678`
- ❌ Incorrecto: `+34 612 345 678`

## 🎯 Plantillas Predefinidas

El sistema incluye plantillas para:
- Confirmación de pedidos
- Pedidos listos para recoger
- Alertas de stock bajo
- Notificaciones de incidencias
- Recordatorios de fichaje
- Reset de contraseñas

## 🔐 Seguridad

- **Nunca** commites el archivo `.env` al repositorio
- Usa variables de entorno en producción
- Rota las API keys regularmente
- Monitorea el uso de las APIs

## 🆘 Solución de Problemas

### Error: "Invalid phone number format"
- Verifica que el número esté en formato internacional (+1234567890)

### Error: "Twilio error: 400"
- Verifica las credenciales de Twilio
- Asegúrate de que el número esté verificado

### Error: "Resend error: 400"
- Verifica la API key de Resend
- Asegúrate de que el dominio esté configurado

### Las notificaciones no se guardan en la base de datos
- Verifica las políticas RLS
- Asegúrate de que el usuario tenga permisos
