<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";
    import { retirosService } from "$lib/services/retiros";
    import { getIconSvg } from "$lib/components/svg";
    import StatusBadge from "$lib/components/retiros/StatusBadge.svelte";
    import {
        esApoderado,
        esRecepcionista,
        esRegente,
        esProfesor,
        puedeCrearSolicitudIndividual,
        puedeCrearSolicitudMasiva,
        puedeVerTabIndividual,
        puedeVerTabMasiva,
    } from "$lib/utils/permissions";
    import type {
        SolicitudRetiro,
        SolicitudRetiroMasivo,
    } from "$lib/types/retiros";

    let solicitudes: (SolicitudRetiro | SolicitudRetiroMasivo)[] = $state([]);
    let todasSolicitudes: (SolicitudRetiro | SolicitudRetiroMasivo)[] = $state([]);
    let loading = $state(false);
    let activeTab: "individual" | "masiva" = $state("individual");
    let filtroEstado: string | null = $state(null); // null = todas, "recibida" = pendientes, etc.

    // Permisos basados en roles
    const isApoderado = $derived(esApoderado());
    const isRecepcionista = $derived(esRecepcionista());
    const isRegente = $derived(esRegente());
    const isProfesor = $derived(esProfesor());

    // Visibilidad de tabs
    const showIndividualTab = $derived(puedeVerTabIndividual());
    const showMasivaTab = $derived(puedeVerTabMasiva());

    // Permisos de creación
    const canCreateIndividual = $derived(puedeCrearSolicitudIndividual());
    const canCreateMasiva = $derived(puedeCrearSolicitudMasiva());

    /**
     * Carga las solicitudes según el rol del usuario y el tab activo
     */
    async function loadData() {
        loading = true;
        try {
            console.log("=== CARGANDO SOLICITUDES POR ROL ===");
            console.log("👤 Usuario:", authStore.user?.usuario);
            console.log("🎭 Rol:", authStore.user?.rol);
            console.log("📑 Tab activo:", activeTab);

            if (activeTab === "individual") {
                await loadSolicitudesIndividuales();
            } else {
                await loadSolicitudesMasivas();
            }

            console.log(
                `✅ ${solicitudes.length} solicitudes cargadas para ${activeTab}`,
            );
        } catch (e) {
            console.error("❌ Error cargando solicitudes:", e);
            solicitudes = [];
        } finally {
            loading = false;
        }
    }

    /**
     * Carga solicitudes individuales según el rol
     */
    async function loadSolicitudesIndividuales() {
        if (isApoderado) {
            // 📌 APODERADO: Solo sus propias solicitudes
            console.log("👨‍👩‍👧 Apoderado - Cargando MIS solicitudes");
            todasSolicitudes = await retirosService.getMisSolicitudes();
        } else if (isRecepcionista) {
            // 📌 RECEPCIONISTA: TODAS las solicitudes (con opción de filtrar)
            console.log(
                "🧑‍💼 Recepcionista - Cargando TODAS las solicitudes",
            );
            todasSolicitudes = await retirosService.getSolicitudes();
        } else if (isRegente) {
            // 📌 REGENTE: Solicitudes derivadas a él
            console.log("👔 Regente - Cargando solicitudes derivadas");
            todasSolicitudes = await retirosService.getSolicitudesDerivadas();
        } else {
            // 📌 ADMIN u otros: Todas las solicitudes
            console.log("🔐 Admin - Cargando TODAS las solicitudes");
            todasSolicitudes = await retirosService.getSolicitudes();
        }
        aplicarFiltros();
    }

    /**
     * Carga solicitudes masivas según el rol
     */
    async function loadSolicitudesMasivas() {
        if (isProfesor) {
            // 📌 PROFESOR: Solo sus solicitudes masivas
            console.log("👨‍🏫 Profesor - Cargando MIS solicitudes masivas");
            try {
                todasSolicitudes = await retirosService.getMisSolicitudesMasivas();
            } catch {
                todasSolicitudes = [];
            }
        } else if (isRecepcionista) {
            // 📌 RECEPCIONISTA: TODAS las solicitudes masivas (con opción de filtrar)
            console.log(
                "🧑‍💼 Recepcionista - Cargando TODAS las solicitudes masivas",
            );
            todasSolicitudes = await retirosService.getSolicitudesMasivas();
        } else if (isRegente) {
            // 📌 REGENTE: Solicitudes derivadas (para aprobar/rechazar)
            console.log(
                "👔 Regente - Filtrando solicitudes masivas derivadas",
            );
            const allMasivas = await retirosService.getSolicitudesMasivas();
            todasSolicitudes = allMasivas.filter((s) => s.estado === "derivada");
        } else {
            // 📌 ADMIN u otros: Todas las solicitudes masivas
            console.log("🔐 Admin - Cargando TODAS las solicitudes masivas");
            todasSolicitudes = await retirosService.getSolicitudesMasivas();
        }
        aplicarFiltros();
    }

    /**
     * Aplica filtros a las solicitudes cargadas
     */
    function aplicarFiltros() {
        if (!filtroEstado) {
            // Sin filtro: mostrar todas
            solicitudes = todasSolicitudes;
        } else {
            // Con filtro: filtrar por estado
            solicitudes = todasSolicitudes.filter(
                (s) => s.estado === filtroEstado,
            );
        }
        console.log(
            `🔍 Filtro aplicado: ${filtroEstado || "todas"} - ${solicitudes.length} resultados`,
        );
    }

    /**
     * Cambia el filtro de estado
     */
    function cambiarFiltro(nuevoFiltro: string | null) {
        filtroEstado = nuevoFiltro;
        aplicarFiltros();
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString();
    }

    // Efecto para recargar cuando cambie el tab
    $effect(() => {
        if (activeTab) {
            filtroEstado = null; // Resetear filtro al cambiar de tab
            loadData();
        }
    });

    // Cargar al montar el componente
    onMount(() => {
        // Si es profesor, forzar tab masiva
        if (isProfesor && !showIndividualTab) {
            activeTab = "masiva";
        }
        loadData();
    });
</script>

<div class="panel">
    <!-- TITLE SECTION -->
    <div class="title-section">
        <div class="title-with-icon">
            <div class="title-icon">
                {@html getIconSvg("clock")}
            </div>
            <div>
                <h1>Retiros Tempranos</h1>
                <p>Gestión de solicitudes de salida</p>
            </div>
        </div>
    </div>

    <!-- BUTTON ROW -->
    <div class="button-row">
        {#if canCreateIndividual && activeTab === "individual"}
            <a href="/retiros/solicitudes/nueva" class="btn-primary">
                {@html getIconSvg("plus")}
                Nueva Solicitud
            </a>
        {/if}
        {#if canCreateMasiva && activeTab === "masiva"}
            <a href="/retiros/solicitudes/nueva-masiva" class="btn-primary">
                {@html getIconSvg("users")}
                Nueva Masiva
            </a>
        {/if}

        <!-- FILTROS PARA RECEPCIONISTA/ADMIN/REGENTE -->
        {#if isRecepcionista || authStore.esAdministrador}
            <div class="filter-buttons">
                <button
                    class="filter-btn"
                    class:active={filtroEstado === null}
                    onclick={() => cambiarFiltro(null)}
                    title="Mostrar todas las solicitudes"
                >
                    {@html getIconSvg("list")}
                    Todas
                </button>
                <button
                    class="filter-btn"
                    class:active={filtroEstado === "recibida"}
                    onclick={() => cambiarFiltro("recibida")}
                    title="Mostrar solo solicitudes pendientes (recibidas)"
                >
                    {@html getIconSvg("clock")}
                    Pendientes
                </button>
                <button
                    class="filter-btn"
                    class:active={filtroEstado === "derivada"}
                    onclick={() => cambiarFiltro("derivada")}
                    title="Mostrar solo solicitudes derivadas"
                >
                    {@html getIconSvg("arrow-right")}
                    Derivadas
                </button>
                <button
                    class="filter-btn"
                    class:active={filtroEstado === "aprobada"}
                    onclick={() => cambiarFiltro("aprobada")}
                    title="Mostrar solo solicitudes aprobadas"
                >
                    {@html getIconSvg("check-circle")}
                    Aprobadas
                </button>
            </div>
        {/if}
    </div>

    <!-- TABS -->
    <div class="tabs-container">
        <div class="tabs-wrapper">
            <div class="tabs">
                {#if showIndividualTab}
                    <button
                        class="tab"
                        class:active={activeTab === "individual"}
                        onclick={() => (activeTab = "individual")}
                    >
                        Individuales
                    </button>
                {/if}
                {#if showMasivaTab}
                    <button
                        class="tab"
                        class:active={activeTab === "masiva"}
                        onclick={() => (activeTab = "masiva")}
                    >
                        Masivas
                    </button>
                {/if}
            </div>
            {#if !loading}
                <div class="results-count">
                    {solicitudes.length} {solicitudes.length === 1 ? 'solicitud' : 'solicitudes'}
                    {#if filtroEstado}
                        <span class="filter-label">({filtroEstado})</span>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- CONTENT -->
    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando solicitudes...</p>
        </div>
    {:else if solicitudes.length === 0}
        <div class="empty-state">
            <p>No hay solicitudes</p>
        </div>
    {:else}
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="col-id">ID</th>
                        {#if activeTab === "individual"}
                            <th class="col-estudiante">Estudiante</th>
                        {:else}
                            <th class="col-solicitante">Solicitante</th>
                        {/if}
                        <th class="col-motivo">Motivo</th>
                        <th class="col-fecha">Salida Programada</th>
                        <th class="col-estado">Estado</th>
                        <th class="col-acciones">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {#each solicitudes as sol (sol.id_solicitud)}
                        <tr>
                            <td class="col-id">
                                <span class="font-medium"
                                    >#{sol.id_solicitud}</span
                                >
                            </td>

                            {#if activeTab === "individual"}
                                <td class="col-estudiante">
                                    <div class="font-medium">
                                        {sol.estudiante_nombre || "Estudiante"}
                                    </div>
                                    <div class="text-muted">
                                        {sol.curso_nombre ||
                                            sol.estudiante_ci ||
                                            ""}
                                    </div>
                                </td>
                            {:else}
                                <td class="col-solicitante">
                                    <div class="font-medium">
                                        {sol.solicitante_nombre ||
                                            "Solicitante"}
                                    </div>
                                </td>

                            {/if}

                            <td class="col-motivo"
                                >{sol.motivo_nombre || "Motivo"}</td
                            >
                            <td class="col-fecha"
                                >{formatDate(sol.fecha_hora_salida)}</td
                            >
                            <td class="col-estado">
                                <StatusBadge estado={sol.estado} />
                            </td>
                            <td class="col-acciones">
                                <a
                                    href="/retiros/solicitudes/{sol.id_solicitud}?tipo={activeTab}"
                                    class="icon-btn edit-btn"
                                    title="Ver detalle"
                                >
                                    {@html getIconSvg("eye")}
                                </a>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    :root {
        --cyan: #00cfe6;
        --cyan-dark: #00b3c7;
        --text: #1e293b;
        --text-secondary: #64748b;
        --muted: #94a3b8;
        --bg-light: #f1f5f9;
        --bg-white: #ffffff;
        --border-color: #e2e8f0;
    }

    .panel {
        background: var(--bg-white);
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 6px 18px rgba(25, 40, 60, 0.02);
        border: 1px solid #eef6fa;
        margin-bottom: 2rem;
    }

    .title-section {
        margin-bottom: 24px;
    }

    .title-with-icon {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .title-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #00cfe6 0%, #0db9d5 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 207, 230, 0.3);
    }

    .title-icon :global(svg) {
        width: 24px;
        height: 24px;
    }

    .title-section h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 4px;
    }

    .title-section p {
        color: var(--text-secondary);
        margin: 0;
        font-size: 0.95rem;
    }

    .button-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }

    .filter-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .filter-btn {
        background: white;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .filter-btn:hover {
        border-color: var(--cyan);
        color: var(--cyan);
        transform: translateY(-1px);
    }

    .filter-btn.active {
        background: var(--cyan);
        color: white;
        border-color: var(--cyan);
        box-shadow: 0 2px 8px rgba(0, 207, 230, 0.2);
    }

    .filter-btn :global(svg) {
        width: 16px;
        height: 16px;
    }

    .btn-primary {
        background: var(--cyan);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 10px rgba(0, 207, 230, 0.2);
        text-decoration: none;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0, 207, 230, 0.3);
        background: var(--cyan-dark);
    }

    .tabs-container {
        margin-bottom: 28px;
    }

    .tabs-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
    }

    .tabs {
        display: inline-flex;
        gap: 4px;
        background: #f8fafc;
        padding: 4px;
        border-radius: 10px;
    }

    .results-count {
        font-size: 0.9rem;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .filter-label {
        color: var(--cyan);
        font-weight: 600;
        text-transform: capitalize;
    }

    .tabs button.tab {
        padding: 8px 20px;
        border: none;
        background: transparent;
        border-radius: 8px;
        color: var(--text-secondary);
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tabs button.tab.active {
        background: white;
        color: var(--cyan);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .table-container {
        overflow-x: auto;
        border-radius: 10px;
        border: 1px solid var(--border-color);
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
    }

    .data-table th {
        text-align: left;
        padding: 14px 20px;
        background: #f8fafc;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
        padding: 14px 20px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text);
        vertical-align: middle;
    }

    .data-table tbody tr:hover {
        background: #f1f5f9;
        cursor: pointer;
    }

    .col-id {
        width: 8%;
    }

    .col-estudiante,
    .col-solicitante {
        width: 25%;
    }

    .col-cant {
        width: 8%;
        text-align: center;
    }

    .col-motivo {
        width: 20%;
    }

    .col-fecha {
        width: 20%;
    }

    .col-estado {
        width: 12%;
    }

    .col-acciones {
        width: 7%;
        text-align: center;
    }

    .font-medium {
        font-weight: 500;
        color: var(--text);
    }

    .text-muted {
        color: var(--muted);
        font-size: 0.85rem;
    }

    .badge {
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
        text-align: center;
    }

    .badge-gray {
        background: #e2e8f0;
        color: #1e293b;
        border: 1px solid #cbd5e1;
    }

    .icon-btn {
        background: none;
        border: none;
        padding: 6px;
        border-radius: 8px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .icon-btn:hover {
        background: var(--bg-light);
        color: var(--cyan);
    }

    .icon-btn.edit-btn {
        color: #00cfe6;
    }

    .icon-btn.edit-btn:hover {
        background: #e0f7fa;
        color: #00a6b8;
    }

    .icon-btn :global(svg) {
        width: 18px;
        height: 18px;
    }

    .loading-state,
    .empty-state {
        padding: 60px 20px;
        text-align: center;
        color: var(--text-secondary);
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid var(--cyan);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
