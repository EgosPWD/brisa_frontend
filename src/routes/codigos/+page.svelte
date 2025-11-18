<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import type { CodigoEsquela, CodigoEsquelaCreate, TipoCodigoEsquela } from '$lib/types/api.js';
  import './Codigopage.css';
  import { getIconSvg } from '$lib/components/svg.js';

  let codigos: CodigoEsquela[] = [];
  let loading = true;
  let error = '';
  
  // Modal states
  let showCreateModal = false;
  let showEditModal = false;
  let editingCodigo: CodigoEsquela | null = null;
  
  // Form data
  let formData: CodigoEsquelaCreate = {
    tipo: 'reconocimiento',
    codigo: '',
    descripcion: ''
  };
  
  // Filters
  let tipoFilter: TipoCodigoEsquela | null = null;
  let searchQuery = '';

  onMount(async () => {
    await loadCodigos();
  });

  async function loadCodigos() {
    try {
      loading = true;
      error = '';
      codigos = await apiClient.getCodigosEsquelas(tipoFilter || undefined);
    } catch (err: any) {
      console.error('Error cargando códigos:', err);
      error = err.message || 'Error cargando códigos';
      codigos = [];
    } finally {
      loading = false;
    }
  }

  function openCreateModal() {
    formData = {
      tipo: 'reconocimiento',
      codigo: '',
      descripcion: ''
    };
    showCreateModal = true;
  }

  function openEditModal(codigo: CodigoEsquela) {
    editingCodigo = codigo;
    formData = {
      tipo: codigo.tipo,
      codigo: codigo.codigo,
      descripcion: codigo.descripcion
    };
    showEditModal = true;
  }

  function closeModals() {
    showCreateModal = false;
    showEditModal = false;
    editingCodigo = null;
    formData = {
      tipo: 'reconocimiento',
      codigo: '',
      descripcion: ''
    };
  }

  async function handleCreate() {
    try {
      if (!formData.codigo.trim() || !formData.descripcion.trim()) {
        alert('Por favor complete todos los campos');
        return;
      }

      await apiClient.createCodigoEsquela(formData);
      await loadCodigos();
      closeModals();
    } catch (err: any) {
      console.error('Error creando código:', err);
      alert('Error al crear el código: ' + (err.message || 'Error desconocido'));
    }
  }

  async function handleUpdate() {
    try {
      if (!editingCodigo) return;
      
      if (!formData.codigo.trim() || !formData.descripcion.trim()) {
        alert('Por favor complete todos los campos');
        return;
      }

      await apiClient.updateCodigoEsquela(editingCodigo.id_codigo, formData);
      await loadCodigos();
      closeModals();
    } catch (err: any) {
      console.error('Error actualizando código:', err);
      alert('Error al actualizar el código: ' + (err.message || 'Error desconocido'));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Está seguro de que desea eliminar este código?')) {
      return;
    }

    try {
      await apiClient.deleteCodigoEsquela(id);
      await loadCodigos();
    } catch (err: any) {
      console.error('Error eliminando código:', err);
      alert('Error al eliminar el código: ' + (err.message || 'Error desconocido'));
    }
  }

  function filterCodigos(): CodigoEsquela[] {
    let filtered = codigos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.codigo.toLowerCase().includes(query) ||
        c.descripcion.toLowerCase().includes(query) ||
        c.tipo.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  function getTipoIcon(tipo: string): string {
    return tipo === 'reconocimiento' ? 'trophy' : 'clipboard-list';
  }

  function getTipoColor(tipo: string): string {
    return tipo === 'reconocimiento' ? 'tipo-reconocimiento' : 'tipo-orientacion';
  }
</script>

<div class="codigos-container">
  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="titulo">Códigos de Esquela</h1>
      <p class="subtitulo">Gestiona los códigos de reconocimiento y orientación</p>
    </div>
    <button class="btn-nueva" on:click={openCreateModal}>
      <span class="icon-inline">{@html getIconSvg('plus')}</span>
      Nuevo Código
    </button>
  </div>

  <!-- Filters -->
  <div class="filters-panel">
    <div class="filter-row">
      <div class="search-box">
        <span class="icon-inline">{@html getIconSvg('search')}</span>
        <input 
          type="text" 
          placeholder="Buscar por código, descripción o tipo..."
          bind:value={searchQuery}
        />
      </div>

      <div class="filter-group">
        <label for="tipo-filter">Filtrar por tipo:</label>
        <select id="tipo-filter" bind:value={tipoFilter} on:change={loadCodigos}>
          <option value={null}>Todos</option>
          <option value="reconocimiento">Reconocimiento</option>
          <option value="orientacion">Orientación</option>
        </select>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando códigos...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>
        <span class="icon-inline">{@html getIconSvg('alert-circle')}</span>
        {error}
      </p>
      <button class="btn-retry" on:click={loadCodigos}>Reintentar</button>
    </div>
  {:else}
    <!-- Códigos Table -->
    <div class="table-container">
      <table class="codigos-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each filterCodigos() as codigo}
            <tr>
              <td class="id-cell">{codigo.id_codigo}</td>
              <td class="codigo-cell">
                <span class="codigo-badge">
                  <span class="icon-inline">{@html getIconSvg('code')}</span>
                  {codigo.codigo}
                </span>
              </td>
              <td>
                <span class="tipo-badge {getTipoColor(codigo.tipo)}">
                  <span class="icon-inline">{@html getIconSvg(getTipoIcon(codigo.tipo))}</span>
                  {codigo.tipo}
                </span>
              </td>
              <td class="descripcion-cell">{codigo.descripcion}</td>
              <td class="actions-cell">
                <button 
                  class="btn-icon btn-edit" 
                  on:click={() => openEditModal(codigo)}
                  title="Editar"
                  aria-label="Editar código"
                >
                  {@html getIconSvg('edit')}
                </button>
                <button 
                  class="btn-icon btn-delete" 
                  on:click={() => handleDelete(codigo.id_codigo)}
                  title="Eliminar"
                  aria-label="Eliminar código"
                >
                  {@html getIconSvg('trash')}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filterCodigos().length === 0}
        <div class="no-results">
          <p>No se encontraron códigos.</p>
        </div>
      {/if}
    </div>

    <!-- Totales -->
    <div class="stats-footer">
      <div class="stat-item">
        <span class="stat-label">Total de códigos:</span>
        <span class="stat-value">{codigos.length}</span>
      </div>
      <div class="stat-item">
        <span class="icon-inline">{@html getIconSvg('trophy')}</span>
        <span class="stat-label">Reconocimientos:</span>
        <span class="stat-value">{codigos.filter(c => c.tipo === 'reconocimiento').length}</span>
      </div>
      <div class="stat-item">
        <span class="icon-inline">{@html getIconSvg('clipboard-list')}</span>
        <span class="stat-label">Orientaciones:</span>
        <span class="stat-value">{codigos.filter(c => c.tipo === 'orientacion').length}</span>
      </div>
    </div>
  {/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={closeModals}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Crear Nuevo Código</h2>
        <button class="btn-close" on:click={closeModals} aria-label="Cerrar">
          {@html getIconSvg('x')}
        </button>
      </div>

      <form on:submit|preventDefault={handleCreate}>
        <div class="form-group">
          <label for="create-tipo">Tipo:</label>
          <select id="create-tipo" bind:value={formData.tipo} required>
            <option value="reconocimiento">Reconocimiento</option>
            <option value="orientacion">Orientación</option>
          </select>
        </div>

        <div class="form-group">
          <label for="create-codigo">Código:</label>
          <input 
            id="create-codigo"
            type="text" 
            bind:value={formData.codigo}
            placeholder="Ej: R01, O01"
            required
          />
        </div>

        <div class="form-group">
          <label for="create-descripcion">Descripción:</label>
          <textarea 
            id="create-descripcion"
            bind:value={formData.descripcion}
            placeholder="Describe el código..."
            rows="3"
            required
          ></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" on:click={closeModals}>
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            <span class="icon-inline">{@html getIconSvg('plus')}</span>
            Crear Código
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && editingCodigo}
  <div class="modal-overlay" on:click={closeModals}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Editar Código</h2>
        <button class="btn-close" on:click={closeModals} aria-label="Cerrar">
          {@html getIconSvg('x')}
        </button>
      </div>

      <form on:submit|preventDefault={handleUpdate}>
        <div class="form-group">
          <label for="edit-tipo">Tipo:</label>
          <select id="edit-tipo" bind:value={formData.tipo} required>
            <option value="reconocimiento">Reconocimiento</option>
            <option value="orientacion">Orientación</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-codigo">Código:</label>
          <input 
            id="edit-codigo"
            type="text" 
            bind:value={formData.codigo}
            placeholder="Ej: R01, O01"
            required
          />
        </div>

        <div class="form-group">
          <label for="edit-descripcion">Descripción:</label>
          <textarea 
            id="edit-descripcion"
            bind:value={formData.descripcion}
            placeholder="Describe el código..."
            rows="3"
            required
          ></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" on:click={closeModals}>
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            <span class="icon-inline">{@html getIconSvg('edit')}</span>
            Actualizar Código
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}


