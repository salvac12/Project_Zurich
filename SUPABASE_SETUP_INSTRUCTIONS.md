# 🔧 Instrucciones para Configurar Analytics con Supabase

## El Problema

Tu dashboard de analytics no muestra datos porque las APIs de Vercel son **serverless y efímeras**. 

Cada vez que una API se ejecuta, es una nueva instancia sin memoria del pasado. Por eso, aunque los visitantes entren y hagan clicks, los datos se pierden inmediatamente.

## La Solución

He implementado **persistencia en Supabase** para guardar permanentemente:
- ✅ Visitantes registrados (con email, nombre, empresa)
- ✅ Eventos de analytics (page_visit, download, nda_request, etc.)
- ✅ Asociación automática de email con cada evento

## 📦 Cambios Realizados

El código ya está listo en la branch `fix/supabase-analytics-persistence`:

1. **api/_supabase.js** - Helper para conectar con Supabase
2. **api/tables/analytics.js** - Modificado para guardar en Supabase
3. **api/tables/visitors.js** - Modificado para guardar en Supabase
4. **js/tracking.js** - Ahora busca y asocia el email del visitante

## 🚀 Pasos para Activar

### Paso 1: Configurar Supabase

Si aún no tienes un proyecto de Supabase:

1. Ve a https://supabase.com
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto (gratis hasta 500MB)
4. Espera 2-3 minutos a que se inicialice

### Paso 2: Crear las Tablas

En Supabase Dashboard → SQL Editor → New Query, ejecuta este SQL:

```sql
-- Tabla de visitantes
CREATE TABLE visitors (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  status TEXT DEFAULT 'active',
  access_count INTEGER DEFAULT 0,
  first_access TIMESTAMP,
  last_access TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de analytics
CREATE TABLE analytics (
  id TEXT PRIMARY KEY,
  visitor_token TEXT NOT NULL,
  visitor_email TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para queries rápidos
CREATE INDEX idx_analytics_visitor ON analytics(visitor_token);
CREATE INDEX idx_analytics_type ON analytics(event_type);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp DESC);
CREATE INDEX idx_visitors_token ON visitors(token);
CREATE INDEX idx_visitors_email ON visitors(email);
```

### Paso 3: Obtener las Claves

En Supabase Dashboard:

1. Ve a **Settings** → **API**
2. Copia estos valores:

   - **Project URL** → Ej: `https://abcdefgh.supabase.co`
   - **anon public key** → Empieza con `eyJhbGciOiJ...`
   - **service_role key** → Empieza con `eyJhbGciOiJ...` (diferente al anon)

### Paso 4: Configurar Variables en Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto **project-zurich**
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas 3 variables:

   | Variable | Valor | Entorno |
   |----------|-------|---------|
   | `SUPABASE_URL` | Tu Project URL | Production, Preview, Development |
   | `SUPABASE_ANON_KEY` | Tu anon key | Production, Preview, Development |
   | `SUPABASE_SERVICE_KEY` | Tu service_role key | Production, Preview, Development |

   ⚠️ **IMPORTANTE**: Selecciona las 3 opciones (Production, Preview, Development) para cada variable

5. Haz click en **Save** para cada una

### Paso 5: Crear y Mergear el Pull Request

Hay 2 opciones:

#### Opción A: Desde GitHub Web (Más Fácil)

1. Ve a https://github.com/salvac12/Project_Zurich/compare/main...fix/supabase-analytics-persistence
2. Haz click en **"Create pull request"**
3. Revisa los cambios
4. Haz click en **"Merge pull request"**
5. Confirma el merge

#### Opción B: Desde Terminal

```bash
# Si prefieres usar comandos
cd /home/user/webapp
git checkout main
git merge fix/supabase-analytics-persistence
git push origin main
```

### Paso 6: Verificar el Deploy

Después del merge, Vercel automáticamente:
1. Detecta el cambio en main
2. Hace build del proyecto
3. Despliega a producción

Espera 2-3 minutos y verifica en:
- https://vercel.com/dashboard → Tu proyecto → Deployments
- Debe aparecer un nuevo deployment exitoso

### Paso 7: Probar que Funciona

1. **Genera un nuevo link único**:
   - Ve a https://project-zurich.vercel.app/unique_links.html
   - Agrega un email de prueba (ej: `test@ejemplo.com`)
   - Genera el link

2. **Accede con el link generado**:
   - Abre el link en una nueva pestaña
   - Navega por la página
   - Haz click en botones de descarga

3. **Verifica en el Dashboard**:
   - Ve a https://project-zurich.vercel.app/analytics-dashboard.html
   - Ahora deberías ver:
     - ✅ Visitante registrado con email
     - ✅ Eventos de page_visit
     - ✅ Eventos de download
     - ✅ Estadísticas en tiempo real

4. **Verifica en Supabase** (opcional):
   - Ve a Supabase Dashboard → Table Editor
   - Mira las tablas `visitors` y `analytics`
   - Deberías ver tus registros guardados

## 🎯 Resultado Esperado

Después de completar estos pasos:

- ✅ El dashboard mostrará datos REALES de visitantes
- ✅ Cada evento tendrá el email del visitante asociado
- ✅ Los datos persisten permanentemente en Supabase
- ✅ Los links únicos que ya generaste seguirán funcionando
- ✅ Puedes ver métricas históricas y en tiempo real

## ❓ Troubleshooting

### "El dashboard sigue sin mostrar datos"

1. Verifica que las variables de entorno estén configuradas en Vercel
2. Ve a Vercel → Settings → Environment Variables
3. Confirma que las 3 variables existan
4. Si las acabas de agregar, haz un **Redeploy** manual:
   - Vercel Dashboard → Deployments → ... → Redeploy

### "Error 500 en las APIs"

1. Verifica que las tablas existan en Supabase (Paso 2)
2. Verifica que las variables de entorno tengan los valores correctos
3. Revisa los logs en Vercel Dashboard → Functions → Logs

### "Los eventos se guardan pero sin email"

Esto puede pasar si:
- El visitante usó un link sin token
- El token no está registrado en la tabla `visitors`

Solución: Genera nuevos links desde `/unique_links.html`

## 📊 Monitoreo

Para ver qué está pasando:

1. **Vercel Logs**: Vercel Dashboard → Functions → Selecciona una API → View Logs
2. **Supabase Logs**: Supabase Dashboard → Logs → API Logs
3. **Browser Console**: Abre DevTools en la página del visitante

## 🎉 Próximos Pasos

Una vez que funcione:

1. Genera links únicos para tus inversionistas reales
2. Envíales los links por email
3. Monitorea el dashboard para ver su actividad
4. Usa los datos para:
   - Saber quién descargó qué documento
   - Ver tiempo en la página
   - Identificar inversionistas más interesados
   - Hacer seguimiento personalizado

---

**¿Tienes dudas?** Revisa los logs en Vercel y Supabase, o pregúntame cualquier cosa.
