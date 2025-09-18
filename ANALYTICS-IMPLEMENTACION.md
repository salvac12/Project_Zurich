# 📊 Sistema de Analytics Avanzado - Project ZURICH Alter5

## 🎯 **Funcionalidades Implementadas**

### ✅ **1. Tracking de Descargas de Archivos**
- **Term Sheet**: Detecta automáticamente descargas del documento de términos
- **Teaser**: Rastrea visualizaciones del teaser de inversión
- **Modelo Financiero**: Controla acceso a hojas de cálculo financieras
- **NDA**: Seguimiento de descargas del acuerdo de confidencialidad

**Información capturada por descarga:**
- Nombre del archivo descargado
- Tipo de documento
- Timestamp exacto
- IP del visitante
- Información del navegador
- URL de referencia

### ✅ **2. Seguimiento de Solicitudes de NDA**
- **Solicitud**: Cuándo un visitante solicita el NDA
- **Firma**: Si ha firmado digitalmente el acuerdo
- **Estado**: Pendiente, Firmado, Rechazado
- **Versión**: Control de versiones del NDA

### ✅ **3. Tracking de Tiempo en Página**
- **Tiempo total**: Duración completa de la visita
- **Tiempo activo**: Tiempo real de interacción (sin idle)
- **Profundidad de scroll**: Porcentaje máximo scrolleado
- **Secciones vistas**: Qué partes de la página vio más tiempo
- **Número de clicks**: Interacciones totales

## 📊 **Métricas Disponibles en el Dashboard**

### **Métricas Principales:**
1. **Visitantes únicos** (total y por período)
2. **Total de descargas** (por tipo de archivo)
3. **Solicitudes de NDA** (pendientes y firmadas)
4. **Tiempo promedio en sitio** (por visitante)

### **Gráficos Interactivos:**
- **Descargas por tipo**: Gráfico de dona con distribución
- **Visitantes por día**: Línea temporal de tráfico
- **Análisis por proyecto**: Senior vs Equity

### **Tablas Detalladas:**
- **Top visitantes más activos**
- **Archivos más descargados**
- **Análisis completo por usuario**
- **Actividad en tiempo real**

## 🔧 **Archivos del Sistema**

### **Base de Datos (Supabase):**
```sql
supabase-setup.sql          # Esquema inicial
supabase-analytics-upgrade.sql  # Esquemas avanzados de analytics
```

### **JavaScript:**
```javascript
js/advanced-analytics.js    # Motor principal de tracking
js/config.js               # Configuración de producción
js/supabase-client.js      # Cliente de base de datos
```

### **Panel de Control:**
```html
analytics-dashboard.html    # Dashboard completo de métricas
```

## 🚀 **Cómo Implementar**

### **PASO 1: Actualizar Base de Datos**
1. Ve a **Supabase** → **SQL Editor**
2. Ejecuta el script **`supabase-analytics-upgrade.sql`**
3. Verifica que las tablas se hayan creado correctamente

### **PASO 2: Subir Archivos Nuevos**
Sube a tu repositorio GitHub:
- `js/advanced-analytics.js`
- `analytics-dashboard.html`
- `supabase-analytics-upgrade.sql`

### **PASO 3: Verificar Integración**
Las páginas principales ya tienen integrado el sistema:
- ✅ `index.html` (Financiación Senior)
- ✅ `project-zurich-equity.html` (Inversión Equity)

### **PASO 4: Acceder al Dashboard**
URL: `https://tu-proyecto.vercel.app/analytics-dashboard.html`

## 📈 **Informes Disponibles**

### **1. Informe por Tipo de Archivo**
```
📄 Term Sheet: 15 descargas (32%)
📊 Teaser: 20 descargas (43%)
💼 Modelo Financiero: 8 descargas (17%)
📋 NDA: 4 descargas (8%)
```

### **2. Informe por Visitante**
```
👤 Juan García (InvestCorp)
   📄 Term Sheet: 2 descargas
   📊 Teaser: 1 descarga
   💼 Modelo: 1 descarga
   📋 NDA: Firmado ✅
   ⏱️ Tiempo total: 25:30
   📍 Última visita: 15/01/2024 14:30
```

### **3. Informe de Tiempo**
```
⏱️ Tiempo promedio por visitante: 8:45
📊 Profundidad de scroll promedio: 78%
🖱️ Clicks promedio: 12
📱 Usuarios móviles: 35%
```

### **4. Análisis de NDAs**
```
📋 Total solicitudes: 8
✅ NDAs firmados: 5 (62.5%)
⏳ Pendientes: 3 (37.5%)
📅 Tiempo promedio hasta firma: 2.3 días
```

## 🎯 **Casos de Uso Prácticos**

### **Seguimiento de Leads Calificados:**
- Visitante que descarga **Term Sheet** + **Modelo Financiero** = Lead hot 🔥
- Visitante que firma **NDA** = Interés confirmado ✅
- Tiempo > 10 minutos = Interés alto 📈

### **Optimización de Contenido:**
- Si **Teaser** tiene muchas descargas pero pocos **Term Sheets** → Mejorar teaser
- Si tiempo promedio es bajo → Contenido poco atractivo
- Si scroll depth < 50% → Información importante demasiado abajo

### **Reportes para Inversores:**
- **Alcance**: "23 inversores han revisado la oportunidad"
- **Engagement**: "Tiempo promedio de análisis: 8:45"
- **Conversión**: "62% de visitantes solicita información adicional"

## 🔐 **Privacidad y Cumplimiento**

### **GDPR Compliance:**
- ✅ Solo rastreamos usuarios que acceden con token único
- ✅ No almacenamos datos personales sin consentimiento
- ✅ IPs son anonimizadas después de 30 días
- ✅ Usuario puede solicitar eliminación de datos

### **Transparencia:**
- Dashboard muestra solo emails enmascarados (`j.garcia@***.com`)
- Datos agregados para métricas generales
- Información personal solo para administradores autorizados

## 🚨 **Monitorización en Tiempo Real**

El dashboard incluye:
- **Visitantes activos ahora**: Número de usuarios online
- **Descargas última hora**: Actividad reciente
- **NDAs últimas 24h**: Solicitudes recientes
- **Log de eventos**: Timeline de todas las acciones

## 📞 **Próximos Pasos**

1. **✅ Subir archivos** a GitHub/Vercel
2. **🔧 Configurar Supabase** con los nuevos esquemas
3. **📊 Probar dashboard** con datos de ejemplo
4. **🎯 Personalizar métricas** según necesidades específicas
5. **📈 Configurar alertas** para leads importantes

**¡Tu sistema de analytics está listo para proporcionar insights detallados sobre el comportamiento de tus inversores potenciales!** 🚀