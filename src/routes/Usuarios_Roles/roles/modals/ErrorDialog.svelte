<!-- src/lib/components/ErrorDialog.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    let { 
        show = $bindable(false),
        title = "Error",
        message = "",
        errorCode = null as number | null,
        details = "",
        buttonText = "Entendido"
    } = $props();
    
    const dispatch = createEventDispatcher();
    
    function handleClose() {
        show = false;
        dispatch('close');
    }
    
    // Determinar el tipo de error por código
    const errorType = $derived.by(() => {
        if (!errorCode) return 'error';
        if (errorCode === 401) return 'auth';
        if (errorCode === 403) return 'forbidden';
        if (errorCode === 404) return 'notfound';
        if (errorCode >= 500) return 'server';
        return 'error';
    });
    
    // Iconos y colores según tipo de error
    const errorConfig = $derived.by(() => {
        const configs = {
            auth: {
                bgColor: '#fef3c7',
                iconColor: '#d97706',
                buttonColor: '#f59e0b'
            },
            forbidden: {
                bgColor: '#fee2e2',
                iconColor: '#dc2626',
                buttonColor: '#ef4444'
            },
            notfound: {
                bgColor: '#dbeafe',
                iconColor: '#2563eb',
                buttonColor: '#3b82f6'
            },
            server: {
                bgColor: '#fce7f3',
                iconColor: '#db2777',
                buttonColor: '#ec4899'
            },
            error: {
                bgColor: '#fee2e2',
                iconColor: '#dc2626',
                buttonColor: '#ef4444'
            }
        };
        return configs[errorType];
    });
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if show}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore event_directive_deprecated -->
    <div class="modal-overlay" on:click={handleClose} role="dialog" aria-modal="true">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore event_directive_deprecated -->
        <div class="modal-dialog" on:click|stopPropagation>
            <!-- Header -->
            <div class="modal-header">
                <div class="header-content">
                    <div class="icon-container" style="background: {errorConfig.bgColor};">
                        {#if errorType === 'auth'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={errorConfig.iconColor} stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        {:else if errorType === 'forbidden'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={errorConfig.iconColor} stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                        {:else if errorType === 'notfound'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={errorConfig.iconColor} stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                                <line x1="11" y1="8" x2="11" y2="14"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                        {:else if errorType === 'server'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={errorConfig.iconColor} stroke-width="2">
                                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                                <line x1="6" y1="6" x2="6.01" y2="6"/>
                                <line x1="6" y1="18" x2="6.01" y2="18"/>
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={errorConfig.iconColor} stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        {/if}
                    </div>
                    <h2>{title}</h2>
                </div>
                <button class="close-btn" on:click={handleClose} aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="modal-content">
                <p class="message">{message}</p>
                
                {#if errorCode}
                    <div class="error-code" style="border-color: {errorConfig.buttonColor}; background: {errorConfig.bgColor};">
                        <span style="color: {errorConfig.iconColor};">Código de error: {errorCode}</span>
                    </div>
                {/if}
                
                {#if details}
                    <div class="details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>{details}</span>
                    </div>
                {/if}
            </div>

            <!-- Button -->
            <div class="modal-footer">
                <button 
                    class="btn-close" 
                    class:btn-auth={errorType === 'auth'}
                    class:btn-forbidden={errorType === 'forbidden'}
                    class:btn-notfound={errorType === 'notfound'}
                    class:btn-server={errorType === 'server'}
                    class:btn-error={errorType === 'error'}
                    on:click={handleClose}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @import './styles/ErrorDialog.css';
</style>