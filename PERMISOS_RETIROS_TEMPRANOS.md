# 🔐 Sistema de Permisos - Retiros Tempranos

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de control de acceso basado en roles para el módulo de **Retiros Tempranos**, que filtra automáticamente las vistas y endpoints según el rol del usuario autenticado.

---

## 👥 Roles y Permisos

### 1️⃣ **APODERADO**
**Acceso:**
- ✅ Ver solo sus propias solicitudes individuales (`/mis-solicitudes`)
- ✅ Crear nuevas solicitudes individuales
- ✅ Cancelar sus propias solicitudes
- ✅ Ver detalles de sus solicitudes

**Restricciones:**
- ❌ NO puede ver solicitudes masivas
- ❌ NO puede ver solicitudes de otros apoderados
- ❌ NO puede derivar, aprobar o rechazar

**Endpoint usado:**
```typescript
GET /api/retiros-tempranos/solicitudes/mis-solicitudes
POST /api/retiros-tempranos/solicitudes/
PUT /api/retiros-tempranos/solicitudes/{id}/cancelar
```

---

### 2️⃣ **RECEPCIONISTA**
**Acceso:**
- ✅ Ver todas las solicitudes individuales **recibidas** (pendientes)
- ✅ Ver todas las solicitudes masivas **recibidas**
- ✅ Crear solicitudes masivas
- ✅ Derivar solicitudes a regentes
- ✅ Cancelar cualquier solicitud

**Restricciones:**
- ❌ NO puede aprobar o rechazar (solo derivar)

**Endpoints usados:**
```typescript
// Individuales
GET /api/retiros-tempranos/solicitudes/pendientes

// Masivas
GET /api/retiros-tempranos/solicitudes-masivas/
PUT /api/retiros-tempranos/solicitudes/{id}/derivar
PUT /api/retiros-tempranos/solicitudes-masivas/{id}/derivar
POST /api/retiros-tempranos/solicitudes-masivas/
```

---

### 3️⃣ **REGENTE**
**Acceso:**
- ✅ Ver todas las solicitudes individuales **derivadas a él**
- ✅ Ver todas las solicitudes masivas **derivadas**
- ✅ Aprobar solicitudes
- ✅ Rechazar solicitudes
- ✅ Cancelar solicitudes

**Restricciones:**
- ❌ NO puede crear solicitudes
- ❌ NO puede ver solicitudes no derivadas a él

**Endpoints usados:**
```typescript
// Individuales
GET /api/retiros-tempranos/solicitudes/derivadas-a-mi
PUT /api/retiros-tempranos/solicitudes/{id}/aprobar
PUT /api/retiros-tempranos/solicitudes/{id}/rechazar

// Masivas (filtra por estado "derivada")
GET /api/retiros-tempranos/solicitudes-masivas/
PUT /api/retiros-tempranos/solicitudes-masivas/{id}/aprobar
PUT /api/retiros-tempranos/solicitudes-masivas/{id}/rechazar
```

---

### 4️⃣ **PROFESOR**
**Acceso:**
- ✅ Ver solo sus propias solicitudes masivas
- ✅ Crear solicitudes masivas
- ✅ Cancelar sus propias solicitudes

**Restricciones:**
- ❌ NO puede ver tab de solicitudes individuales
- ❌ NO puede ver solicitudes de otros profesores

**Endpoints usados:**
```typescript
GET /api/retiros-tempranos/solicitudes-masivas/mis-solicitudes
POST /api/retiros-tempranos/solicitudes-masivas/
PUT /api/retiros-tempranos/solicitudes-masivas/{id}/cancelar
```

---

### 5️⃣ **ADMIN / DIRECTOR**
**Acceso:**
- ✅ Acceso completo a todas las solicitudes
- ✅ Todos los endpoints disponibles

**Endpoints usados:**
```typescript
GET /api/retiros-tempranos/solicitudes/
GET /api/retiros-tempranos/solicitudes-masivas/
// + Todos los demás endpoints
```

---

## 📂 Archivos Modificados

### 1. **`src/lib/utils/permissions.ts`**
Se agregaron funciones específicas para retiros tempranos:

```typescript
// Funciones de verificación de rol
export function esApoderado(): boolean
export function esRecepcionista(): boolean
export function esRegente(): boolean
export function esProfesor(): boolean

// Funciones de permisos
export function puedeCrearSolicitudIndividual(): boolean
export function puedeCrearSolicitudMasiva(): boolean
export function puedeVerTodasLasSolicitudes(): boolean
export function puedeDerivarSolicitudes(): boolean
export function puedeAprobarRechazarSolicitudes(): boolean
export function puedeCancelarSolicitudes(): boolean
export function puedeVerTabIndividual(): boolean
export function puedeVerTabMasiva(): boolean
```

### 2. **`src/routes/retiros/+layout.svelte`** ⭐ NUEVO
Guard de navegación que verifica permisos antes de permitir acceso al módulo:
- Valida si el usuario tiene acceso
- Redirige al home si no tiene permisos
- Muestra mensaje de "Acceso Denegado" si corresponde

### 3. **`src/routes/retiros/solicitudes/+page.svelte`**
Lógica de carga inteligente según rol:

```typescript
async function loadSolicitudesIndividuales() {
    if (isApoderado) {
        // Solo mis solicitudes
        solicitudes = await retirosService.getMisSolicitudes();
    } else if (isRecepcionista) {
        // Solicitudes pendientes
        solicitudes = await retirosService.getSolicitudesPendientes();
    } else if (isRegente) {
        // Solicitudes derivadas
        solicitudes = await retirosService.getSolicitudesDerivadas();
    } else {
        // Admin: todas
        solicitudes = await retirosService.getSolicitudes();
    }
}
```

### 4. **`src/routes/retiros/+page.svelte`**
Simplificado para redirigir a `/retiros/solicitudes` donde se aplica toda la lógica de roles.

---

## 🎨 Interfaz de Usuario

### Visibilidad de Tabs
- **Apoderado**: Solo ve tab "Individuales"
- **Profesor**: Solo ve tab "Masivas"
- **Recepcionista/Regente/Admin**: Ven ambos tabs

### Botones de Acción
- **"Nueva Solicitud"** (Individual): Visible para Apoderados y Profesores
- **"Nueva Masiva"**: Visible para Recepcionistas

### Estados de Solicitudes
Según el rol, cada usuario ve solicitudes en estados específicos:

| Rol | Estados visibles (Individuales) | Estados visibles (Masivas) |
|-----|----------------------------------|----------------------------|
| **Apoderado** | Todas sus solicitudes | N/A |
| **Recepcionista** | `recibida`, `aprobada` | `recibida`, `aprobada` |
| **Regente** | `derivada` | `derivada` |
| **Profesor** | N/A | Solo sus solicitudes |
| **Admin** | Todos | Todos |

---

## 🔄 Flujo de Trabajo

### Flujo Normal de una Solicitud Individual:

1. **APODERADO** crea solicitud → Estado: `recibida`
2. **RECEPCIONISTA** ve la solicitud en "pendientes" y la deriva → Estado: `derivada`
3. **REGENTE** ve la solicitud en "derivadas" y puede:
   - Aprobar → Estado: `aprobada`
   - Rechazar → Estado: `rechazada`

### Flujo Normal de una Solicitud Masiva:

1. **RECEPCIONISTA/PROFESOR** crea solicitud masiva → Estado: `recibida`
2. **RECEPCIONISTA** la deriva → Estado: `derivada`
3. **REGENTE** ve la solicitud y puede aprobar/rechazar

---

## 🧪 Testing

Para probar el sistema de permisos:

1. **Iniciar sesión como Apoderado:**
   ```
   - Debe ver solo tab "Individuales"
   - Debe ver solo sus solicitudes
   - Debe poder crear nuevas solicitudes
   ```

2. **Iniciar sesión como Recepcionista:**
   ```
   - Debe ver ambos tabs
   - En "Individuales": solo solicitudes con estado "recibida"
   - Debe poder crear solicitudes masivas
   - Debe poder derivar
   ```

3. **Iniciar sesión como Regente:**
   ```
   - Debe ver ambos tabs
   - Solo solicitudes con estado "derivada"
   - Debe poder aprobar/rechazar
   ```

4. **Iniciar sesión como Profesor:**
   ```
   - Debe ver solo tab "Masivas"
   - Debe ver solo sus solicitudes masivas
   ```

---

## 🔧 Configuración del Backend

Asegúrate de que el backend esté corriendo en:
```
http://localhost:8000
```

La configuración se encuentra en `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:5173
PORT=8000
```

---

## 📱 Endpoints Backend Requeridos

El sistema espera que estos endpoints estén implementados en el backend:

### Solicitudes Individuales:
- `GET /api/retiros-tempranos/solicitudes/` - Todas (Admin)
- `GET /api/retiros-tempranos/solicitudes/mis-solicitudes` - Mis solicitudes (Apoderado)
- `GET /api/retiros-tempranos/solicitudes/pendientes` - Pendientes (Recepcionista)
- `GET /api/retiros-tempranos/solicitudes/derivadas-a-mi` - Derivadas (Regente)
- `POST /api/retiros-tempranos/solicitudes/` - Crear
- `PUT /api/retiros-tempranos/solicitudes/{id}/derivar` - Derivar
- `PUT /api/retiros-tempranos/solicitudes/{id}/aprobar` - Aprobar
- `PUT /api/retiros-tempranos/solicitudes/{id}/rechazar` - Rechazar
- `PUT /api/retiros-tempranos/solicitudes/{id}/cancelar` - Cancelar

### Solicitudes Masivas:
- `GET /api/retiros-tempranos/solicitudes-masivas/` - Todas
- `GET /api/retiros-tempranos/solicitudes-masivas/mis-solicitudes` - Mis solicitudes (Profesor)
- `POST /api/retiros-tempranos/solicitudes-masivas/` - Crear
- `PUT /api/retiros-tempranos/solicitudes-masivas/{id}/derivar` - Derivar
- `PUT /api/retiros-tempranos/solicitudes-masivas/{id}/aprobar` - Aprobar
- `PUT /api/retiros-tempranos/solicitudes-masivas/{id}/rechazar` - Rechazar

---

## ✅ Validaciones Implementadas

1. ✅ **Guard de navegación** - Impide acceso no autorizado al módulo
2. ✅ **Filtrado automático de datos** - Cada rol ve solo lo que le corresponde
3. ✅ **Endpoints específicos** - Se usan diferentes endpoints según el rol
4. ✅ **UI adaptativa** - Botones y tabs se muestran según permisos
5. ✅ **Logs detallados** - Console logs para debugging

---

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar permisos para "editar" solicitudes
- [ ] Implementar notificaciones por rol
- [ ] Agregar filtros avanzados por fecha/estado
- [ ] Dashboard con métricas por rol

---

**Última actualización:** 16 de Diciembre, 2025
**Autor:** Sistema de Permisos BRISA
