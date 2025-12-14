<!-- src/lib/components/LogoutDialog.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    
    const dispatch = createEventDispatcher();
    
    function handleConfirm() {
        dispatch('confirm');
    }
    
    function handleCancel() {
        dispatch('cancel');
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal-overlay" on:click={handleCancel} role="dialog" aria-modal="true">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-dialog" on:click|stopPropagation>
            <!-- Header -->
            <div class="modal-header">
                <div class="header-content">
                    <div class="icon-container">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </div>
                    <h2>Cerrar Sesión</h2>
                </div>
                <button class="close-btn" on:click={handleCancel} aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <p class="modal-content">
                ¿Está seguro que desea cerrar sesión? Tendrá que volver a iniciar sesión para acceder a su cuenta.
            </p>

            <!-- Buttons -->
            <div class="modal-buttons">
                <button class="btn-cancel" on:click={handleCancel}>
                    Cancelar
                </button>
                <button class="btn-confirm" on:click={handleConfirm}>
                    Sí, cerrar sesión
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
   @import './LogoutDialog.css';
</style>