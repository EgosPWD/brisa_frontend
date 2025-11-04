// Interfaces TypeScript basadas en la API de BRISA Backend

// Esquelas
export interface CodigoEsquela {
  id_codigo: number;
  tipo: string;
  codigo: string;
  descripcion: string;
}

export interface EsquelaResponse {
  id_esquela: number;
  fecha: string;
  observaciones: string;
  codigos: CodigoEsquela[];
  estudiante?: {
    id_estudiante: number;
    nombre_completo: string;
    ci: string;
  };
  curso?: {
    id_curso: number;
    nombre_curso: string;
    grado: string;
    paralelo: string;
  };
  profesor?: {
    id_persona: number;
    nombre_completo: string;
  };
}

export interface EsquelaCreate {
  id_estudiante: number;
  id_profesor: number;
  id_registrador: number;
  fecha: string;
  observaciones: string;
  codigos: number[]; // IDs de códigos
}

// Códigos de Esquela
export interface CodigoEsquelaCreate {
  tipo: string;
  codigo: string;
  descripcion: string;
}

export interface CodigoEsquelaUpdate {
  tipo: string;
  codigo: string;
  descripcion: string;
}

// Tipos de códigos de esquela
export type TipoCodigoEsquela = 'reconocimiento' | 'orientacion';

// API Response generics
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  details?: any;
  status: number;
}

// Validation Error (from FastAPI)
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// Estudiantes
export interface Estudiante {
  id_estudiante: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  direccion: string;
  nombre_completo: string;
}

// Profesores
export interface Profesor {
  id_persona: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  telefono: string;
  correo: string;
  tipo_persona: string;
  nombre_completo: string;
}

// Registradores
export interface Registrador {
  id_persona: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  telefono: string;
  correo: string;
  tipo_persona: string;
  nombre_completo: string;
}