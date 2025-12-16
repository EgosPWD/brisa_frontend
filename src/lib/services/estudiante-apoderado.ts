// Service for estudiante-apoderado relationships
import { http } from './http';

export interface EstudianteApoderadoRelacion {
    id_estudiante: number;
    id_apoderado: number;
    parentesco: string;
    es_contacto_principal: boolean;
    es_tutor_legal: boolean;
    puede_retirar: boolean;
    estudiante_nombre?: string;
    estudiante_ci?: string;
    apoderado_nombre?: string;
}

class EstudianteApoderadoService {
    /**
     * Get all students for a specific apoderado
     */
    async getEstudiantesPorApoderado(idPersona: number): Promise<EstudianteApoderadoRelacion[]> {
        // Note: Backend expects id_apoderado, but we pass id_persona
        // The backend will look up the apoderado first
        return http.get(`/estudiantes-apoderados/apoderado/${idPersona}`);
    }

    /**
     * Get all apoderados for a specific student
     */
    async getApoderadosPorEstudiante(idEstudiante: number): Promise<EstudianteApoderadoRelacion[]> {
        return http.get(`/estudiantes-apoderados/estudiante/${idEstudiante}`);
    }

    /**
     * Get contacto principal for a student
     */
    async getContactoPrincipal(idEstudiante: number): Promise<EstudianteApoderadoRelacion> {
        return http.get(`/estudiantes-apoderados/estudiante/${idEstudiante}/contacto-principal`);
    }
}

export const estudianteApoderadoService = new EstudianteApoderadoService();
