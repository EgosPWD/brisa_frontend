// Cliente HTTP para consumir la API de FastAPI
import type { 
  ApiResponse, 
  ApiError, 
  EsquelaResponse, 
  EsquelaCreate, 
  CodigoEsquela, 
  CodigoEsquelaCreate, 
  CodigoEsquelaUpdate,
  TipoCodigoEsquela,
  Estudiante,
  Profesor,
  Registrador
} from '../types/api.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private buildQuery(params?: Record<string, any>) {
    if (!params) return '';
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return qs ? `?${qs}` : '';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const token = localStorage.getItem('token');
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP Error: ${response.status}`,
          details: errorData,
          status: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      
      throw {
        message: 'Error de conexión. Verifique su conexión a internet.',
        details: error,
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Health endpoints
  async healthCheck(): Promise<string> {
    return this.get<string>('/health');
  }

  async getStatus(): Promise<any> {
    return this.get<any>('/status');
  }

  // Esquelas endpoints
  // List esquelas with optional filters and pagination
  async getEsquelas(params?: Record<string, any>): Promise<any> {
    const qs = this.buildQuery(params);
    return this.get<any>(`/esquelas/${qs}`);
  }

  async createEsquela(esquela: EsquelaCreate): Promise<EsquelaResponse> {
    return this.post<EsquelaResponse>('/esquelas/', esquela);
  }

  async getEsquela(id: number): Promise<EsquelaResponse> {
    return this.get<EsquelaResponse>(`/esquelas/${id}`);
  }

  async deleteEsquela(id: number): Promise<string> {
    return this.delete<string>(`/esquelas/${id}`);
  }

  // Códigos de Esquela endpoints
  async getCodigosEsquelas(tipo?: TipoCodigoEsquela): Promise<CodigoEsquela[]> {
    const queryParam = tipo ? `?tipo=${tipo}` : '';
    return this.get<CodigoEsquela[]>(`/codigos-esquelas/${queryParam}`);
  }

  async createCodigoEsquela(codigo: CodigoEsquelaCreate): Promise<CodigoEsquela> {
    return this.post<CodigoEsquela>('/codigos-esquelas/', codigo);
  }

  async getCodigoEsquela(id: number): Promise<CodigoEsquela> {
    return this.get<CodigoEsquela>(`/codigos-esquelas/${id}`);
  }

  async updateCodigoEsquela(id: number, codigo: CodigoEsquelaUpdate): Promise<CodigoEsquela> {
    return this.put<CodigoEsquela>(`/codigos-esquelas/${id}`, codigo);
  }

  async deleteCodigoEsquela(id: number): Promise<string> {
    return this.delete<string>(`/codigos-esquelas/${id}`);
  }

  // Estudiantes endpoints
  async getEstudiantes(): Promise<Estudiante[]> {
    return this.get<Estudiante[]>('/estudiantes/');
  }

  async getEstudiante(id: number): Promise<Estudiante> {
    return this.get<Estudiante>(`/estudiantes/${id}`);
  }

  // Profesores endpoints
  async getProfesores(): Promise<Profesor[]> {
    return this.get<Profesor[]>('/profesores/');
  }

  async getProfesor(id: number): Promise<Profesor> {
    return this.get<Profesor>(`/profesores/${id}`);
  }

  // Registradores endpoints
  async getRegistradores(): Promise<Registrador[]> {
    return this.get<Registrador[]>('/registradores/');
  }

  async getRegistrador(id: number): Promise<Registrador> {
    return this.get<Registrador>(`/registradores/${id}`);
  }

  // Courses endpoints
  async getCourses(): Promise<any> {
    return this.get<any>('/courses/');
  }

  async getCourse(id: number): Promise<any> {
    return this.get<any>(`/courses/${id}`);
  }

  async getCourseStudents(courseId: number, params?: Record<string, any>): Promise<any> {
    const qs = this.buildQuery(params);
    return this.get<any>(`/courses/${courseId}/students${qs}`);
  }

  async getCourseTeachers(courseId: number, params?: Record<string, any>): Promise<any> {
    const qs = this.buildQuery(params);
    return this.get<any>(`/courses/${courseId}/teachers${qs}`);
  }

  // Aggregations & reports
  async getEsquelasAggregateByCourse(year?: number): Promise<any> {
    const qs = this.buildQuery({ year });
    return this.get<any>(`/esquelas/aggregate/by-course${qs}`);
  }

  async getEsquelasAggregateByPeriod(group_by: string = 'year'): Promise<any> {
    const qs = this.buildQuery({ group_by });
    return this.get<any>(`/esquelas/aggregate/by-period${qs}`);
  }

  async getStudentEsquelas(studentId: number, params?: Record<string, any>): Promise<any> {
    const qs = this.buildQuery(params);
    return this.get<any>(`/students/${studentId}/esquelas${qs}`);
  }

  async getReportsRanking(params: Record<string, any>): Promise<any> {
    const qs = this.buildQuery(params);
    return this.get<any>(`/reports/ranking${qs}`);
  }
}

export const apiClient = new ApiClient();
