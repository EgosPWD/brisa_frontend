// src/stores/auth.svelte.ts - SOLUCIÓN CORREGIDA
import type { User, AuthState, ModuloSistema } from '../../types/Usuarios_Roles/auth';
import { api } from '../../services/api';

class AuthStore {
  // ========== CONSTANTES DE LOCALSTORAGE ==========
  private readonly TOKEN_KEY = 'brisa_auth_token';
  private readonly USER_KEY = 'brisa_user_data';

  private state = $state<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // ========== GETTERS BÁSICOS ==========

  get user() {
    return this.state.user;
  }

  get token() {
    return this.state.token;
  }

  get isAuthenticated() {
    return this.state.isAuthenticated;
  }

  get isLoading() {
    return this.state.isLoading;
  }

  get permisos() {
    return this.state.user?.permisos || [];
  }

  // ========== NUEVOS GETTERS PARA PERMISOS DETALLADOS ==========

  get modulosAccesibles() {
    return this.state.user?.modulos_accesibles || [];
  }

  get accionesDisponibles() {
    return this.state.user?.acciones_disponibles || [];
  }

  get esAdministrador() {
    return this.state.user?.es_administrador || false;
  }

  get permisosPorModulo() {
    return this.state.user?.permisos_por_modulo || {};
  }

  // ========== AUTENTICACIÓN ==========

  async login(usuario: string, password: string) {
    try {
      console.log('🔐 Intentando login para:', usuario);
      
      // ✅ CORRECCIÓN: NO limpiar antes del login
      // Solo limpiar el estado en memoria (no localStorage todavía)
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;
      
      const response = await api.login(usuario, password);
      
      if (response.success && response.data) {
        const { 
          access_token, 
          usuario_id, 
          usuario: username, 
          nombres, 
          rol, 
          permisos 
        } = response.data;
        
        // ✅ PASO 1: Guardar token en localStorage PRIMERO
        localStorage.setItem(this.TOKEN_KEY, access_token);
        console.log('✅ Token guardado en localStorage');
        
        // ✅ PASO 2: Actualizar estado en memoria
        this.state.token = access_token;
        this.state.user = {
          usuario_id,
          usuario: username,
          nombres,
          rol,
          permisos
        };
        this.state.isAuthenticated = true;
        
        console.log('✅ Estado actualizado. isAuthenticated:', this.state.isAuthenticated);
        
        // ✅ PASO 3: Cargar permisos detallados
        await this.cargarPermisosDetallados();
        
        console.log('✅ Login completo para:', username);
        return response;
      }
      
      throw new Error('Respuesta de login inválida');
    } catch (error) {
      console.error('❌ Error en login:', error);
      // ✅ Solo limpiar si el login falló
      this.clearAuth();
      throw error;
    }
  }

  logout() {
    console.log('🚪 Cerrando sesión...');
    
    // Intentar cerrar sesión en el servidor
    if (this.state.token) {
      api.logout().catch((error) => {
        console.warn('⚠️ No se pudo cerrar sesión en el servidor:', error);
      });
    }
    
    // ✅ Limpiar TODO
    this.clearAuth();
    
    console.log('✅ Sesión cerrada completamente');
  }

  async init() {
    console.log('🔄 Inicializando authStore...');
    this.state.isLoading = true;
    
    try {
      // ✅ PASO 1: Buscar token en localStorage
      const token = localStorage.getItem(this.TOKEN_KEY);
      
      if (!token) {
        console.log('⚠️ No se encontró token en localStorage');
        this.state.isLoading = false;
        return;
      }

      console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

      // ✅ PASO 2: Actualizar estado con el token ANTES de verificar
      this.state.token = token;

      // ✅ PASO 3: Verificar token con el backend
      console.log('🔍 Verificando token con el backend...');
      const response = await api.getMe();
      
      if (response.success && response.data) {
        // ✅ Token válido - Actualizar usuario
        // 🔧 Extraer el rol del primer elemento del array roles
        const rolPrincipal = response.data.roles && response.data.roles.length > 0 
          ? response.data.roles[0].nombre 
          : 'Usuario';
        
        this.state.user = {
          usuario_id: response.data.id_usuario,
          usuario: response.data.usuario,
          nombres: response.data.nombres || '',
          rol: rolPrincipal,
          permisos: response.data.permisos || []
        };
        this.state.isAuthenticated = true;
        
        console.log('✅ Usuario verificado:', this.state.user.usuario);
        console.log('🎭 Rol asignado:', this.state.user.rol);
        
        // ✅ Cargar permisos detallados
        await this.cargarPermisosDetallados();
      } else {
        console.warn('⚠️ Respuesta inválida del backend');
        this.clearAuth();
      }
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      // ✅ Si falla la verificación, limpiar todo
      this.clearAuth();
    } finally {
      this.state.isLoading = false;
      console.log('✅ AuthStore inicializado. isAuthenticated:', this.state.isAuthenticated);
    }
  }

  // ========== CARGAR PERMISOS DETALLADOS ==========

  async cargarPermisosDetallados() {
    try {
      console.log('📋 Cargando permisos detallados...');
      const response = await api.getMisPermisos();
      
      if (response.success && response.data && this.state.user) {
        this.state.user = {
          ...this.state.user,
          permisos_detallados: response.data.permisos,
          permisos_por_modulo: response.data.permisos_por_modulo,
          modulos_accesibles: response.data.modulos_accesibles,
          acciones_disponibles: response.data.acciones_disponibles,
          es_administrador: response.data.es_administrador
        };
        
        console.log('✅ Permisos detallados cargados:', {
          modulos: response.data.modulos_accesibles,
          acciones: response.data.acciones_disponibles?.length || 0,
          esAdmin: response.data.es_administrador
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar permisos detallados:', error);
      // No hacemos logout, seguimos con permisos básicos
    }
  }

  // ========== VALIDACIÓN DE PERMISOS ==========

  hasPermission(permiso: string): boolean {
    return this.state.user?.permisos.includes(permiso) || false;
  }

  puedeAccederModulo(modulo: ModuloSistema): boolean {
    if (this.esAdministrador) return true;
    return this.modulosAccesibles.includes(modulo);
  }

  puedeRealizarAccion(accion: string): boolean {
    if (this.esAdministrador) return true;
    return this.accionesDisponibles.includes(accion);
  }

  getPermisosModulo(modulo: ModuloSistema): string[] {
    return this.permisosPorModulo[modulo] || [];
  }

  tienePermisoEnModulo(modulo: ModuloSistema, permiso: string): boolean {
    if (this.esAdministrador) return true;
    const permisosModulo = this.getPermisosModulo(modulo);
    return permisosModulo.includes(permiso);
  }

  // ========== HELPERS ÚTILES ==========

  getModulosMenu() {
    const modulosMenu = [
      { id: 'usuarios', nombre: 'Usuarios y Roles', icon: 'users', ruta: 'usuarios' },
      { id: 'esquelas', nombre: 'Esquelas', icon: 'document', ruta: 'esquelas' },
      { id: 'incidentes', nombre: 'Incidentes', icon: 'alert', ruta: 'incidentes' },
      { id: 'retiros_tempranos', nombre: 'Retiros Tempranos', icon: 'exit', ruta: 'retiros' },
      { id: 'reportes', nombre: 'Reportes', icon: 'chart', ruta: 'reportes' },
      { id: 'profesores', nombre: 'Profesores', icon: 'academic', ruta: 'profesores' },
      { id: 'administracion', nombre: 'Administración', icon: 'settings', ruta: 'administracion' }
    ];

    return modulosMenu.filter(modulo => 
      this.puedeAccederModulo(modulo.id as ModuloSistema)
    );
  }

  // ========== REFRESH TOKEN ==========

  async refreshToken() {
    try {
      console.log('🔄 Refrescando token...');
      const response = await api.refreshToken();
      
      if (response.success && response.data?.access_token) {
        localStorage.setItem(this.TOKEN_KEY, response.data.access_token);
        this.state.token = response.data.access_token;
        console.log('✅ Token refrescado');
        return true;
      }
      
      console.warn('⚠️ No se pudo refrescar el token');
      return false;
    } catch (error) {
      console.error('❌ Error al refrescar token:', error);
      this.clearAuth();
      return false;
    }
  }

  // ========== ✅ CLEAR AUTH MEJORADO ==========

  clearAuth() {
    console.log('🧹 Limpiando autenticación completa...');
    
    // 1. Limpiar localStorage
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      console.log('🗑️ localStorage limpiado');
    } catch (error) {
      console.error('❌ Error al limpiar localStorage:', error);
    }
    
    // 2. Resetear estado a valores iniciales
    this.state.user = null;
    this.state.token = null;
    this.state.isAuthenticated = false;
    // NO cambiar isLoading aquí, se maneja en init()
    
    console.log('✅ Estado reseteado. isAuthenticated:', this.state.isAuthenticated);
  }
}

export const authStore = new AuthStore();