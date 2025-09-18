# 🚀 Guía de Despliegue en Vercel

## 📋 Pasos para desplegar en Vercel

### 1. **Preparar el repositorio en GitHub**

```bash
# Si no tienes git iniciado
git init
git add .
git commit -m "Initial commit - Project ZURICH Analytics"

# Subir a GitHub
git remote add origin https://github.com/tu-usuario/project-zurich.git
git push -u origin main
```

### 2. **Configurar variables de entorno en Vercel**

En el dashboard de Vercel (vercel.com):

1. Ve a tu proyecto
2. Settings → Environment Variables
3. Añade estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. **Archivos que YA están configurados** ✅

- `vercel.json` - Configuración de rutas
- `package.json` - Dependencias de Node.js
- `api/tables/visitors.js` - API para tabla visitors
- `api/tables/analytics.js` - API para tabla analytics  
- `api/tables/sessions.js` - API para tabla sessions

### 4. **URLs que funcionarán después del deploy**

```
https://tu-dominio.vercel.app/analytics-dashboard-direct.html
https://tu-dominio.vercel.app/token-email-lookup.html
https://tu-dominio.vercel.app/admin-simple.html
```

### 5. **APIs que estarán disponibles**

```
GET    /tables/visitors
POST   /tables/visitors
PUT    /tables/visitors/{id}
DELETE /tables/visitors/{id}

GET    /tables/analytics
POST   /tables/analytics

GET    /tables/sessions
POST   /tables/sessions
```

## 🔧 Qué hacer DESPUÉS del deploy

### 1. **Verificar que las APIs funcionen**

Visita:
```
https://tu-dominio.vercel.app/tables/visitors
```

Deberías ver algo como:
```json
{
  "data": [...],
  "total": X,
  "page": 1,
  "limit": 100
}
```

### 2. **Probar el dashboard**

1. Ve a: `https://tu-dominio.vercel.app/analytics-dashboard-direct.html`
2. Debería cargar automáticamente los datos
3. Verifica que se vean los emails en lugar de solo tokens

### 3. **Si hay errores**

**Error común**: "Failed to fetch"
- **Solución**: Verifica las variables de entorno en Vercel
- Ve a Vercel Dashboard → Settings → Environment Variables

**Error común**: "Supabase error"
- **Solución**: Verifica que las tablas existan en Supabase
- Ejecuta el script `supabase-setup.sql`

## 📱 URLs finales funcionando

Una vez deployado, estos enlaces funcionarán:

- **Dashboard principal**: `https://tu-dominio.vercel.app/analytics-dashboard-direct.html`
- **Consulta Token-Email**: `https://tu-dominio.vercel.app/token-email-lookup.html`
- **Admin Panel**: `https://tu-dominio.vercel.app/admin-simple.html`
- **Presentación**: `https://tu-dominio.vercel.app/index.html`

## ✅ Checklist de deployment

- [ ] Código subido a GitHub
- [ ] Variables de entorno configuradas en Vercel
- [ ] Proyecto desplegado desde GitHub en Vercel
- [ ] API `/tables/visitors` responde correctamente
- [ ] Dashboard muestra emails en lugar de tokens
- [ ] Supabase conectado y funcionando

## 🆘 Si algo no funciona

1. **Revisa los logs en Vercel**: Functions → View Logs
2. **Verifica las variables**: Settings → Environment Variables
3. **Prueba las APIs individualmente**: `/tables/visitors`
4. **Revisa la consola del navegador** para errores JavaScript

---

**¡El dashboard ya está listo para mostrar emails en lugar de solo tokens!** 🎉