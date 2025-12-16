<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { EstudianteSimple } from '$lib/types/api';
  import { getIconSvg } from '$lib/components/svg';

  let {
    students = [],
    value = $bindable(null),
    multiple = false,
    label = 'Estudiante',
    placeholder = 'Buscar estudiante...',
    error = null,
    disabled = false,
    required = false
  }: {
    students?: any[];
    value?: number | number[] | null;
    multiple?: boolean;
    label?: string;
    placeholder?: string;
    error?: string | null;
    disabled?: boolean;
    required?: boolean;
  } = $props();

  let searchTerm = $state('');
  let isOpen = $state(false);
  let inputElement: HTMLInputElement | null = null;
  let dropdownStyle = '';

  const dispatch = createEventDispatcher();
  
  // Computed property - se recalcula automáticamente cuando students o searchTerm cambian
  function getFilteredStudents() {
    const result = students.filter(s => {
      if (!searchTerm || searchTerm.trim() === '') {
        return true;
      }
      
      const term = searchTerm.toLowerCase().trim();
      const nombre = (s.nombre || '').toLowerCase();
      const apellido_paterno = (s.apellido_paterno || '').toLowerCase();
      const apellido_materno = (s.apellido_materno || '').toLowerCase();
      const ci = (s.ci || '').toLowerCase();
      
      return nombre.includes(term) || 
             apellido_paterno.includes(term) ||
             apellido_materno.includes(term) ||
             ci.includes(term);
    });
    
    return result;
  }
  
  // Handle outside click to close dropdown (simple version)
  function handleOutsideClick(event: MouseEvent) {
       // Implementation omitted for brevity, logic handled by blur/focus usually
  }

  function toggleDropdown() {
    if (!disabled) {
      isOpen = !isOpen;
    }
  }

  function openDropdown() {
    if (!disabled && inputElement) {
      const rect = inputElement.getBoundingClientRect();
      dropdownStyle = `
        position: fixed;
        top: ${rect.bottom + 4}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
      `;      isOpen = true;
    }
  }

  function closeDropdown() {
    isOpen = false;
  }

  function selectStudent(student: any) {
    if (multiple) {
      if (!Array.isArray(value)) value = [];
      const valArray = value as number[];
      if (!valArray.includes(student.id)) {
        value = [...valArray, student.id];
      }
    } else {
      value = student.id;
      searchTerm = ''; // Limpiar búsqueda
      isOpen = false;
    }
    dispatch('change', value);
  }

  function removeStudent(id: number) {
    if (multiple && Array.isArray(value)) {
      value = value.filter(v => v !== id);
    } else if (value === id) {
      value = null;
    }
    dispatch('change', value);
  }

  // Manejar el clic fuera del componente
  function handleBackdropClick(e: MouseEvent) {
    closeDropdown();
  }
  
  function handleDropdownClick(e: MouseEvent) {
    e.stopPropagation(); // Prevenir que el clic en el dropdown llegue al backdrop
  }

  const selectedStudents = $derived(
    multiple 
      ? students.filter(s => (value as number[])?.includes(s.id))
      : students.filter(s => s.id === value)
  );

</script>

<div class="w-full relative">
  <div class="form-control w-full">
    <label class="label" for="student-search">
      <span class="label-text">{label}</span>
    </label>

    <!-- Selected Chips Area for Multiple -->
    {#if multiple && Array.isArray(value) && value.length > 0}
      <div class="flex flex-wrap gap-2 mb-2">
        {#each selectedStudents as student}
          <div class="badge badge-primary gap-2 p-3">
            {student.nombre} {student.apellido_paterno || ''}
            <button type="button" class="cursor-pointer" on:click={() => removeStudent(student.id)}>
               {@html getIconSvg('x')} <!-- Using generic x or close if available, else plain x -->
               x
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Input / Select Trigger -->
    <div class="join w-full"> 
      {#if !multiple && value}
          <div class="selected-student-display" class:input-error={error}>
              <div class="selected-content">
                  <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <div class="selected-info">
                      <span class="selected-name">{selectedStudents[0]?.nombre} {selectedStudents[0]?.apellido_paterno || ''} {selectedStudents[0]?.apellido_materno || ''}</span>
                      {#if selectedStudents[0]?.ci}
                          <span class="selected-ci">CI: {selectedStudents[0]?.ci}</span>
                      {/if}
                  </div>
              </div>
              <button type="button" class="btn-clear" on:click={() => removeStudent(value as number)} title="Limpiar selección">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
              </button>
          </div>
      {:else}
          <input
              bind:this={inputElement}
              type="text"
              id="student-search"
              class="input input-bordered w-full"
              class:input-error={error}
              bind:value={searchTerm}
              on:focus={openDropdown}
              on:click={openDropdown}
              {placeholder}
              {disabled}
          />
      {/if}
    </div>

    {#if error}
      <label class="label">
        <span class="label-text-alt text-error">{error}</span>
      </label>
    {/if}
  </div>

  <!-- Dropdown Results - FUERA del form-control -->
  {#if isOpen && !disabled}
    {@const filteredStudents = getFilteredStudents()}
    
    <!-- Dropdown lista PRIMERO -->
    <ul class="estudiante-dropdown-fixed" style={dropdownStyle} on:click={handleDropdownClick}>
        {#each filteredStudents as student, index}
            <li>
                  <button 
                    type="button" 
                    class="student-item" 
                    class:selected={value === student.id}
                    on:click={() => selectStudent(student)}
                  >
                      <div class="student-info">
                          <div class="student-name">
                              <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                              <span class="font-medium">{student.nombre} {student.apellido_paterno || ''} {student.apellido_materno || ''}</span>
                          </div>
                          {#if student.ci}
                              <span class="student-ci">CI: {student.ci}</span>
                          {/if}
                      </div>
                      {#if value === student.id}
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
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                      <span>No se encontraron estudiantes</span>
                  </div>
              </li>
          {/each}
      </ul>

      <!-- Backdrop DESPUÉS -->
      <div 
        class="fixed inset-0 z-40" 
        on:click={closeDropdown}
        on:keydown={(e) => e.key === 'Escape' && closeDropdown()}
        role="button"
        tabindex="-1"
      ></div>
  {/if}
</div>

<style>
  .estudiante-dropdown-fixed {
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

  .estudiante-dropdown-fixed li {
    margin: 0;
    padding: 0;
  }

  .student-item {
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

  .student-item:hover {
    background: linear-gradient(135deg, #e0f7fa 0%, #e1f5fe 100%);
    transform: translateX(4px);
    box-shadow: 0 2px 4px rgba(0, 188, 212, 0.1);
  }

  .student-item.selected {
    background: linear-gradient(135deg, #b2ebf2 0%, #b3e5fc 100%);
    border-left: 3px solid #00bcd4;
  }

  .student-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .student-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1f2937;
  }

  .student-ci {
    font-size: 0.75rem;
    color: #6b7280;
    padding-left: 1.5rem;
  }

  .estudiante-dropdown-fixed .disabled {
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

  .selected-student-display {
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

  .selected-student-display.input-error {
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

  .selected-ci {
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
