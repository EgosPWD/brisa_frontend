<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";

    onMount(() => {
        // Redirigir siempre a /retiros/solicitudes
        // La lógica de permisos se maneja dentro de esa página
        goto("/retiros/solicitudes");
    });
</script>

<!-- Mensaje mientras redirige -->
<div class="loading-container">
    <p>Cargando módulo de retiros tempranos...</p>
</div>

<style>
    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        color: #64748b;
    }
</style>
