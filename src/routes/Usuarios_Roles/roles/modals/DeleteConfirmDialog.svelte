<!-- src/lib/components/DeleteConfirmDialog.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    export let title = "Confirmar Eliminación";
    export let message = "¿Está seguro que desea eliminar este elemento?";
    export let itemName = ""; // El nombre del rol o item a eliminar
    export let warningText = "Esta acción no se puede deshacer.";
    export let confirmButtonText = "Sí, eliminar";
    export let cancelButtonText = "Cancelar";
    
    const dispatch = createEventDispatcher();
    
    function handleConfirm() {
        dispatch('confirm');
    }
    
    function handleCancel() {
        dispatch('cancel');
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if show}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" on:click={handleCancel} role="dialog" aria-modal="true">
        <div class="modal-dialog delete-dialog" on:click|stopPropagation>
            <!-- Header con icono de advertencia -->
            <div class="modal-header">
                <div class="header-content">
                    <div class="icon-container warning">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <h2>{title}</h2>
                </div>
                <button class="close-btn" on:click={handleCancel} aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="modal-content">
                <p class="message">{message}</p>
                
                {#if itemName}
                    <div class="item-highlight">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span>{itemName}</span>
                    </div>
                {/if}
                
                <p class="warning-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {warningText}
                </p>
            </div>

            <!-- Buttons -->
            <div class="modal-buttons">
                <button class="btn-cancel" on:click={handleCancel}>
                    {cancelButtonText}
                </button>
                <button class="btn-confirm btn-danger" on:click={handleConfirm}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    {confirmButtonText}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @import './styles/DeleteConfirmDialog.css';   
</style>