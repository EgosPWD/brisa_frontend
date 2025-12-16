import { http } from './http';
import type { EstudianteResponse } from './estudiantes';

export interface AsignarEstudianteRequest {
	id_estudiante: number;
	id_curso: number;
}

export interface AsignacionResponse {
	estudiante_id: number;
	curso_id: number;
	fecha_inscripcion: string;
}

export const asignacionesService = {
	// Asignar estudiante a curso
	asignarEstudianteCurso: async (data: AsignarEstudianteRequest): Promise<AsignacionResponse> => {
		console.log('[asignacionesService] Enviando asignación:', data);
		try {
			const response = await http.post<any>('/asignaciones/asignar', data);
			console.log('[asignacionesService] Respuesta:', response);
			return response.data || response;
		} catch (error: any) {
			console.error('[asignacionesService] Error al asignar:', error);
			console.error('[asignacionesService] Detalles del error:', JSON.stringify(error.details, null, 2));
			if (error.details?.detail) {
				console.error('[asignacionesService] Array de errores:', error.details.detail);
			}
			throw error;
		}
	},

	// Desasignar estudiante de curso
	desasignarEstudianteCurso: async (estudianteId: number, cursoId: number): Promise<void> => {
		await http.del(`/asignaciones/desasignar/${estudianteId}/${cursoId}`);
	},

	// Obtener cursos de un estudiante
	getCursosPorEstudiante: async (estudianteId: number): Promise<any[]> => {
		const response = await http.get<any>(`/asignaciones/estudiante/${estudianteId}/cursos`);
		return response.data || response;
	},

	// Obtener estudiantes de un curso
	getEstudiantesPorCurso: async (cursoId: number): Promise<EstudianteResponse[]> => {
		const response = await http.get<any>(`/asignaciones/curso/${cursoId}/estudiantes`);
		const data = response.data || response;
		
		// El backend devuelve un objeto con la propiedad 'estudiantes'
		if (data && data.estudiantes && Array.isArray(data.estudiantes)) {
			// Mapear los campos del backend a los del frontend
			return data.estudiantes.map((est: any) => ({
				id: est.id_estudiante,
				nombres: est.nombres,
				apellido_paterno: est.apellido_paterno,
				apellido_materno: est.apellido_materno,
				ci: est.ci,
				fecha_nacimiento: est.fecha_nacimiento,
				direccion: est.direccion,
				estado: est.estado,
				nombre_padre: est.nombre_padre,
				apellido_paterno_padre: est.apellido_paterno_padre,
				telefono_padre: est.telefono_padre,
				nombre_madre: est.nombre_madre,
				apellido_paterno_madre: est.apellido_paterno_madre,
				telefono_madre: est.telefono_madre
			}));
		}
		
		return [];
	}
};
