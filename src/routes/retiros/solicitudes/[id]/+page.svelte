<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { retirosService } from "$lib/services/retiros";
    import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";
    import StatusBadge from "$lib/components/retiros/StatusBadge.svelte";
    import { getIconSvg } from "$lib/components/svg";

    const id = Number($page.params.id);
    const tipo = $page.url.searchParams.get("tipo") || "individual";

    let solicitud: any = $state(null);
    let loading = $state(true);
    let processing = $state(false);

    // Role helpers
    const userRole = $derived(authStore.user?.rol);
    const isRegente = $derived(
        userRole?.toLowerCase() === "regente" ||
            userRole?.toLowerCase() === "director",
    );
    const isRecepcionista = $derived(
        userRole?.toLowerCase() === "recepcionista" ||
            userRole?.toLowerCase() === "recepción",
    );
    const isApoderado = $derived(userRole?.toLowerCase().includes("apoderado"));
    const isProfesor = $derived(userRole?.toLowerCase() === "profesor");
    const isAdmin = $derived(authStore.esAdministrador);

    // Debug roles
    $effect(() => {
        console.log("🔍 Debug Roles:", {
            userRole,
            userRoleLower: userRole?.toLowerCase(),
            isRegente,
            isRecepcionista,
            isApoderado,
            isProfesor,
            isAdmin,
            estado: solicitud?.estado
        });
    });

    async function loadData() {
        loading = true;
        try {
            if (tipo === "individual") {
                solicitud = await retirosService.getSolicitud(id);
            } else {
                solicitud = await retirosService.getSolicitudMasiva(id);
            }
            console.log("Solicitud Loaded:", solicitud);
        } catch (e) {
            console.error("Error fetching solicitud:", e);
        } finally {
            loading = false;
        }
    }

    onMount(loadData);

    async function handleAction(
        action:
            | "derivar"
            | "aprobar"
            | "rechazar"
            | "cancelar"
            | "registrar_salida",
    ) {
        if (
            !confirm(
                `¿Está seguro de ${action.replace("_", " ")} esta solicitud?`,
            )
        )
            return;

        processing = true;
        try {
            if (tipo === "individual") {
                if (action === "derivar") {
                    const obs = prompt("Observación de derivación (opcional):") || "";
                    await retirosService.derivarSolicitud(id, obs);
                }
                if (action === "aprobar") {
                    await retirosService.aprobarSolicitud(id, {
                        observacion: "Aprobado",
                    });
                }
                if (action === "rechazar") {
                    const just = prompt("Justificación:");
                    if (!just) {
                        processing = false;
                        return;
                    }
                    await retirosService.rechazarSolicitud(id, {
                        justificacion: just,
                    });
                }
                if (action === "cancelar") {
                    const mot = prompt("Motivo de cancelación:");
                    if (!mot) {
                        processing = false;
                        return;
                    }
                    await retirosService.cancelarSolicitud(id, {
                        motivo_cancelacion: mot,
                    });
                }
                if (action === "registrar_salida") {
                    const obs = prompt("Observaciones (opcional):") || "Salida registrada";
                    await retirosService.registrarSalida(id, {
                        observaciones: obs,
                    });
                }
            } else {
                if (action === "derivar") {
                    const obs = prompt("Observación de derivación (opcional):") || "";
                    await retirosService.derivarSolicitudMasiva(id, obs);
                }
                if (action === "aprobar") {
                    await retirosService.aprobarSolicitudMasiva(id, {
                        observacion: "Aprobado",
                    });
                }
                if (action === "rechazar") {
                    const just = prompt("Justificación:");
                    if (!just) {
                        processing = false;
                        return;
                    }
                    await retirosService.rechazarSolicitudMasiva(id, {
                        justificacion: just,
                    });
                }
                if (action === "cancelar") {
                    const mot = prompt("Motivo de cancelación:");
                    if (!mot) {
                        processing = false;
                        return;
                    }
                    await retirosService.cancelarSolicitudMasiva(id, {
                        motivo_cancelacion: mot,
                    });
                }
                if (action === "registrar_salida") {
                    const obs = prompt("Observaciones (opcional):") || "Salida masiva registrada";
                    await retirosService.registrarSalidaMasiva(id, {
                        observaciones: obs,
                    });
                }
            }
            await loadData();
            alert(`Acción "${action.replace("_", " ")}" completada exitosamente`);
        } catch (e: any) {
            console.error("Error al procesar acción:", e);
            const errorMsg = e?.response?.data?.detail || e?.message || "Error desconocido";
            alert(`Error al procesar acción: ${errorMsg}`);
        } finally {
            processing = false;
        }
    }
</script>

<div class="detail-container">
    <!-- Back Button -->
    <div class="back-button">
        <a
            href="/retiros/solicitudes?tab={tipo === 'individual'
                ? 'individual'
                : 'masiva'}"
        >
            {@html getIconSvg("arrow-left")}
            Volver al listado
        </a>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando solicitud...</p>
        </div>
    {:else if !solicitud}
        <div class="error-state">
            <p>Solicitud no encontrada</p>
        </div>
    {:else}
        <!-- Main Panel -->
        <div class="detail-panel">
            <!-- Color Bar -->
            <div class="color-bar"></div>

            <!-- Header -->
            <div class="panel-header">
                <div>
                    <h1>Solicitud #{solicitud.id_solicitud}</h1>
                    <p class="created-date">
                        Created on {new Date(
                            solicitud.fecha_creacion,
                        ).toLocaleString()}
                    </p>
                </div>
                <StatusBadge estado={solicitud.estado} />
            </div>

            <!-- Content Grid -->
            <div class="content-grid">
                <!-- Left Column -->
                <div class="left-column">
                    <!-- Info Section -->
                    <div class="info-card">
                        <div class="card-header">
                            {@html getIconSvg("clipboard")}
                            <h3>Información del Retiro</h3>
                        </div>
                        <div class="card-body">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Motivo</label>
                                    <p>
                                        {solicitud.motivo_nombre ||
                                            "Sin motivo"}
                                    </p>
                                </div>
                                <div class="info-item">
                                    <label>Salida Programada</label>
                                    <p>
                                        {new Date(
                                            solicitud.fecha_hora_salida,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                {#if solicitud.fecha_hora_retorno_previsto}
                                    <div class="info-item">
                                        <label>Retorno Previsto</label>
                                        <p>
                                            {new Date(
                                                solicitud.fecha_hora_retorno_previsto,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                {/if}
                                {#if solicitud.solicitante_nombre}
                                    <div class="info-item">
                                        <label>Solicitante</label>
                                        <p>{solicitud.solicitante_nombre}</p>
                                    </div>
                                {/if}
                            </div>

                            {#if solicitud.observacion}
                                <div class="observations">
                                    <label>Observaciones</label>
                                    <p>"{solicitud.observacion}"</p>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Students Section -->
                    <div class="info-card">
                        <div class="card-header">
                            {@html getIconSvg("users")}
                            <h3>
                                {tipo === "individual"
                                    ? "Estudiante"
                                    : `Estudiantes (${solicitud.cantidad_estudiantes || 0})`}
                            </h3>
                        </div>
                        <div class="card-body students-body">
                            {#if tipo === "individual"}
                                <div class="student-item">
                                    <div class="student-avatar">
                                        {solicitud.estudiante_nombre
                                            ? solicitud.estudiante_nombre[0]
                                            : "E"}
                                    </div>
                                    <div class="student-info">
                                        <p class="student-name">
                                            {solicitud.estudiante_nombre}
                                        </p>
                                        <p class="student-meta">
                                            {solicitud.curso_nombre ||
                                                "Sin curso"} • {solicitud.estudiante_ci ||
                                                "Sin CI"}
                                        </p>
                                    </div>
                                </div>
                            {:else if solicitud.detalles && solicitud.detalles.length > 0}
                                {#each solicitud.detalles as detalle}
                                    <div class="student-item">
                                        <div class="student-avatar">
                                            {detalle.estudiante_nombre
                                                ? detalle.estudiante_nombre[0]
                                                : "#"}
                                        </div>
                                        <div class="student-info">
                                            <p class="student-name">
                                                {detalle.estudiante_nombre}
                                            </p>
                                            <p class="student-meta">
                                                {detalle.curso_nombre || "N/A"} •
                                                CI: {detalle.estudiante_ci ||
                                                    "N/A"}
                                            </p>
                                            {#if detalle.observacion_individual}
                                                <p class="student-obs">
                                                    {detalle.observacion_individual}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            {:else}
                                <p class="empty-text">
                                    No hay detalles de estudiantes disponibles.
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Right Column (Sidebar) -->
                <div class="right-column">
                    <!-- Evidence -->
                    <div class="sidebar-card">
                        <h4>Evidencia</h4>
                        <div class="evidence-box">
                            {#if solicitud.foto_evidencia}
                                {@const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                                {@const baseUrl = apiUrl.replace(/\/api$/, '')}
                                {@const imageUrl = solicitud.foto_evidencia.startsWith('http') 
                                    ? solicitud.foto_evidencia 
                                    : solicitud.foto_evidencia.startsWith('/')
                                    ? `${baseUrl}${solicitud.foto_evidencia}`
                                    : `${baseUrl}/uploads/retiros_tempranos/evidencias/${solicitud.foto_evidencia}`}
                                <img
                                    src={imageUrl}
                                    alt="Evidencia"
                                    onerror={(e) =>
                                        (e.currentTarget.src =
                                            "https://placehold.co/400x300?text=No+Image")}
                                />
                            {:else}
                                <div class="no-evidence">
                                    <span>📷</span>
                                    <span>No Image</span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="sidebar-card">
                        <h4>Acciones Disponibles</h4>
                        <div class="actions-list">
                            <!-- APODERADO/PROFESOR: Cancelar -->
                            {#if (isApoderado || isProfesor) && (solicitud.estado === "recibida" || solicitud.estado === "derivada")}
                                <button
                                    class="action-btn danger"
                                    onclick={() => handleAction("cancelar")}
                                    disabled={processing}
                                >
                                    {@html getIconSvg("x-circle")} Cancelar Solicitud
                                </button>
                            {/if}

                            <!-- RECEPCIONISTA: Derivar (estado recibida) -->
                            {#if (isRecepcionista || isAdmin) && solicitud.estado === "recibida"}
                                <button
                                    class="action-btn warning"
                                    onclick={() => handleAction("derivar")}
                                    disabled={processing}
                                >
                                    {@html getIconSvg("arrow-right")} Derivar al Regente
                                </button>
                            {/if}

                            <!-- RECEPCIONISTA: Registrar Salida (estado aprobada) -->
                            {#if (isRecepcionista || isAdmin) && solicitud.estado === "aprobada"}
                                <button
                                    class="action-btn success"
                                    onclick={() => handleAction("registrar_salida")}
                                    disabled={processing}
                                >
                                    {@html getIconSvg("check-circle")} Registrar Salida
                                </button>
                            {/if}

                            <!-- RECEPCIONISTA: Cancelar -->
                            {#if isRecepcionista && (solicitud.estado === "recibida" || solicitud.estado === "derivada")}
                                <button
                                    class="action-btn danger"
                                    onclick={() => handleAction("cancelar")}
                                    disabled={processing}
                                >
                                    {@html getIconSvg("x-circle")} Cancelar Solicitud
                                </button>
                            {/if}

                            <!-- REGENTE: Aprobar/Rechazar (estado derivada) -->
                            {#if (isRegente || isAdmin) && solicitud.estado === "derivada"}
                                <button
                                    class="action-btn success"
                                    onclick={() => handleAction("aprobar")}
                                    disabled={processing}
                                >
                                    {@html getIconSvg("check-circle")} Aprobar
                                </button>
                                <button
                                    class="action-btn danger"
                                    onclick={() => handleAction("rechazar")}
                                    disabled={processing}
                                >
                                    {@html getIconSvg("x-circle")} Rechazar
                                </button>
                            {/if}

                            <!-- MENSAJE SI NO HAY ACCIONES -->
                            {#if !processing && 
                                !((isApoderado || isProfesor) && (solicitud.estado === "recibida" || solicitud.estado === "derivada")) && 
                                !(isRecepcionista && (solicitud.estado === "recibida" || solicitud.estado === "aprobada" || solicitud.estado === "derivada")) && 
                                !(isRegente && solicitud.estado === "derivada") && 
                                !isAdmin}
                                <p class="no-actions">
                                    No hay acciones disponibles
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :root {
        --cyan: #00cfe6;
        --text: #1e293b;
        --text-secondary: #64748b;
        --muted: #94a3b8;
        --bg-light: #f1f5f9;
        --border-color: #e2e8f0;
    }

    .detail-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    .back-button {
        margin-bottom: 20px;
    }

    .back-button a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.95rem;
        transition: all 0.2s;
    }

    .back-button a:hover {
        background: var(--bg-light);
        color: var(--text);
    }

    .back-button :global(svg) {
        width: 18px;
        height: 18px;
    }

    .detail-panel {
        background: white;
        border-radius: 14px;
        box-shadow: 0 6px 18px rgba(25, 40, 60, 0.02);
        border: 1px solid #eef6fa;
        overflow: hidden;
    }

    .color-bar {
        height: 4px;
        background: linear-gradient(90deg, #00cfe6 0%, #0db9d5 100%);
    }

    .panel-header {
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--border-color);
    }

    .panel-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 6px;
    }

    .created-date {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin: 0;
    }

    .content-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 24px;
        padding: 24px;
    }

    @media (max-width: 1024px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
    }

    .left-column {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .right-column {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    /* Card Styles */
    .info-card {
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        overflow: hidden;
    }

    .card-header {
        padding: 16px 20px;
        background: white;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .card-header :global(svg) {
        width: 20px;
        height: 20px;
        color: var(--cyan);
    }

    .card-header h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--text);
    }

    .card-body {
        padding: 20px;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    }

    .info-item label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--text-secondary);
        font-weight: 600;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
    }

    .info-item p {
        margin: 0;
        font-size: 0.95rem;
        color: var(--text);
        font-weight: 500;
    }

    .observations {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }

    .observations label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--text-secondary);
        font-weight: 600;
        margin-bottom: 8px;
    }

    .observations p {
        margin: 0;
        padding: 12px;
        background: white;
        border-radius: 8px;
        font-style: italic;
        color: var(--text);
        border: 1px solid var(--border-color);
    }

    /* Students */
    .students-body {
        padding: 0;
    }

    .student-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color);
    }

    .student-item:last-child {
        border-bottom: none;
    }

    .student-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--cyan), #0db9d5);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1rem;
        flex-shrink: 0;
    }

    .student-info {
        flex: 1;
    }

    .student-name {
        margin: 0 0 4px;
        font-weight: 600;
        color: var(--text);
        font-size: 0.95rem;
    }

    .student-meta {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .student-obs {
        margin: 6px 0 0;
        font-size: 0.85rem;
        color: var(--muted);
        font-style: italic;
    }

    .empty-text {
        margin: 0;
        padding: 20px;
        text-align: center;
        color: var(--text-secondary);
    }

    /* Sidebar Cards */
    .sidebar-card {
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        padding: 20px;
    }

    .sidebar-card h4 {
        margin: 0 0 16px;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.85rem;
    }

    .evidence-box {
        background: #1a1a1a;
        border-radius: 10px;
        overflow: hidden;
        aspect-ratio: 4/3;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .evidence-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .no-evidence {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #666;
    }

    .no-evidence span:first-child {
        font-size: 2rem;
    }

    /* Actions */
    .actions-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .action-btn {
        width: 100%;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .action-btn.success {
        background: #10b981;
        color: white;
    }

    .action-btn.success:hover:not(:disabled) {
        background: #059669;
    }

    .action-btn.danger {
        background: #ef4444;
        color: white;
    }

    .action-btn.danger:hover:not(:disabled) {
        background: #dc2626;
    }

    .action-btn.warning {
        background: #f59e0b;
        color: white;
    }

    .action-btn.warning:hover:not(:disabled) {
        background: #d97706;
    }

    .action-btn :global(svg) {
        width: 16px;
        height: 16px;
    }

    .no-actions {
        margin: 0;
        padding: 16px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-style: italic;
    }

    /* Loading */
    .loading-state,
    .error-state {
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
