<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";
    import {
        esApoderado,
        esRecepcionista,
        esRegente,
        esProfesor,
    } from "$lib/utils/permissions";

    let { children } = $props();

    // Verificar si el usuario tiene acceso al módulo de retiros
    const tieneAcceso = $derived(
        esApoderado() ||
            esRecepcionista() ||
            esRegente() ||
            esProfesor() ||
            authStore.user?.rol === "Admin" ||
            authStore.user?.rol === "Director",
    );

    onMount(() => {
        console.log("🔍 [RETIROS LAYOUT] Verificando acceso...");
        console.log("👤 Usuario:", authStore.user?.usuario);
        console.log("🎭 Rol:", authStore.user?.rol);
        console.log("✅ Tiene acceso:", tieneAcceso);
        console.log("📋 Módulos accesibles:", authStore.modulosAccesibles);
        
        // Si no tiene acceso, redirigir al home
        if (!authStore.isLoading && !tieneAcceso) {
            console.error(
                "❌ Usuario sin acceso al módulo de retiros tempranos",
            );
            goto("/");
        } else if (tieneAcceso) {
            console.log("✅ Acceso permitido a retiros tempranos");
        }
    });
</script>

{#if authStore.isLoading}
    <div class="loading-container">
        <div class="spinner"></div>
        <p>Verificando permisos...</p>
    </div>
{:else if !tieneAcceso}
    <div class="access-denied">
        <h2>⛔ Acceso Denegado</h2>
        <p>No tienes permisos para acceder al módulo de Retiros Tempranos.</p>
        <p class="role-info">Tu rol actual: {authStore.user?.rol || "N/A"}</p>
        <a href="/" class="btn-back">Volver al inicio</a>
    </div>
{:else}
    {@render children()}
{/if}

<style>
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 16px;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top-color: #00cfe6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .loading-container p {
        color: #64748b;
        font-size: 0.95rem;
    }

    .access-denied {
        background: white;
        border-radius: 14px;
        padding: 48px;
        text-align: center;
        max-width: 500px;
        margin: 60px auto;
        box-shadow: 0 6px 18px rgba(25, 40, 60, 0.08);
    }

    .access-denied h2 {
        color: #dc2626;
        font-size: 1.75rem;
        margin-bottom: 16px;
    }

    .access-denied p {
        color: #64748b;
        margin-bottom: 12px;
    }

    .role-info {
        font-weight: 600;
        color: #1e293b;
    }

    .btn-back {
        display: inline-block;
        margin-top: 24px;
        padding: 12px 24px;
        background: #00cfe6;
        color: white;
        text-decoration: none;
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.2s;
    }

    .btn-back:hover {
        background: #00b3c7;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 207, 230, 0.3);
    }
</style>
