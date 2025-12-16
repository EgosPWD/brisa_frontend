import type {
	Estudiante,
	EstudianteListadoDTO,
	EstudiantesApoderadosResponseDTO,
	ContactosApoderadosResponseDTO,
	DistribucionEdadResponseDTO,
	HistorialCursosResponseDTO
} from '$lib/types/api.js';
import { http } from './http';

export interface EstudianteCreateDTO {
	nombres: string;
	apellido_paterno: string;
	apellido_materno: string;
	ci?: string;
	fecha_nacimiento?: string;
	direccion?: string;
	estado?: string;
	nombre_padre?: string;
	apellido_paterno_padre?: string;
	apellido_materno_padre?: string;
	telefono_padre?: string;
	nombre_madre?: string;
	apellido_paterno_madre?: string;
	apellido_materno_madre?: string;
	telefono_madre?: string;
}

export interface EstudianteUpdateDTO extends Partial<EstudianteCreateDTO> {}

export interface EstudianteResponse {
	id: number;
	nombres: string;
	apellido_paterno: string;
	apellido_materno: string;
	ci?: string;
	fecha_nacimiento?: string;
	direccion?: string;
	estado: string;
	nombre_padre?: string;
	apellido_paterno_padre?: string;
	apellido_materno_padre?: string;
	telefono_padre?: string;
	nombre_madre?: string;
	apellido_paterno_madre?: string;
	apellido_materno_madre?: string;
	telefono_madre?: string;
	cursos?: any[];
}

export const estudiantesService = {
	// CRUD básico
	getEstudiantes: async (params?: { skip?: number; limit?: number }): Promise<EstudianteResponse[]> => {
		console.log('[estudiantesService] Llamando a /estudiantes/', params);
		const response = await http.get<any>(`/estudiantes/${http.buildQuery(params || {})}`);
		console.log('[estudiantesService] Respuesta raw:', response);
		const data = response.data || response;
		console.log('[estudiantesService] Data extraído:', data);
		
		// El backend devuelve {total: number, estudiantes: array}
		const estudiantes = data.estudiantes || data;
		console.log('[estudiantesService] Estudiantes extraídos:', estudiantes);
		console.log('[estudiantesService] Es array?', Array.isArray(estudiantes), 'Longitud:', estudiantes?.length);
		
		// Map id_estudiante to id for consistency
		const result = Array.isArray(estudiantes) ? estudiantes.map((e: any) => ({
			...e,
			id: e.id_estudiante || e.id
		})) : [];
		console.log('[estudiantesService] Resultado final:', result.length, 'estudiantes');
		return result;
	},

	getEstudiante: async (id: number): Promise<EstudianteResponse> => {
		const response = await http.get<any>(`/estudiantes/${id}`);
		const data = response.data || response;
		// Map id_estudiante to id for consistency
		return {
			...data,
			id: data.id_estudiante || data.id
		};
	},

	createEstudiante: async (data: EstudianteCreateDTO): Promise<EstudianteResponse> => {
		const response = await http.post<any>('/estudiantes/', data);
		const result = response.data || response;
		return {
			...result,
			id: result.id_estudiante || result.id
		};
	},

	updateEstudiante: async (id: number, data: EstudianteUpdateDTO): Promise<EstudianteResponse> => {
		const response = await http.put<any>(`/estudiantes/${id}`, data);
		const result = response.data || response;
		return {
			...result,
			id: result.id_estudiante || result.id
		};
	},

	deleteEstudiante: async (id: number): Promise<void> => {
		await http.del(`/estudiantes/${id}`);
	},

	// Cambiar estado
	cambiarEstado: async (id: number, estado: string): Promise<EstudianteResponse> => {
		const response = await http.patch<any>(`/estudiantes/${id}/estado`, { estado });
		const result = response.data || response;
		return {
			...result,
			id: result.id_estudiante || result.id
		};
	},

	// Filtros
	getEstudiantesPorEstado: async (estado: string): Promise<EstudianteResponse[]> => {
		const response = await http.get<any>(`/estudiantes/estado/${estado}`);
		return response.data;
	},

	getEstudiantesPorGestion: async (gestion: string, params?: { nivel?: string; curso_id?: number }): Promise<EstudianteResponse[]> => {
		const response = await http.get<any>(`/estudiantes/gestion/${gestion}${http.buildQuery(params || {})}`);
		return response.data;
	},

	// Importación/Exportación
	exportarEstudiantes: async (): Promise<Blob> => {
		return await http.downloadFile('/estudiantes/exportar/todos');
	},

	descargarPlantilla: async (): Promise<Blob> => {
		return await http.downloadFile('/estudiantes/plantilla/excel');
	},

	importarEstudiantes: async (file: File): Promise<any> => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await http.post<any>('/estudiantes/importar', formData);
		return response.data;
	},

	// Reportes
	getReporteEstudiantes: async (params?: {
		curso_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<EstudianteListadoDTO> => http.get(`/reports/students/${http.buildQuery(params)}`),
	
	getReporteEstudiantesApoderados: async (con_apoderados?: boolean): Promise<EstudiantesApoderadosResponseDTO> => http.get(`/reports/students/guardians/${http.buildQuery({ con_apoderados })}`),
	
	getReporteContactosApoderados: async (params?: {
		curso_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<ContactosApoderadosResponseDTO> => http.get(`/reports/students/guardian-contacts/${http.buildQuery(params)}`),
	
	getReporteDistribucionEdad: async (params?: {
		curso_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<DistribucionEdadResponseDTO> => http.get(`/reports/students/age-distribution/${http.buildQuery(params)}`),
	
	getReporteHistorialCursos: async (estudiante_id?: number): Promise<HistorialCursosResponseDTO> => http.get(`/reports/students/course-history/${http.buildQuery({ estudiante_id })}`)
};
