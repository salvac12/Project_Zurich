# 🌐 Configuración del Dominio: zurich-alter-5.com

## Pasos para configurar el dominio personalizado en Vercel

### 1️⃣ **En tu proveedor de dominios (donde compraste zurich-alter-5.com)**

Necesitas agregar estos registros DNS:

#### **Opción A: Usar dominio raíz (zurich-alter-5.com)**

Agrega un registro **A** apuntando a la IP de Vercel:
```
Type: A
Name: @ (o dejar vacío)
Value: 76.76.21.21
TTL: 3600 (o Automático)
```

#### **Opción B: Usar subdominio www (www.zurich-alter-5.com)**

Agrega un registro **CNAME**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (o Automático)
```

#### **Recomendado: Configurar ambos**

Para que funcione tanto `zurich-alter-5.com` como `www.zurich-alter-5.com`:

```
# Registro A para dominio raíz
Type: A
Name: @
Value: 76.76.21.21

# Registro CNAME para www
Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

---

### 2️⃣ **En Vercel Dashboard**

1. Ve a: https://vercel.com/salvac12/project-zurich
2. Click en **"Settings"** (⚙️)
3. Click en **"Domains"** en el menú lateral
4. Click en **"Add Domain"**
5. Escribe: `zurich-alter-5.com`
6. Click **"Add"**
7. Vercel te pedirá verificar que eres dueño del dominio
8. Espera 5-10 minutos para que los DNS se propaguen

**Opcional: Agregar www también**
- Repite el proceso con `www.zurich-alter-5.com`
- Vercel automáticamente redirigirá www → dominio principal

---

### 3️⃣ **Configuración SSL (Automático)**

✅ Vercel automáticamente generará un certificado SSL gratuito (Let's Encrypt)
✅ Tu sitio estará disponible en HTTPS automáticamente

---

### 4️⃣ **Verificar configuración**

Después de 5-10 minutos, verifica:

```bash
# Verificar DNS
nslookup zurich-alter-5.com

# Debería mostrar: 76.76.21.21
```

O visita: https://dnschecker.org/#A/zurich-alter-5.com

---

## 📋 **Proveedores de Dominio Comunes**

### **GoDaddy**
1. Login → Mi cuenta → Dominios → Administrar DNS
2. Agregar registros en la sección "Registros"

### **Namecheap**
1. Login → Domain List → Manage → Advanced DNS
2. Agregar registros en "Host Records"

### **Google Domains**
1. Login → Mis dominios → DNS
2. Agregar registros en "Registros de recursos personalizados"

### **Cloudflare**
1. Login → Seleccionar dominio → DNS
2. Agregar registros en "DNS Records"
3. **IMPORTANTE**: Desactiva el proxy (nube gris) para el registro A

---

## 🔧 **Contraseña del Index**

La contraseña actual configurada es: **`Zurich2025`**

Para cambiarla, edita el archivo `index.html` línea 643:
```javascript
const CORRECT_PASSWORD = 'TuNuevaContraseña';
```

La sesión dura **24 horas** después de ingresar la contraseña correctamente.

---

## ✅ **Después de configurar**

Una vez configurado el dominio, el sitio estará disponible en:
- ✅ https://zurich-alter-5.com
- ✅ https://www.zurich-alter-5.com (si lo configuraste)
- ✅ https://project-zurich.vercel.app (dominio anterior seguirá funcionando)

---

## 🆘 **Problemas comunes**

**❌ "Domain is not configured"**
- Espera 10-30 minutos para propagación DNS
- Verifica que los registros DNS estén correctos

**❌ "Invalid Configuration"**
- Verifica que el registro A apunte a `76.76.21.21`
- Verifica que el CNAME apunte a `cname.vercel-dns.com`

**❌ SSL no funciona**
- Espera 5 minutos después de agregar el dominio
- Vercel genera el certificado automáticamente

---

## 📞 **¿Necesitas ayuda?**

Si tienes problemas configurando el dominio:
1. Dime qué proveedor de dominios usas (GoDaddy, Namecheap, etc.)
2. Envíame captura de la configuración DNS actual
3. Te guiaré paso a paso

---

**Fecha de creación**: 2025-10-07  
**Proyecto**: Project ZURICH - Alter5
