import { http } from './http';
import { authService } from '../services/Usuarios_Roles/auth';

export interface CursoCreateDTO {
	nombre: string;
	gestion: string;
	nivel_educativo: 'Inicial' | 'Primaria' | 'Secundaria';
	capacidad_maxima?: number;
}

export interface CursoUpdateDTO extends Partial<CursoCreateDTO> {}

export interface CursoResponse {
	id: number;
	nombre: string;
	gestion: string;
	nivel_educativo: string;
	capacidad_maxima: number;
	estudiantes?: any[];
}

export interface CopiarGestionRequest {
	gestion_origen: string;
	gestion_destino: string;
}

export const coursesService = {
	// CRUD básico de cursos según la API
	getCursos: async (params?: { skip?: number; limit?: number }): Promise<CursoResponse[]> => {
		// Por defecto obtener todos los cursos sin límite
		const queryParams = params || { skip: 0, limit: 1000 };
		const response = await http.get<any>(`/cursos/${http.buildQuery(queryParams)}`);
		const cursos = response.data || response;
		console.log(`[coursesService.getCursos] Obtenidos ${cursos.length} cursos`);
		return cursos;
	},

	getCurso: async (id: number): Promise<CursoResponse> => {
		const response = await http.get<any>(`/cursos/${id}`);
		return response.data || response;
	},

	createCurso: async (data: CursoCreateDTO): Promise<CursoResponse> => {
		const response = await http.post<any>('/cursos/', data);
		return response.data || response;
	},

	updateCurso: async (id: number, data: CursoUpdateDTO): Promise<CursoResponse> => {
		const response = await http.put<any>(`/cursos/${id}`, data);
		return response.data || response;
	},

	deleteCurso: async (id: number): Promise<void> => {
		await http.del(`/cursos/${id}`);
	},

	// Filtros especializados
	getCursosPorGestionYNivel: async (gestion: string, nivel: string): Promise<CursoResponse[]> => {
		const response = await http.get<any>(`/cursos/gestion/${gestion}/nivel/${nivel}`);
		return response.data || response;
	},

	getCursosPorGestion: async (gestion: string): Promise<CursoResponse[]> => {
		const cursos = await coursesService.getCursos();
		return cursos.filter(c => c.gestion === gestion);
	},

	getCursosPorNivel: async (nivel: string): Promise<CursoResponse[]> => {
		const cursos = await coursesService.getCursos();
		return cursos.filter(c => c.nivel_educativo === nivel);
	},

	getGestiones: async (): Promise<string[]> => {
		console.log('[coursesService] Obteniendo gestiones...');
		
		// WORKAROUND: El endpoint GET /cursos/ tiene un bug y no devuelve todos los cursos
		// Intentamos buscar gestiones del año actual hacia atrás y adelante
		const currentYear = new Date().getFullYear();
		const gestionesEncontradas = new Set<string>();
		
		// Buscar en un rango de 5 años atrás hasta 2 adelante
		for (let year = currentYear - 5; year <= currentYear + 2; year++) {
			try {
				const cursos = await coursesService.getCursosPorGestion(year.toString());
				if (cursos.length > 0) {
					gestionesEncontradas.add(year.toString());
					console.log(`[coursesService] Gestión ${year}: ${cursos.length} cursos`);
				}
			} catch (error) {
				// Si falla, esa gestión no existe
			}
		}
		
		const gestionesArray = Array.from(gestionesEncontradas);
		const gestionesOrdenadas = gestionesArray.sort((a, b) => parseInt(b) - parseInt(a)); // Más reciente primero
		console.log('[coursesService] Gestiones encontradas:', gestionesOrdenadas);
		
		// Si no encontramos ninguna, al menos devolver el año actual
		return gestionesOrdenadas.length > 0 ? gestionesOrdenadas : [currentYear.toString()];
	},

	// Copiar cursos entre gestiones
	copiarGestion: async (data: CopiarGestionRequest): Promise<any> => {
		console.log('[coursesService] Copiando gestión:', data);
		try {
			const response = await http.post<any>('/cursos/copiar-gestion', data);
			console.log('[coursesService] Respuesta copiar gestión:', response);
			return response.data || response;
		} catch (error: any) {
			console.error('[coursesService] Error al copiar gestión:', error);
			console.error('[coursesService] Status:', error.status);
			console.error('[coursesService] Details JSON:', JSON.stringify(error.details, null, 2));
			if (error.details?.detail) {
				console.error('[coursesService] Array de errores de validación:', error.details.detail);
			}
			throw error;
		}
	},

	// Funciones heredadas del sistema anterior (para compatibilidad con profesores)
	getCourses: async () => {
		// Obtener usuario desde el backend
		let me = await authService.getMe().catch(() => null);
		let id_persona = me?.id_persona;

		// Si por alguna razón no devuelve nada, intentar leer el token
		if (!id_persona) {
			const tokenData = authService.getToken();
			if (tokenData) {
				try {
					const parsed = JSON.parse(tokenData);
					id_persona = parsed?.id_persona;
				} catch { }
			}
		}
		return http.get<any>(`/courses/${http.buildQuery({ id_persona })}`);
	},
	
	getCourseTeachersList: async (id: number) => http.get<any>(`/courses/mis_cursos/${id}`),
	getCourse: async (id: number) => http.get<any>(`/courses/${id}`),
	getCourseStudents: async (courseId: number, params?: Record<string, any>) => http.get<any>(`/courses/${courseId}/students/${http.buildQuery(params)}`),
	getCourseTeachers: async (courseId: number, params?: Record<string, any>) => http.get<any>(`/courses/${courseId}/teachers/${http.buildQuery(params)}`),

	// CRUD operations (backward compatibility)
	createCourse: async (data: any) => http.post<any>('/courses/', data),
	updateCourse: async (id: number, data: any) => http.put<any>(`/courses/${id}`, data),
	deleteCourse: async (id: number) => http.del(`/courses/${id}`)
};
