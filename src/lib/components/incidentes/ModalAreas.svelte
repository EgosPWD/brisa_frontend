<script lang="ts">
  import { onMount } from "svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import { crearArea, getPermisoDirector } from "$lib/services/incidentes/areas";
  import ModalVerAreas from "$lib/components/incidentes/ModalVerAreas.svelte";
  import { listaAreas } from "$lib/stores/incidentes/areas";

  export let onClose: () => void;

  let nombre_area = "";
  let descripcion = "";
  let showVerAreas = false;

  let isDirector = false;

  onMount(async () => {
    try {
      const res = await getPermisoDirector();
      isDirector = !!res.isDirector;
    } catch {
      isDirector = false;
    }
  });

  async function registrarArea() {
    if (!isDirector) {
      alert("Solo el Director puede registrar áreas.");
      return;
    }

    if (!nombre_area.trim()) {
      alert("El nombre del área es obligatorio.");
      return;
    }

    try {
      const nuevaArea = await crearArea({
        nombre_area,
        descripcion
      });

      listaAreas.update((items) => [...items, nuevaArea]);

      alert("Área registrada correctamente.");
      nombre_area = "";
      descripcion = "";
      onClose();
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar el área.");
    }
  }

  function verAreas() {
    showVerAreas = true;
  }
</script>

<Modal onClose={onClose}>
  <h2 class="text-xl font-bold mb-6">Registrar Nueva Área</h2>

  {#if !isDirector}
    <div class="mb-4 p-3 rounded-lg border text-sm text-gray-600 bg-gray-50">
      Solo el <b>Director</b> puede crear/editar/eliminar áreas.
    </div>
  {/if}

  <div class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-1">
      Nombre del Área *
    </label>
    <input
      type="text"
      bind:value={nombre_area}
      class="w-full border rounded-lg p-2"
      disabled={!isDirector}
    />
  </div>

  <div class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-1">
      Descripción
    </label>
    <textarea
      bind:value={descripcion}
      class="w-full border rounded-lg p-3"
      disabled={!isDirector}
    ></textarea>
  </div>

  <div class="flex justify-between items-center mt-6">
    <button
      class="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
      on:click={verAreas}
    >
      Ver áreas
    </button>

    <div class="flex gap-3">
      <button
        class="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
        on:click={onClose}
      >
        Cancelar
      </button>

      <button
        class="px-4 py-2 rounded-lg bg-[#3AC0B8] text-white hover:bg-[#34a99f]"
        on:click={registrarArea}
        disabled={!isDirector}
      >
        Registrar Área
      </button>
    </div>
  </div>
</Modal>

{#if showVerAreas}
  <ModalVerAreas onClose={() => (showVerAreas = false)} />
{/if}
