export type EstadoSolicitud = 'recibida' | 'derivada' | 'aprobada' | 'rechazada' | 'cancelada' | 'finalizado';

export type SeveridadMotivo = 'leve' | 'grave' | 'critico';

export interface MotivoRetiro {
  id_motivo: number;
  nombre: string;
  descripcion?: string | null;
  severidad: SeveridadMotivo;
  requiere_evidencia?: boolean;
  activo: boolean;
}

export interface MotivoRetiroCreate {
  nombre: string;
  descripcion?: string | null;
  severidad: SeveridadMotivo;
  requiere_evidencia?: boolean;
}

export interface MotivoRetiroUpdate {
  nombre?: string | null;
  descripcion?: string | null;
  severidad?: SeveridadMotivo | null;
  requiere_evidencia?: boolean | null;
  activo?: boolean | null;
}

/* --- Solicitudes Individuales --- */

export interface SolicitudRetiro {
  id_solicitud: number;
  id_apoderado: number;
  id_estudiante: number;
  id_motivo: number;
  fecha_hora_salida: string; // ISO Date
  fecha_hora_retorno_previsto?: string | null;
  foto_evidencia?: string | null;
  observacion?: string | null;
  estado: EstadoSolicitud;
  fecha_creacion: string;
  fecha_derivacion?: string | null;
  fecha_resolucion?: string | null;
  justificacion_resolucion?: string | null;
  
  // Expanded fields (nombres) from backend DTOs might be present or need joining
  estudiante_nombre?: string | null;
  estudiante_ci?: string | null;
  apoderado_nombre?: string | null;
  motivo_nombre?: string | null;
}

export interface SolicitudRetiroCreate {
  id_estudiante: number;
  id_motivo: number;
  fecha_hora_salida: string;
  fecha_hora_retorno_previsto?: string | null;
  foto_evidencia?: string | null;
  observacion?: string | null;
}

export interface SolicitudRetiroUpdate {
  fecha_hora_salida?: string | null;
  fecha_hora_retorno_previsto?: string | null;
  foto_evidencia?: string | null;
  observacion?: string | null;
}

/* --- Solicitudes Masivas --- */

export interface DetalleSolicitudMasivo {
  id_estudiante: number;
  observacion_individual?: string | null;
}

export interface SolicitudRetiroMasivo {
  id_solicitud: number;
  id_solicitante: number;
  id_motivo: number;
  fecha_hora_salida: string;
  fecha_hora_retorno_previsto?: string | null;
  foto_evidencia: string; // Obligatoria
  observacion?: string | null;
  fecha_creacion: string;
  estado: EstadoSolicitud;
  fecha_derivacion?: string | null;
  fecha_resolucion?: string | null;
  justificacion_resolucion?: string | null;
  cantidad_estudiantes?: number | null;

  solicitante_nombre?: string | null;
  motivo_nombre?: string | null;
}

export interface SolicitudRetiroMasivoCreate {
  id_motivo: number;
  fecha_hora_salida: string;
  fecha_hora_retorno_previsto?: string | null;
  foto_evidencia: string;
  observacion?: string | null;
  estudiantes: DetalleSolicitudMasivo[];
}

export interface SolicitudRetiroMasivoUpdate {
  fecha_hora_salida?: string | null;
  fecha_hora_retorno_previsto?: string | null;
  foto_evidencia?: string | null;
  observacion?: string | null;
}

/* --- Actions DTOs --- */

export interface CancelarSolicitudDTO {
  motivo_cancelacion: string;
}

export interface AprobarSolicitudDTO {
  observacion?: string | null;
}

export interface RechazarSolicitudDTO {
  justificacion: string;
}

export interface DerivacionDTO {
    // Si la API requiere cuerpo para derivar, usualmente es vacío o una nota interna
     observacion?: string; 
}

/* --- Registro Salida --- */

export interface RegistroSalida {
  id_registro: number;
  id_solicitud?: number | null;
  id_solicitud_masiva?: number | null;
  id_estudiante: number;
  tipo_registro: string; // 'individual' | 'masivo'
  fecha_hora_salida_real: string;
  fecha_hora_retorno_real?: string | null;
  
  estudiante_nombre?: string | null;
  estudiante_ci?: string | null;
}

export interface RegistroSalidaCreate {
    responsable_retiro?: string; // Nombre de quien se lo lleva si es diferente o se requiere
    observaciones?: string;
}
