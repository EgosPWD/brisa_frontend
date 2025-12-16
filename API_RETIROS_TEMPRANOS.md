# Sistema de Retiros Tempranos - Documentación de Procesos de Negocio

## 📖 Descripción General

El sistema de Retiros Tempranos gestiona el proceso mediante el cual los estudiantes de una institución educativa pueden retirarse antes del horario normal de salida. Existen dos modalidades de retiro: **individual** y **masivo**, cada una con su propio flujo de aprobación y reglas de negocio.

---

## 👥 Actores del Sistema

### 1. **Apoderado**
- Padre, madre o tutor legal del estudiante
- Puede solicitar el retiro de su pupilo de forma individual
- Debe proporcionar justificación y documentación cuando se requiera
- Solo puede solicitar retiros de los estudiantes a su cargo

### 2. **Recepcionista**
- Personal administrativo de la institución
- Primer punto de contacto para todas las solicitudes
- Valida documentación y requisitos iniciales
- Deriva las solicitudes al Regente para aprobación
- Registra la salida física del estudiante una vez aprobado el retiro
- Puede crear solicitudes masivas en nombre de otros usuarios

### 3. **Regente**
- Autoridad académica de la institución
- Único responsable de aprobar o rechazar solicitudes
- Evalúa la validez del motivo del retiro
- Puede solicitar información adicional antes de decidir
- Hay un único regente en la institución

### 4. **Profesor/Administrativo**
- Personal docente o administrativo
- Puede solicitar retiros masivos para actividades grupales
- Organiza salidas educativas, excursiones, eventos
- Responsable de los estudiantes durante el retiro masivo

---

## 🔄 Retiros Tempranos Individuales

### Descripción
Los retiros individuales son solicitudes para que un estudiante específico se retire antes del horario normal, generalmente por motivos personales, médicos o familiares.

### Flujo del Proceso

#### **Paso 1: Solicitud Inicial**
- **Actor:** Apoderado
- **Acción:** Crea una solicitud de retiro para su pupilo
- **Información requerida:**
  - Estudiante a retirar
  - Motivo del retiro (médico, familiar, emergencia, otros)
  - Hora prevista de salida
  - Hora estimada de retorno (si aplica - para retornos el mismo día)
  - Observaciones adicionales
- **Estado resultante:** `recibida`

**Reglas de negocio:**
- El apoderado solo puede solicitar retiros de estudiantes vinculados a su persona
- Debe especificar un motivo válido del catálogo
- La hora de salida debe ser dentro del horario escolar
- Si el retiro es temporal (retorno el mismo día), debe indicar hora de retorno

#### **Paso 2: Derivación al Regente**
- **Actor:** Recepcionista
- **Acción:** Revisa la solicitud y la deriva al Regente
- **Validaciones:**
  - Verifica que la documentación esté completa
  - Valida que el estudiante esté presente en la institución
  - Puede agregar observaciones para el Regente
- **Estado resultante:** `derivada`

**Reglas de negocio:**
- Solo el recepcionista puede derivar solicitudes
- La solicitud debe estar en estado `recibida`
- No se requiere asignación específica a un regente (hay uno solo)

#### **Paso 3: Decisión del Regente**
- **Actor:** Regente
- **Acción:** Aprueba o rechaza la solicitud
- **Criterios de evaluación:**
  - Validez del motivo presentado
  - Historial de retiros del estudiante
  - Política institucional
  - Situación académica del estudiante
- **Estado resultante:** `aprobada` o `rechazada`

**Reglas de negocio:**
- Solo el Regente puede tomar la decisión final
- Debe proporcionar un motivo/justificación de su decisión
- Una vez aprobada o rechazada, la decisión es final (no se puede modificar)
- Si aprueba, se genera una **autorización de retiro**

#### **Paso 4: Registro de Salida** (solo si aprobada)
- **Actor:** Recepcionista
- **Acción:** Registra la salida física del estudiante
- **Información registrada:**
  - Hora exacta de salida
  - Persona que retira al estudiante
  - Observaciones de la salida
- **Estado resultante:** Registro de salida creado

**Reglas de negocio:**
- Solo se puede registrar salida si la solicitud está `aprobada`
- El recepcionista verifica la identidad de quien retira al estudiante
- Se registra la hora real de salida (puede diferir de la solicitada)
- No existe registro de retorno en el sistema (simplificado)

### Estados del Retiro Individual

```
recibida → derivada → aprobada → [registro de salida]
   ↓          ↓           ↓
cancelada  cancelada  rechazada
```

- **recibida:** Solicitud creada, pendiente de revisión por recepción
- **derivada:** Enviada al Regente para decisión
- **aprobada:** Autorizada por el Regente, pendiente de salida
- **rechazada:** No autorizada por el Regente
- **cancelada:** Cancelada por el solicitante en cualquier momento antes de la aprobación

---

## 👥 Retiros Tempranos Masivos

### Descripción
Los retiros masivos son solicitudes para que un grupo de estudiantes se retire de la institución al mismo tiempo, típicamente para actividades educativas extracurriculares como excursiones, visitas culturales, competencias deportivas, eventos institucionales, etc.

### Diferencias Clave con Retiros Individuales

1. **Múltiples estudiantes:** Se autoriza la salida de varios estudiantes simultáneamente
2. **Foto evidencia obligatoria:** Debe incluir una fotografía/imagen de respaldo (circular, autorización de padres, etc.)
3. **Creación por personal:** Solo profesores y administrativos pueden crear estas solicitudes
4. **Sin apoderado:** No requiere solicitud individual de cada apoderado
5. **Actividad grupal:** Se asume que los estudiantes están bajo supervisión institucional

### Flujo del Proceso

#### **Paso 1: Creación de Solicitud Masiva**
- **Actor:** Profesor o Administrativo
- **Acción:** Crea una solicitud para un grupo de estudiantes
- **Información requerida:**
  - Motivo de la salida (excursión, evento, competencia, etc.)
  - Fecha y hora de salida
  - Fecha y hora estimada de retorno
  - **Foto de evidencia** (circular, autorización, documento de respaldo) - OBLIGATORIA
  - Lista de estudiantes participantes
  - Observaciones generales
  - Observaciones individuales por estudiante (opcional)
- **Estado resultante:** `recibida` (automático al crear)

**Reglas de negocio:**
- La foto de evidencia es OBLIGATORIA (URL o referencia al documento)
- Debe incluir al menos un estudiante
- Todos los estudiantes deben estar activos en la institución
- El solicitante registra la actividad bajo su responsabilidad
- No se requiere estado "pendiente" - al crear ya se considera recibida

#### **Paso 2: Derivación al Regente**
- **Actor:** Recepcionista
- **Acción:** Revisa la documentación y deriva al Regente
- **Validaciones:**
  - Verifica que la foto/evidencia esté presente
  - Valida la lista de estudiantes
  - Confirma que la actividad está en el calendario institucional
  - Puede agregar observaciones
- **Estado resultante:** `derivada`

**Reglas de negocio:**
- Solo recepción puede derivar
- La solicitud debe estar en estado `recibida`
- La derivación es siempre al único Regente de la institución

#### **Paso 3: Decisión del Regente**
- **Actor:** Regente
- **Acción:** Aprueba o rechaza toda la solicitud masiva
- **Criterios de evaluación:**
  - Validez de la actividad propuesta
  - Adecuación al calendario académico
  - Seguridad de la actividad
  - Documentación de respaldo
  - Cantidad de estudiantes vs supervisión
- **Estado resultante:** `aprobada` o `rechazada`

**Reglas de negocio:**
- La decisión aplica a TODOS los estudiantes de la solicitud
- No se pueden aprobar estudiantes individuales dentro de una solicitud masiva
- Debe proporcionar motivo de la decisión
- Si aprueba, se genera UNA autorización para toda la solicitud
- La decisión es final e inmutable

#### **Paso 4: Registro de Salida Masiva** (solo si aprobada)
- **Actor:** Recepcionista
- **Acción:** Registra la salida del grupo completo
- **Información registrada:**
  - Hora exacta de salida del grupo
  - Responsable/supervisor de la actividad
  - Observaciones de la salida
- **Estado resultante:** Registro de salida masivo creado

**Reglas de negocio:**
- Se registra una única salida para todo el grupo
- Solo se puede registrar si la solicitud está `aprobada`
- El registro incluye la referencia a la solicitud masiva
- No se registran retornos (se asume que los estudiantes retornan en grupo)

### Estados del Retiro Masivo

```
recibida → derivada → aprobada → [registro de salida masivo]
   ↓          ↓           ↓
cancelada  cancelada  rechazada
```

- **recibida:** Solicitud creada automáticamente al momento de su registro
- **derivada:** Enviada al Regente por recepción
- **aprobada:** Autorizada por el Regente para todo el grupo
- **rechazada:** No autorizada por el Regente
- **cancelada:** Cancelada por el solicitante antes de la aprobación

---

## 📋 Reglas de Negocio Generales

### Motivos de Retiro
El sistema mantiene un catálogo de motivos válidos:
- Médico/Salud
- Emergencia familiar
- Trámite personal
- Actividad extracurricular
- Excursión educativa
- Competencia deportiva
- Evento cultural
- Otros (requiere especificación)

### Autorizaciones
- Cada solicitud aprobada genera UNA autorización
- La autorización registra: decisión, motivo de la decisión, fecha/hora, regente que autorizó
- Las autorizaciones son inmutables (no se pueden modificar ni eliminar)
- Una autorización puede estar vinculada a una solicitud individual o masiva

### Cancelaciones
- El solicitante puede cancelar su solicitud en cualquier momento ANTES de que sea aprobada/rechazada
- Debe proporcionar un motivo de cancelación
- Una vez cancelada, no se puede reactivar (debe crear una nueva solicitud)
- Las solicitudes aprobadas o rechazadas NO se pueden cancelar

### Registros de Salida
- Se crean DESPUÉS de la aprobación
- Registran la hora REAL de salida (puede diferir de la solicitada)
- No se registran retornos en el sistema
- Cada registro está vinculado a una autorización
- Los registros son inmutables

---

## 🎯 Diferencias Clave: Individual vs Masivo

| Aspecto | Retiro Individual | Retiro Masivo |
|---------|-------------------|---------------|
| **Solicitante** | Apoderado | Profesor/Administrativo |
| **Cantidad** | 1 estudiante | Múltiples estudiantes |
| **Evidencia** | Opcional | Foto OBLIGATORIA |
| **Estado inicial** | `recibida` | `recibida` (automático) |
| **Aprobación** | Por estudiante | Por grupo completo |
| **Autorización** | 1 por solicitud | 1 para toda la solicitud |
| **Registro salida** | Individual | Grupal |
| **Retorno** | Puede tener hora prevista | Siempre tiene hora prevista |

---

## 🔐 Permisos por Rol

### Apoderado
- ✅ Crear solicitudes individuales (solo de sus pupilos)
- ✅ Cancelar sus propias solicitudes
- ✅ Consultar estado de sus solicitudes
- ❌ No puede crear solicitudes masivas
- ❌ No puede ver solicitudes de otros apoderados

### Recepcionista
- ✅ Ver todas las solicitudes recibidas
- ✅ Derivar solicitudes al Regente
- ✅ Registrar salidas (individuales y masivas)
- ✅ Crear solicitudes masivas
- ✅ Consultar todo el historial
- ❌ No puede aprobar ni rechazar

### Regente
- ✅ Ver solicitudes derivadas
- ✅ Aprobar o rechazar solicitudes
- ✅ Crear solicitudes masivas
- ✅ Consultar todo el historial
- ❌ No puede derivar (recibe directamente)
- ❌ No puede modificar decisiones ya tomadas

### Profesor/Administrativo
- ✅ Crear solicitudes masivas
- ✅ Cancelar sus propias solicitudes masivas
- ✅ Consultar sus propias solicitudes
- ❌ No puede aprobar ni rechazar
- ❌ No puede ver solicitudes de otros

---

## 🚫 Restricciones Importantes

1. **No hay estado "pendiente":** Las solicitudes se crean directamente en estado `recibida`
2. **No hay múltiples regentes:** Existe UN solo regente en la institución
3. **No se rastrean retornos:** El sistema no registra cuando los estudiantes retornan
4. **No se rastrean recepcionistas específicos:** No se guarda quién derivó cada solicitud
5. **Decisiones inmutables:** Una vez aprobada o rechazada, no se puede cambiar
6. **Autorizaciones permanentes:** No se pueden eliminar ni modificar autorizaciones
7. **Un registro por solicitud:** No se pueden registrar múltiples salidas para la misma solicitud

---

## 📊 Flujo Completo Resumido

### Retiro Individual
```
Apoderado solicita → Recepcionista deriva → Regente decide → Recepcionista registra salida
    (recibida)           (derivada)         (aprobada)         (registro creado)
```

### Retiro Masivo
```
Profesor solicita → Recepcionista deriva → Regente decide → Recepcionista registra salida grupal
   (recibida)          (derivada)         (aprobada)         (registro masivo creado)
```

---

Este documento describe exclusivamente la lógica de negocio y los procesos del sistema de Retiros Tempranos, sin entrar en detalles de implementación técnica.
