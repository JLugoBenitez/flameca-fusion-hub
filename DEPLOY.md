np# 🚀 Guía de Despliegue - Volearte CRM

## 📋 Preparación Local

### 1. Configurar Variables de Entorno

Crea un archivo `.env.production` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://atgfjvobxoemlzlfkxnq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z2Zqdm9ieG9lbWx6bGZreG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODA2NDYsImV4cCI6MjA4MjA1NjY0Nn0.dK6mSzrRfcbxs1gqvn7ulwrHjB3Y4kJ1cI2R_PR-xYg

VITE_APP_URL=https://volearteflamenca.es/crm
VITE_DEV_MODE=false
VITE_NOTIFICATIONS_ENABLED=true
VITE_SOUND_NOTIFICATIONS=true

# WooCommerce
VITE_WOOCOMMERCE_URL=https://laboutiqueflamenca.com/
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_ec8c7960d5c5797d78614a89769e6da641b58b98
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_af4ea94f2d73d8334678642284bfe1738a82f315
```

### 2. Construir para Producción

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Construir la aplicación
npm run build

# Esto creará la carpeta `dist/` con todos los archivos estáticos
```

## 📦 Archivos a Subir al Servidor

**Solo necesitas subir la carpeta `dist/` completa** después del build:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

## 🖥️ Configuración en el Servidor

### 1. Crear Directorio en el Servidor

```bash
# Conectarte al servidor
ssh usuario@tu-servidor

# Crear directorio para el CRM
sudo mkdir -p /var/www/Volearte/crm
sudo chown -R $USER:$USER /var/www/Volearte/crm
```

### 2. Subir Archivos

```bash
# Desde tu máquina local, subir la carpeta dist
scp -r dist/* usuario@tu-servidor:/var/www/Volearte/crm/

# O usar rsync (más eficiente)
rsync -avz --delete dist/ usuario@tu-servidor:/var/www/Volearte/crm/
```

### 3. Configurar Nginx

Edita `/etc/nginx/sites-available/volearte` y agrega esta sección `location` dentro del `server` block existente:

```nginx
server {
    server_name volearteflamenca.es www.volearteflamenca.es;

    root /var/www/Volearte/dist;
    index index.html;

    # Configuración para /crm
    location /crm {
        alias /var/www/Volearte/crm/dist;
        index index.html;
        try_files $uri $uri/ /crm/index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Configuración para SPA (Single Page Application) - raíz
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para archivos estáticos (raíz)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Desactivar logs de favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/volearteflamenca.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/volearteflamenca.es/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.volearteflamenca.es) {
        return 301 https://$host$request_uri;
    }
    if ($host = volearteflamenca.es) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name volearteflamenca.es www.volearteflamenca.es;
    return 404;
}
```

### 4. Verificar y Recargar Nginx

```bash
# Verificar configuración
sudo nginx -t

# Si todo está bien, recargar nginx
sudo systemctl reload nginx
```

## ✅ Verificación

1. Accede a: `https://volearteflamenca.es/crm`
2. Verifica que la aplicación carga correctamente
3. Comprueba que las conexiones a Supabase funcionan (abre la consola del navegador)

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación:

```bash
# 1. En local, hacer build
npm run build

# 2. Subir nuevos archivos
rsync -avz --delete dist/ usuario@tu-servidor:/var/www/Volearte/crm/

# 3. (Opcional) Limpiar cache del navegador si hay problemas
```

## 🐛 Solución de Problemas

### Error 404 en rutas
- Verifica que `try_files` incluya `/crm/index.html`
- Asegúrate de que el `base` en `vite.config.ts` sea `/crm/`

### Archivos estáticos no cargan
- Verifica permisos: `sudo chown -R www-data:www-data /var/www/Volearte/crm`
- Verifica que la ruta en `alias` sea correcta

### Errores de CORS o API
- Verifica que las variables de entorno en `.env.production` sean correctas
- Revisa que `VITE_SUPABASE_URL` apunte a tu proyecto de Supabase Cloud

