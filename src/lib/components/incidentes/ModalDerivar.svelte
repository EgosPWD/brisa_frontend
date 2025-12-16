<!-- src/lib/components/incidentes/ModalDerivar.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from "$lib/components/ui/Modal.svelte";
  import { crearDerivacion } from "$lib/services/incidentes/derivaciones";
  import { authStore } from '$lib/stores/Usuarios_Roles/auth.svelte';
  import { getRoles, getUsuariosPorRol } from "$lib/services/incidentes/temporal";
  import type { DerivacionCreate } from "$lib/types/incidentes/derivaciones";

  export let caso;
  export let onClose: () => void;

  // Datos base
  let id_incidente = caso.id_incidente;
  let id_quien_deriva: number; // Cambio: Inicializado en null en lugar de usar localStorage directamente, ya que ahora se obtiene dinámicamente de authService en onMount.

  // Campos del modal
  let rolSeleccionado: string | null = null;
  let id_quien_recibe: number | null = null;
  let observaciones = "";

  let cargando = false;
  let errorMsg: string | null = null;

  // Nueva variable agregada: currentUser
  // Razón: Se agrega para almacenar los datos del usuario logueado obtenidos de authService.getUserData(), como se indica en el ejemplo proporcionado.
  // Esto permite obtener id_quien_deriva dinámicamente del usuario actual en lugar de usar localStorage estáticamente.

  // Nueva variable agregada: roles
  // Razón: Array para almacenar la lista de roles fetched dinámicamente desde el backend usando getRoles().
  // Reemplaza el uso de Array.from(new Set(mockUsers.map(u => u.rol))) que era estático.
  let roles: { id: number; nombre: string }[] = [];

  // Cambio en usuariosFiltrados: Renombrado a usuariosFiltrados y ahora se carga dinámicamente.
  // Razón: En lugar de filtrar mockUsers, ahora se carga con getUsuariosPorRol cuando rolSeleccionado cambia.
  let usuariosFiltrados: { id: number; nombre: string }[] = [];

  // Nueva función agregada: loadUsuarios
  // Razón: Función asíncrona para cargar usuarios por rol cuando se selecciona un rol.
  // Se llama en la declaración reactiva $: para manejar el cambio de rolSeleccionado.
  // Esto hace que la carga sea dinámica desde el backend.
  async function loadUsuarios(rol: string) {
    try {
      usuariosFiltrados = await getUsuariosPorRol(rol);
    } catch (error) {
      errorMsg = "Error al cargar usuarios por rol";
      usuariosFiltrados = [];
    }
  }

  // Nueva declaración reactiva agregada: $: ...
  // Razón: Detecta cambios en rolSeleccionado y carga usuarios dinámicamente si hay un rol seleccionado, o limpia la lista si no.
  // Esto asegura que el segundo select se actualice automáticamente al cambiar el rol.
  $: if (rolSeleccionado) {
    loadUsuarios(rolSeleccionado);
  } else {
    usuariosFiltrados = [];
    id_quien_recibe = null; // Agregado: Resetea id_quien_recibe cuando no hay rol seleccionado, para evitar valores residuales.
  }

  // onMount agregado
  // Razón: Se usa para inicializar datos al montar el componente.
  // Obtiene el usuario actual con authService.getUserData() y setea id_quien_deriva con id_usuario.
  // Carga los roles dinámicamente con getRoles().
  // Esto hace que todo sea dinámico desde el principio, en lugar de estático.
  onMount(async () => {
    const currentUser = authStore.user;
    id_quien_deriva = currentUser?.usuario_id ?? 0; // Uso de ?? para manejar si no hay id.

    try {
      roles = await getRoles();
    } catch (error) {
      errorMsg = "Error al cargar roles";
    }
  });

  // Función enviarDerivacion: Sin cambios mayores, solo se mantiene la validación y el envío.
  // Razón: Ya era dinámica en cuanto al payload, solo se beneficia de los valores dinámicos de id_quien_deriva e id_quien_recibe.
  async function enviarDerivacion() {
    
    errorMsg = null;

    if (!rolSeleccionado) {
      errorMsg = "Debe seleccionar un rol.";
      return;
    }

    if (!id_quien_recibe || id_quien_recibe === 0) {
      errorMsg = "Debe seleccionar un usuario receptor.";
      return;
    }

    const payload: DerivacionCreate = {
      id_quien_deriva,
      id_quien_recibe,
      observaciones
    };

    try {
      cargando = true;
      await crearDerivacion(id_incidente, payload);
      cargando = false;
      onClose();
    } catch (e: any) {
      cargando = false;
      errorMsg = e.message || "Error al derivar";
    }
  }
</script>

<Modal onClose={onClose}>

  <!-- Cerrar -->
  <button
    class="absolute top-3 right-3 text-gray-600 hover:text-black font-bold"
    on:click={onClose}
  >
    ✕
  </button>

  <h2 class="text-xl font-bold mb-4">
    Derivar Incidente – #{id_incidente}
  </h2>

  <div class="mt-4 space-y-4">

    <!-- 1. Selección de ROL -->
    <div>
      <label class="font-semibold block mb-1 text-gray-700">
        Seleccionar rol del receptor
      </label>

      <select
        bind:value={rolSeleccionado}
        class="w-full border p-2 rounded-lg text-black"
      >
        <option value={null}>Seleccione un rol</option>

        <!-- Cambio: En lugar de usar roles únicos de mockUsers, ahora itera sobre roles fetched dinámicamente. -->
        <!-- Razón: Hace que los roles se carguen desde la BD, usando rol.nombre como value y display, ya que el endpoint devuelve {id, nombre} y el rol es identificado por nombre en el siguiente endpoint. -->
        {#each roles as rol}
          <option value={rol.nombre}>{rol.nombre}</option>
        {/each}
      </select>
    </div>

    <!-- 2. Selección del usuario receptor (filtrado por rol) -->
    {#if rolSeleccionado}
      <div>
        <label class="font-semibold block mb-1 text-gray-700">
          Seleccionar usuario receptor
        </label>

        <select
          bind:value={id_quien_recibe}
          class="w-full border p-2 rounded-lg text-black"
        >
          <option value={null}>Seleccione un usuario</option>

          <!-- Cambio: En lugar de usuariosFiltrados de mockUsers, ahora itera sobre usuariosFiltrados fetched dinámicamente. -->
          <!-- Razón: Usa {id, nombre} del endpoint, con value=user.id (para id_quien_recibe) y display=user.nombre. -->
          {#each usuariosFiltrados as user}
            <option value={user.id}>
              {user.nombre}
            </option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Observaciones -->
    <div>
      <label class="font-semibold block mb-1 text-gray-700">Observaciones</label>
      <textarea
        bind:value={observaciones}
        class="w-full border p-2 rounded-lg text-black"
        rows="3"
        placeholder="Ingrese observaciones opcionales..."
      ></textarea>
    </div>

    <!-- Error -->
    {#if errorMsg}
      <p class="text-red-600 text-sm">{errorMsg}</p>
    {/if}

    <!-- Enviar -->
    <button
      class="mt-4 w-full bg-[#3AC0B8] text-white py-2 rounded-lg font-semibold hover:bg-[#35ada7]"
      on:click={enviarDerivacion}
      disabled={cargando}
    >
      {cargando ? "Guardando..." : "Derivar"}
    </button>

  </div>
</Modal>