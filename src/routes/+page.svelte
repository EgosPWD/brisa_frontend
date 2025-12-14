<script lang="ts">
  import { onMount } from 'svelte';
  import { authService } from '$lib/services/Usuarios_Roles/auth';

  onMount(async () => {
    // Revisamos si hay token
    const token = authService.getToken();

    if (token) {
      try {
        // Opcional: validar token llamando al backend
        await authService.getMe();
        window.location.href = '/esquelas';
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
