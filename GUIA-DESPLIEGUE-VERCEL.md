# 🚀 Guía Completa de Despliegue en Vercel
## Project ZURICH - Alter5 Investment Platform

### ✅ Opción 1: Despliegue SÚPER FÁCIL (Recomendado para principiantes)

#### **PASO 1: Preparar los archivos**
1. Descarga TODOS los archivos de tu proyecto desde esta plataforma
2. Créalos en una carpeta en tu computadora (por ejemplo: `project-zurich-alter5`)
3. Asegúrate de tener esta estructura:
   ```
   project-zurich-alter5/
   ├── index.html
   ├── project-zurich-equity.html
   ├── admin-simple.html
   ├── vercel.json
   ├── css/
   │   ├── style.css
   │   └── alter5-colors.css
   ├── js/
   │   ├── main.js
   │   ├── equity-main.js
   │   ├── config.js
   │   └── supabase-client.js
   └── images/ (si tienes imágenes)
   ```

#### **PASO 2: Subir a Vercel (Método Drag & Drop)**
1. Ve a [vercel.com](https://vercel.com) y haz login con tu cuenta
2. Haz clic en "Add New..." → "Project"
3. Selecciona "Browse all templates" o "Import Git Repository"
4. **¡MÉTODO MÁS FÁCIL!** Arrastra toda la carpeta `project-zurich-alter5` directamente a Vercel
5. Vercel automáticamente detectará que es un sitio estático
6. Haz clic en "Deploy"

#### **PASO 3: ¡Tu sitio está vivo!**
- Vercel te dará una URL como: `https://project-zurich-alter5-abc123.vercel.app`
- Tu plataforma de inversión ya estará funcionando online

---

### 🔧 Opción 2: Con Base de Datos Supabase (Para funcionalidad completa)

#### **PASO 1: Crear cuenta en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project" 
3. Créate una cuenta gratuita
4. Haz clic en "New Project"
5. Elige un nombre: `project-zurich-alter5`
6. Crea una contraseña segura para la base de datos
7. Elige región: Europe (más cercana a España)
8. Haz clic en "Create new project"

#### **PASO 2: Configurar la base de datos**
1. Espera 2-3 minutos a que Supabase configure tu proyecto
2. Ve a "SQL Editor" en el menú lateral
3. Haz clic en "New Query"
4. Copia y pega TODO el contenido del archivo `supabase-setup.sql`
5. Haz clic en "Run" (▶️)
6. Deberías ver: "Success. No rows returned"

#### **PASO 3: Obtener las claves de Supabase**
1. Ve a "Settings" → "API" en Supabase
2. Copia estos dos valores:
   - **Project URL**: `https://tuproyecto.supabase.co`
   - **anon public key**: `eyJ0eXAi...` (clave larga)

#### **PASO 4: Desplegar en Vercel con variables de entorno**
1. Sube tu proyecto a Vercel (como en la Opción 1)
2. **ANTES** de hacer clic en "Deploy", haz clic en "Environment Variables"
3. Añade estas variables:
   ```
   SUPABASE_URL = https://tuproyecto.supabase.co
   SUPABASE_ANON_KEY = tu_clave_anon_publica
   ```
4. Haz clic en "Deploy"

#### **PASO 5: ¡Funcionalidad completa!**
Tu plataforma ahora tendrá:
- ✅ Seguimiento de visitantes
- ✅ Base de datos de contactos
- ✅ Analytics avanzado
- ✅ Enlaces únicos funcionales

---

### 🎯 URLs de tu plataforma desplegada

Una vez desplegado, tendrás estas páginas:

1. **Página Principal**: `https://tu-proyecto.vercel.app/`
   - Financiación Senior (€42M)
   
2. **Página de Equity**: `https://tu-proyecto.vercel.app/project-zurich-equity.html`
   - Inversión en Equity (€21M)
   
3. **Panel de Administración**: `https://tu-proyecto.vercel.app/admin-simple.html`
   - Gestión de invitados y generación de enlaces únicos

4. **Enlaces únicos**: `https://tu-proyecto.vercel.app/?token=TOKEN_UNICO`
   - Para visitantes específicos

---

### 🚨 Solución de Problemas Comunes

#### **"Mi sitio no carga"**
- Verifica que el archivo `index.html` esté en la raíz de la carpeta
- Revisa que no haya errores de ortografía en nombres de archivos

#### **"Las funciones de base de datos no funcionan"**
- Asegúrate de haber configurado las variables de entorno en Vercel
- Verifica que hayas ejecutado el SQL en Supabase correctamente

#### **"Los enlaces únicos no funcionan"**
- Ve al panel de admin y genera nuevos enlaces
- La funcionalidad de enlaces requiere Supabase (Opción 2)

---

### 🔄 Actualizar tu sitio

Para hacer cambios después del despliegue:

1. **Método fácil**: Ve a tu dashboard de Vercel → "Deployments" → Arrastra nuevos archivos
2. **Método profesional**: Conecta con GitHub (Vercel te guiará automáticamente)

---

### 📞 Soporte

Si tienes algún problema:
1. El sitio básico (Opción 1) debería funcionar inmediatamente
2. Para problemas con Supabase, revisa el "SQL Editor" → "Logs"
3. En Vercel, ve a "Functions" → "Logs" para ver errores

### 🎉 ¡Resultado Final!

Tendrás una plataforma de inversión profesional y completamente funcional con:
- ✅ Diseño Alter5 corporativo
- ✅ Presentación de ambos proyectos de inversión
- ✅ Sistema de enlaces únicos para invitados
- ✅ Panel de administración fácil de usar
- ✅ URL profesional personalizable
- ✅ Certificado SSL automático (HTTPS)
- ✅ Carga rápida mundial (CDN de Vercel)

**¡Tu plataforma estará online en menos de 10 minutos!** 🚀