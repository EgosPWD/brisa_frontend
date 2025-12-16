<script lang="ts">
  import { onMount } from "svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import { listaAreas } from "$lib/stores/incidentes/areas";
  import { getAreas, eliminarArea, actualizarArea, getPermisoDirector } from "$lib/services/incidentes/areas";
  import type { Area } from "$lib/types/incidentes/areas";

  export let onClose: () => void;

  let cargando = true;
  let editId: number | null = null;
  let editNombre = "";
  let editDescripcion = "";
  let isDirector = false;

  onMount(async () => {
    try {
      const res = await getPermisoDirector();
      isDirector = !!res.isDirector;
    } catch {
      isDirector = false;
    }

    const data = await getAreas();
    listaAreas.set(data);
    cargando = false;
  });

  function startEdit(area: Area) {
    if (!isDirector) return;
    editId = area.id_area;
    editNombre = area.nombre_area;
    editDescripcion = area.descripcion;
  }

  function cancelEdit() {
    editId = null;
    editNombre = "";
    editDescripcion = "";
  }

  async function saveEdit(id_area: number) {
    if (!isDirector) {
      alert("Solo el Director puede editar áreas.");
      return;
    }

    try {
      const updated = await actualizarArea(id_area, {
        nombre_area: editNombre,
        descripcion: editDescripcion
      });

      listaAreas.update(items =>
        items.map(a => (a.id_area === id_area ? updated : a))
      );

      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el área.");
    }
  }

  async function borrar(id_area: number) {
    if (!isDirector) {
      alert("Solo el Director puede eliminar áreas.");
      return;
    }

    if (!confirm("¿Seguro que deseas eliminar esta área?")) return;

    try {
      await eliminarArea(id_area);
      listaAreas.update(items => items.filter(a => a.id_area !== id_area));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el área.");
    }
  }
</script>

<Modal onClose={onClose} noOverlay={true}>
  <h2 class="text-xl font-bold mb-6">Lista de Áreas Registradas</h2>

  {#if !isDirector}
    <div class="mb-4 p-3 rounded-lg border text-sm text-gray-600 bg-gray-50">
      Estás en modo lectura. Solo el <b>Director</b> puede editar o borrar.
    </div>
  {/if}

  {#if cargando}
    <p class="text-gray-500">Cargando áreas...</p>
  {:else if $listaAreas.length === 0}
    <p class="text-gray-500">No hay áreas registradas.</p>
  {:else}
    <table class="w-full border rounded-lg text-sm">
      <thead class="bg-gray-100 border-b">
        <tr>
          <th class="p-2 text-left">ID</th>
          <th class="p-2 text-left">Nombre</th>
          <th class="p-2 text-left">Descripción</th>
          <th class="p-2 text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {#each $listaAreas as area}
          <tr class="border-b hover:bg-gray-50">
            <td class="p-2">{area.id_area}</td>

            {#if editId === area.id_area}
              <td class="p-2">
                <input class="border p-1 w-full rounded" bind:value={editNombre} />
              </td>
              <td class="p-2">
                <input class="border p-1 w-full rounded" bind:value={editDescripcion} />
              </td>
              <td class="p-2 text-center">
                <button class="px-2 py-1 text-green-600 mr-2" on:click={() => saveEdit(area.id_area)}>Guardar</button>
                <button class="px-2 py-1 text-gray-600" on:click={cancelEdit}>Cancelar</button>
              </td>
            {:else}
              <td class="p-2 font-semibold">{area.nombre_area}</td>
              <td class="p-2">{area.descripcion}</td>
              <td class="p-2 text-center">
                {#if isDirector}
                  <button class="px-2 py-1 text-blue-600 mr-2" on:click={() => startEdit(area)}>Editar</button>
                  <button class="px-2 py-1 text-red-600" on:click={() => borrar(area.id_area)}>Borrar</button>
                {:else}
                  <span class="text-xs text-gray-400">Sin permisos</span>
                {/if}
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <div class="flex justify-end mt-6">
    <button on:click={onClose} class="px-4 py-2 rounded-lg border text-gray-600">
      Cerrar
    </button>
  </div>
</Modal>
