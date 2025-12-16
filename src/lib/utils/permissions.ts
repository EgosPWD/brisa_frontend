// src/lib/utils/permissions.ts
import { authStore } from '$lib/stores/Usuarios_Roles/auth.svelte';

/**
 * Verifica si el usuario puede gestionar profesores (crear, editar, eliminar)
 * Solo Director y Admin tienen estos permisos
 */
export function puedeGestionarProfesores(): boolean {
    const rol = authStore.user?.rol;
    console.log('🔍 Verificando permisos - Rol del usuario:', rol);
    console.log('🔍 Usuario completo:', authStore.user);
    const puede = rol === 'Director' || rol === 'Admin';
    console.log('🔍 ¿Puede gestionar profesores?', puede);
    return puede;
}

// ============================================================================
// PERMISOS PARA RETIROS TEMPRANOS
// ============================================================================

/**
 * Verifica si el usuario es un Apoderado
 */
export function esApoderado(): boolean {
    const rol = authStore.user?.rol?.toLowerCase();
    return rol === 'apoderado';
}

/**
 * Verifica si el usuario es un Recepcionista
 */
export function esRecepcionista(): boolean {
    const rol = authStore.user?.rol?.toLowerCase();
    return rol === 'recepcionista' || rol === 'recepción';
}

/**
 * Verifica si el usuario es un Regente
 */
export function esRegente(): boolean {
    const rol = authStore.user?.rol?.toLowerCase();
    return rol === 'regente';
}

/**
 * Verifica si el usuario es un Profesor
 */
export function esProfesor(): boolean {
    const rol = authStore.user?.rol?.toLowerCase();
    return rol === 'profesor';
}

/**
 * Verifica si el usuario puede crear solicitudes individuales
 * Apoderados y Profesores pueden crear solicitudes individuales
 */
export function puedeCrearSolicitudIndividual(): boolean {
    return esApoderado() || esProfesor();
}

/**
 * Verifica si el usuario puede crear solicitudes masivas
 * Solo Recepcionistas pueden crear solicitudes masivas
 */
export function puedeCrearSolicitudMasiva(): boolean {
    return esRecepcionista();
}

/**
 * Verifica si el usuario puede ver todas las solicitudes
 * Recepcionistas y Regentes pueden ver todas las solicitudes
 */
export function puedeVerTodasLasSolicitudes(): boolean {
    return esRecepcionista() || esRegente() || authStore.user?.rol === 'Admin';
}

/**
 * Verifica si el usuario puede derivar solicitudes
 * Solo Recepcionistas pueden derivar
 */
export function puedeDerivarSolicitudes(): boolean {
    return esRecepcionista();
}

/**
 * Verifica si el usuario puede aprobar/rechazar solicitudes
 * Solo Regentes pueden aprobar o rechazar
 */
export function puedeAprobarRechazarSolicitudes(): boolean {
    return esRegente();
}

/**
 * Verifica si el usuario puede cancelar solicitudes
 * Apoderados pueden cancelar sus propias solicitudes
 * Recepcionistas y Regentes pueden cancelar cualquier solicitud
 */
export function puedeCancelarSolicitudes(): boolean {
    return esApoderado() || esRecepcionista() || esRegente();
}

/**
 * Verifica si el usuario puede ver el tab de solicitudes individuales
 * Todos excepto profesores pueden ver solicitudes individuales
 */
export function puedeVerTabIndividual(): boolean {
    return !esProfesor();
}

/**
 * Verifica si el usuario puede ver el tab de solicitudes masivas
 * Todos excepto apoderados pueden ver solicitudes masivas
 */
export function puedeVerTabMasiva(): boolean {
    return !esApoderado();
}

/**
 * Verifica si el usuario puede gestionar cursos (crear, editar, eliminar)
 * Solo Director y Admin tienen estos permisos
 */
export function puedeGestionarCursos(): boolean {
    const rol = authStore.user?.rol;
    return rol === 'Director' || rol === 'Admin';
}

/**
 * Verifica si el usuario puede gestionar materias (crear, editar, eliminar)
 * Solo Director y Admin tienen estos permisos
 */
export function puedeGestionarMaterias(): boolean {
    const rol = authStore.user?.rol;
    return rol === 'Director' || rol === 'Admin';
}

/**
 * Obtiene el mensaje de error apropiado cuando un usuario no tiene permisos
 */
export function getMensajePermisosDenegados(accion: string, modulo: string): string {
    const rol = authStore.user?.rol || 'Usuario';
    return `No tienes permisos para ${accion} ${modulo}. Solo Director y Admin pueden realizar esta acción. Tu rol actual: ${rol}`;
}

/**
 * Verifica permisos y retorna un objeto con el resultado y mensaje
 */
export function verificarPermiso(tipo: 'profesores' | 'cursos' | 'materias'): {
    permitido: boolean;
    mensaje: string;
    rol: string;
} {
    const rol = authStore.user?.rol || 'Usuario';
    let permitido = false;

    switch (tipo) {
        case 'profesores':
            permitido = puedeGestionarProfesores();
            break;
        case 'cursos':
            permitido = puedeGestionarCursos();
            break;
        case 'materias':
            permitido = puedeGestionarMaterias();
            break;
    }

    const mensaje = permitido
        ? ''
        : `Solo Director y Admin pueden gestionar ${tipo}. Tu rol actual: ${rol}`;

    return { permitido, mensaje, rol };
}

// Mensajes específicos por acción
export const MENSAJES_PERMISOS = {
    profesores: {
        crear: 'crear profesores',
        editar: 'editar profesores',
        eliminar: 'eliminar profesores',
        asignar: 'asignar materias a profesores'
    },
    cursos: {
        crear: 'crear cursos',
        editar: 'editar cursos',
        eliminar: 'eliminar cursos'
    },
    materias: {
        crear: 'crear materias',
        editar: 'editar materias',
        eliminar: 'eliminar materias'
    }
};
