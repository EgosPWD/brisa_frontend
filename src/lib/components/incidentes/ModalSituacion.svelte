<script lang="ts">
  import { onMount } from "svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import ModalVerSituaciones from "$lib/components/incidentes/ModalVerSituaciones.svelte";
  import { crearSituacion, getPermisoDirector } from "$lib/services/incidentes/situaciones";
  import { getAreas } from "$lib/services/incidentes/areas";

  export let onClose: () => void;

  let id_area: number | null = null;
  let nombre_situacion = "";
  let nivel_gravedad = "";

  let errorMsg: string | null = null;
  let areas: { id_area: number; nombre_area: string }[] = [];
  let showVerSituaciones = false;

  // ✅ Solo para aviso (NO bloquea registrar)
  let isDirector = false;

  onMount(async () => {
    // ✅ permiso real desde backend Incidentes
    try {
      const res = await getPermisoDirector();
      isDirector = !!res.isDirector;
    } catch {
      isDirector = false;
    }

    try {
      areas = await getAreas();
    } catch (error) {
      errorMsg = "Error al cargar áreas";
    }
  });

  async function registrarSituacion() {
    if (!id_area || !nombre_situacion.trim() || !nivel_gravedad.trim()) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      await crearSituacion({
        id_area,
        nombre_situacion,
        nivel_gravedad
      });

      alert("Situación registrada correctamente.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al registrar la situación.");
    }
  }

  function verSituaciones() {
    showVerSituaciones = true;
  }
</script>

<Modal onClose={onClose}>
  <h2 class="text-xl font-bold mb-6">Registrar Nueva Situación</h2>

  {#if errorMsg}
    <p class="text-red-600 text-sm mb-3">{errorMsg}</p>
  {/if}

  {#if !isDirector}
    <div class="mb-4 p-3 rounded-lg border text-sm text-gray-600 bg-gray-50">
      Nota: Solo el <b>Director</b> puede <b>editar o borrar</b> situaciones (registrar sí se permite).
    </div>
  {/if}

  <div class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-1">
      Seleccionar Área *
    </label>

    <select bind:value={id_area} class="w-full border p-2 rounded-lg text-black">
      <option value={null}>Seleccione un Área</option>
      {#each areas as area}
        <option value={area.id_area}>{area.nombre_area}</option>
      {/each}
    </select>
  </div>

  <div class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
    <input
      type="text"
      bind:value={nombre_situacion}
      class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#3AC0B8]"
      placeholder="Ej: Llanto en clase"
    />
  </div>

  <div class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-1">Nivel *</label>
    <select bind:value={nivel_gravedad} class="w-full border rounded-lg p-2 bg-white">
      <option value="" disabled selected>Selecciona gravedad</option>
      <option value="leve">Leve</option>
      <option value="grave">Grave</option>
      <option value="muy grave">Muy Grave</option>
    </select>
  </div>

  <div class="flex justify-between items-center mt-6">
    <button class="px-4 py-2 rounded-lg border text-blue-700 hover:bg-blue-100" on:click={verSituaciones}>
      Ver situaciones
    </button>

    <div class="flex gap-3">
      <button class="px-4 py-2 rounded-lg border text-gray-600" on:click={onClose}>
        Cancelar
      </button>

      <button class="px-4 py-2 rounded-lg bg-[#3AC0B8] text-white" on:click={registrarSituacion}>
        Registrar
      </button>
    </div>
  </div>
</Modal>

{#if showVerSituaciones}
  <ModalVerSituaciones onClose={() => (showVerSituaciones = false)} />
{/if}
