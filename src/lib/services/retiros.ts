import { http } from './http';
import type {
    MotivoRetiro, MotivoRetiroCreate, MotivoRetiroUpdate,
    SolicitudRetiro, SolicitudRetiroCreate, SolicitudRetiroUpdate,
    SolicitudRetiroMasivo, SolicitudRetiroMasivoCreate, SolicitudRetiroMasivoUpdate,
    CancelarSolicitudDTO, AprobarSolicitudDTO, RechazarSolicitudDTO, RegistroSalida,
    RegistroSalidaCreate
} from '$lib/types/retiros';

const BASE_URL_MOTIVOS = 'motivos-retiro';
const BASE_URL_SOLICITUDES = 'retiros-tempranos/solicitudes';
const BASE_URL_SOLICITUDES_MASIVAS = 'retiros-tempranos/solicitudes-masivas';

export const retirosService = {
    // --- Motivos ---
    getMotivos: (params?: { skip?: number; limit?: number }) =>
        http.get<MotivoRetiro[]>(BASE_URL_MOTIVOS + http.buildQuery(params)),

    getMotivosActivos: () =>
        http.get<MotivoRetiro[]>(`${BASE_URL_MOTIVOS}/activos`),

    createMotivo: (data: MotivoRetiroCreate) =>
        http.post<MotivoRetiro>(BASE_URL_MOTIVOS + '/', data), // Slash might be needed based on FastAPI/backend strictness

    updateMotivo: (id: number, data: MotivoRetiroUpdate) =>
        http.put<MotivoRetiro>(`${BASE_URL_MOTIVOS}/${id}`, data),

    deleteMotivo: (id: number) =>
        http.del(`${BASE_URL_MOTIVOS}/${id}`),

    // --- Solicitudes Individuales ---
    getSolicitudes: (params?: { skip?: number; limit?: number }) =>
        http.get<SolicitudRetiro[]>(BASE_URL_SOLICITUDES + http.buildQuery(params)),

    getMisSolicitudes: () =>
        http.get<SolicitudRetiro[]>(`${BASE_URL_SOLICITUDES}/mis-solicitudes`),

    getSolicitud: (id: number) =>
        http.get<SolicitudRetiro>(`${BASE_URL_SOLICITUDES}/${id}`),

    getSolicitudesPendientes: () =>
        http.get<SolicitudRetiro[]>(`${BASE_URL_SOLICITUDES}/pendientes`),

    getSolicitudesDerivadas: () =>
        http.get<SolicitudRetiro[]>(`${BASE_URL_SOLICITUDES}/derivadas-a-mi`),

    createSolicitud: (data: SolicitudRetiroCreate) =>
        http.post<SolicitudRetiro>(BASE_URL_SOLICITUDES + '/', data),

    updateSolicitud: (id: number, data: SolicitudRetiroUpdate) =>
        http.put<SolicitudRetiro>(`${BASE_URL_SOLICITUDES}/${id}`, data),

    cancelarSolicitud: (id: number, data: CancelarSolicitudDTO) =>
        http.put<SolicitudRetiro>(`${BASE_URL_SOLICITUDES}/${id}/cancelar`, data),

    derivarSolicitud: (id: number, observacion?: string) =>
        http.put<SolicitudRetiro>(`${BASE_URL_SOLICITUDES}/${id}/derivar`, { observacion_derivacion: observacion }),

    aprobarSolicitud: (id: number, data: AprobarSolicitudDTO = {}) =>
        http.put(`autorizaciones-retiro/${id}/decision`, { aprobado: true, ...data }),

    rechazarSolicitud: (id: number, data: RechazarSolicitudDTO) =>
        http.put(`autorizaciones-retiro/${id}/decision`, { aprobado: false, ...data }),

    registrarSalida: (id: number, data: RegistroSalidaCreate) =>
        http.post<RegistroSalida>(`retiros-tempranos/registros-salida/individual`, { id_solicitud: id, ...data }),

    getSolicitudesPorEstudiante: (id_estudiante: number) =>
        http.get<SolicitudRetiro[]>(`${BASE_URL_SOLICITUDES}/estudiante/${id_estudiante}`),

    // --- Solicitudes Masivas ---
    getSolicitudesMasivas: (params?: { skip?: number; limit?: number }) =>
        http.get<SolicitudRetiroMasivo[]>(BASE_URL_SOLICITUDES_MASIVAS + http.buildQuery(params)),

    getMisSolicitudesMasivas: () =>
        http.get<SolicitudRetiroMasivo[]>(`${BASE_URL_SOLICITUDES_MASIVAS}/mis-solicitudes`),

    getSolicitudMasiva: (id: number) =>
        http.get<SolicitudRetiroMasivo>(`${BASE_URL_SOLICITUDES_MASIVAS}/${id}`),

    createSolicitudMasiva: (data: SolicitudRetiroMasivoCreate) =>
        http.post<SolicitudRetiroMasivo>(BASE_URL_SOLICITUDES_MASIVAS + '/', data),

    updateSolicitudMasiva: (id: number, data: SolicitudRetiroMasivoUpdate) =>
        http.put<SolicitudRetiroMasivo>(`${BASE_URL_SOLICITUDES_MASIVAS}/${id}`, data),

    cancelarSolicitudMasiva: (id: number, data: CancelarSolicitudDTO) =>
        http.put<SolicitudRetiroMasivo>(`${BASE_URL_SOLICITUDES_MASIVAS}/${id}/cancelar`, data),

    derivarSolicitudMasiva: (id: number, observacion?: string) =>
        http.put<SolicitudRetiroMasivo>(`${BASE_URL_SOLICITUDES_MASIVAS}/${id}/derivar`, { observacion_derivacion: observacion }),

    aprobarSolicitudMasiva: (id: number, data: AprobarSolicitudDTO = {}) =>
        http.put<SolicitudRetiroMasivo>(`autorizaciones-retiro/masiva/${id}/decision`, { aprobado: true, ...data }),

    rechazarSolicitudMasiva: (id: number, data: RechazarSolicitudDTO) =>
        http.put<SolicitudRetiroMasivo>(`autorizaciones-retiro/masiva/${id}/decision`, { aprobado: false, ...data }),

    registrarSalidaMasiva: (id: number, data: RegistroSalidaCreate) =>
        http.post<RegistroSalida[]>(`retiros-tempranos/registros-salida/masivo`, { id_solicitud_masiva: id, ...data }),
};
