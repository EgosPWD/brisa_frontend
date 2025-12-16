<script lang="ts">
  import { onMount } from 'svelte';
  import { authService } from '$lib/services/Usuarios_Roles/auth';

  onMount(async () => {
    // Revisamos si hay token
    const token = authService.getToken();

    if (token) {
      try {
        // Validar token y obtener información del usuario
        const userData = await authService.getMe();
        
        // 🎯 REDIRECCIÓN BASADA EN ROL
        const userRole = userData?.data?.rol?.toLowerCase();
        
        console.log('🔍 [HOME] Usuario autenticado:', userData?.data?.usuario);
        console.log('🎭 [HOME] Rol del usuario:', userRole);
        
        // Redirigir según el rol
        if (userRole === 'apoderado') {
          console.log('👨‍👩‍👧 [HOME] Apoderado detectado - redirigiendo a retiros');
          window.location.href = '/retiros';
        } else if (userRole === 'profesor') {
          console.log('👨‍🏫 [HOME] Profesor detectado - redirigiendo a retiros');
          window.location.href = '/retiros';
        } else if (userRole === 'recepción' || userRole === 'recepcionista') {
          console.log('🧑‍💼 [HOME] Recepcionista detectado - redirigiendo a retiros');
          window.location.href = '/retiros';
        } else if (userRole === 'regente') {
          console.log('👔 [HOME] Regente detectado - redirigiendo a retiros');
          window.location.href = '/retiros';
        } else {
          console.log('📝 [HOME] Otro rol - redirigiendo a esquelas');
          window.location.href = '/esquelas';
        }
      } catch {
        // Token inválido o expirado
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  });
</script>

<div class="loading-container">
  <div class="spinner"></div>
  <p>Redirigiendo...</p>
</div>

<style>
  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
</style>
