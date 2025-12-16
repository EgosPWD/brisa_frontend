<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { retirosService } from '$lib/services/retiros';
  import type { MotivoRetiro } from '$lib/types/retiros';

  let {
    value = $bindable(null),
    label = 'Motivo de Retiro',
    placeholder = 'Buscar motivo...',
    disabled = false,
    error = null,
    required = true
  }: {
    value?: number | null;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string | null;
    required?: boolean;
  } = $props();

  let motivos = $state<MotivoRetiro[]>([]);
  let loading = $state(false);
  let searchTerm = $state('');
  let isOpen = $state(false);
  let inputElement: HTMLInputElement | null = null;
  let dropdownStyle = '';

  const dispatch = createEventDispatcher();

  onMount(async () => {
    loading = true;
    try {
      motivos = await retirosService.getMotivosActivos();
      console.log('🔍 Motivos cargados:', motivos);
      console.log('🔍 Primer motivo:', motivos[0]);
    } catch (e) {
      console.error('Error loading motivos:', e);
    } finally {
      loading = false;
    }
  });

  function getFilteredMotivos() {
    return motivos.filter(m => {
      if (!searchTerm || searchTerm.trim() === '') {
        return true;
      }
      
      const term = searchTerm.toLowerCase().trim();
      const nombre = (m.nombre || '').toLowerCase();
      const descripcion = (m.descripcion || '').toLowerCase();
      
      return nombre.includes(term) || descripcion.includes(term);
    });
  }

  function openDropdown() {
    if (!disabled && inputElement) {
      const rect = inputElement.getBoundingClientRect();
      dropdownStyle = `
        position: fixed;
        top: ${rect.bottom + 4}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
      `;
      isOpen = true;
    }
  }

  function closeDropdown() {
    isOpen = false;
  }

  function selectMotivo(motivo: MotivoRetiro, e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log('✅ Motivo seleccionado:', motivo.nombre, 'ID:', motivo.id_motivo);
    
    value = motivo.id_motivo;
    searchTerm = '';
    isOpen = false;
    dispatch('change', value);
  }

  function removeMotivo() {
    value = null;
    dispatch('change', value);
  }

  function handleDropdownClick(e: MouseEvent) {
    e.stopPropagation();
  }

  const selectedMotivo = $derived(motivos.find(m => m.id_motivo === value));
</script>

<div class="w-full relative">
  <div class="form-control w-full">
    <label class="label" for="motivo-search">
      <span class="label-text">{label} {#if required}<span class="text-error">*</span>{/if}</span>
    </label>

    <!-- Display del motivo seleccionado o input de búsqueda -->
    <div class="join w-full">
      {#if value && selectedMotivo}
        <div class="selected-motivo-display" class:input-error={error}>
          <div class="selected-content">
            <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <div class="selected-info">
              <span class="selected-name">{selectedMotivo.nombre}</span>
              {#if selectedMotivo.descripcion}
                <span class="selected-descripcion">{selectedMotivo.descripcion}</span>
              {/if}
            </div>
          </div>
          <button type="button" class="btn-clear" onclick={() => removeMotivo()} title="Limpiar selección">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      {:else}
        <input
          bind:this={inputElement}
          type="text"
          id="motivo-search"
          class="input input-bordered w-full"
          class:input-error={error}
          bind:value={searchTerm}
          onfocus={openDropdown}
          onclick={openDropdown}
          {placeholder}
          {disabled}
        />
      {/if}
    </div>

    {#if error}
      <div class="label">
        <span class="label-text-alt text-error">{error}</span>
      </div>
    {/if}
  </div>

  <!-- Dropdown Results -->
  {#if isOpen && !disabled}
    {@const filteredMotivos = getFilteredMotivos()}
    
    <ul class="motivo-dropdown-fixed" style={dropdownStyle} onclick={handleDropdownClick}>
      {#each filteredMotivos as motivo, index}
        <li>
          <button 
            type="button" 
            class="motivo-item" 
            class:selected={value === motivo.id_motivo}
            onclick={(e) => selectMotivo(motivo, e)}
          >
            <div class="motivo-info">
              <div class="motivo-name">
                <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span class="font-medium">{motivo.nombre}</span>
              </div>
              {#if motivo.descripcion}
                <span class="motivo-descripcion">{motivo.descripcion}</span>
              {/if}
            </div>
            {#if value === motivo.id_motivo}
              <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            {/if}
          </button>
        </li>
      {:else}
        <li class="disabled">
          <div class="empty-state">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
            <span>No se encontraron motivos</span>
          </div>
        </li>
      {/each}
    </ul>

    <!-- Backdrop -->
    <div 
      class="fixed inset-0 z-40" 
      onclick={closeDropdown}
      onkeydown={(e) => e.key === 'Escape' && closeDropdown()}
      role="button"
      tabindex="-1"
    ></div>
  {/if}
</div>

<style>
  .motivo-dropdown-fixed {
    z-index: 9999 !important;
    max-height: 20rem;
    overflow-y: auto;
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    list-style: none;
    padding: 0.5rem;
    margin: 0;
  }

  .motivo-dropdown-fixed li {
    margin: 0;
    padding: 0;
  }

  .motivo-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    padding: 0.875rem 1rem;
    background-color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.25rem;
  }

  .motivo-item:hover {
    background: linear-gradient(135deg, #e0f7fa 0%, #e1f5fe 100%);
    transform: translateX(4px);
    box-shadow: 0 2px 4px rgba(0, 188, 212, 0.1);
  }

  .motivo-item.selected {
    background: linear-gradient(135deg, #b2ebf2 0%, #b3e5fc 100%);
    border-left: 3px solid #00bcd4;
  }

  .motivo-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .motivo-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1f2937;
  }

  .motivo-descripcion {
    font-size: 0.75rem;
    color: #6b7280;
    padding-left: 1.5rem;
  }

  .motivo-dropdown-fixed .disabled {
    padding: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: #9ca3af;
    gap: 0.5rem;
  }

  .empty-state span {
    font-style: italic;
    font-size: 0.875rem;
  }

  .selected-motivo-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%);
    border: 2px solid #00bcd4;
    border-radius: 0.5rem;
    min-height: 3rem;
  }

  .selected-motivo-display.input-error {
    border-color: #ef4444;
  }

  .selected-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .selected-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .selected-name {
    font-weight: 500;
    color: #1f2937;
    font-size: 0.95rem;
  }

  .selected-descripcion {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .btn-clear {
    padding: 0.375rem;
    background-color: transparent;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-clear:hover {
    background-color: #fee2e2;
    color: #dc2626;
  }
</style>
