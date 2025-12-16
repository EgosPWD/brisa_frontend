<script lang="ts">
    import { goto } from "$app/navigation";
    import { retirosService } from "$lib/services/retiros";
    import { coursesService } from "$lib/services/courses";
    import MotivoSelector from "$lib/components/retiros/MotivoSelector.svelte";
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";
    import { getIconSvg } from "$lib/components/svg";

    // Permission check
    const userRole = $derived(authStore.user?.rol?.toLowerCase());
    const canCreate = $derived(
        userRole === "profesor" || 
        userRole === "recepcionista" ||
        userRole === "recepción" ||
        authStore.esAdministrador
    );

    let loading = $state(false);
    let loadingStudents = $state(false);
    let submitting = $state(false);
    let errorMsg = $state("");
    let photoFile: File | null = $state(null);
    let photoPreview: string | null = $state(null);
    let uploadingPhoto = $state(false);

    // Modal state
    let showModal = $state(false);
    let modalCourseId: number | null = $state(null);
    let modalAvailableStudents: any[] = $state([]);
    let modalSearchQuery = $state("");

    // Estudiantes seleccionados (array de objetos completos)
    interface SelectedStudent {
        id_estudiante: number;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string;
        ci?: string;
        curso_nombre?: string;
        nivel?: string;
    }
    let selectedStudents: SelectedStudent[] = $state([]);

    // Cursos disponibles
    let availableCourses: any[] = $state([]);

    // Form data
    let selectedMotivoId = $state<number | null>(null);
    let fechaSalida = $state("");
    let fechaRetorno = $state("");
    let observacion = $state("");
    let fotoUrl = $state("");

    // Filtered students in modal
    const modalFilteredStudents = $derived(
        modalSearchQuery.trim() === ""
            ? modalAvailableStudents
            : modalAvailableStudents.filter((est) => {
                  const search = modalSearchQuery.toLowerCase();
                  const nombre = `${est.nombres} ${est.apellido_paterno} ${est.apellido_materno}`.toLowerCase();
                  const ci = est.ci?.toLowerCase() || "";
                  return nombre.includes(search) || ci.includes(search);
              })
    );

    onMount(async () => {
        if (!canCreate) {
            goto("/retiros/solicitudes");
            return;
        }

        loading = true;
        try {
            const response = await coursesService.getCourses();
            availableCourses = response || [];
            console.log("📚 Cursos cargados:", availableCourses.length);
        } catch (e) {
            console.error("❌ Error cargando cursos:", e);
            errorMsg = "Error al cargar la lista de cursos";
        } finally {
            loading = false;
        }
    });

    function openModal() {
        showModal = true;
        modalCourseId = null;
        modalAvailableStudents = [];
        modalSearchQuery = "";
    }

    function closeModal() {
        showModal = false;
        modalCourseId = null;
        modalAvailableStudents = [];
        modalSearchQuery = "";
    }

    async function handleModalCourseChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const courseId = target.value ? parseInt(target.value) : null;
        modalCourseId = courseId;

        if (!courseId) {
            modalAvailableStudents = [];
            return;
        }

        loadingStudents = true;
        try {
            console.log("📚 Cargando estudiantes del curso:", courseId);
            const response = await coursesService.getCourseStudents(courseId, {
                page: 1,
                page_size: 10000
            });
            
            // El backend retorna { data: [], total: number }
            modalAvailableStudents = response.data || [];
            console.log("✅ Estudiantes cargados:", modalAvailableStudents.length);
        } catch (e: any) {
            console.error("❌ Error cargando estudiantes:", e);
            errorMsg = "Error al cargar estudiantes del curso";
        } finally {
            loadingStudents = false;
        }
    }

    function selectStudentFromModal(student: any) {
        // Verificar si ya está seleccionado
        if (selectedStudents.some(s => s.id_estudiante === student.id_estudiante)) {
            errorMsg = "Este estudiante ya fue agregado";
            return;
        }

        // Obtener info del curso seleccionado
        const curso = availableCourses.find(c => c.id_curso === modalCourseId);

        // Agregar estudiante con info del curso
        selectedStudents = [...selectedStudents, {
            id_estudiante: student.id_estudiante,
            nombres: student.nombres,
            apellido_paterno: student.apellido_paterno,
            apellido_materno: student.apellido_materno,
            ci: student.ci,
            curso_nombre: curso?.nombre_curso,
            nivel: curso?.nivel
        }];

        console.log("✅ Estudiante agregado:", student);
        closeModal();
    }

    function removeStudent(id_estudiante: number) {
        selectedStudents = selectedStudents.filter(s => s.id_estudiante !== id_estudiante);
    }

    function handlePhotoChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            photoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    async function uploadPhoto(): Promise<string | null> {
        if (!photoFile) return null;

        uploadingPhoto = true;
        try {
            const formData = new FormData();
            formData.append("file", photoFile);

            // Obtener token desde localStorage con la clave correcta
            const token = localStorage.getItem("brisa_auth_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(
                "http://localhost:8000/api/retiros-tempranos/upload/evidencia",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success && data.data?.url) {
                return data.data.url;
            }
            
            throw new Error(data.message || "Error al subir la foto");
        } catch (e: any) {
            console.error("❌ Error subiendo foto:", e);
            throw new Error(e.message || "Error al subir la foto");
        } finally {
            uploadingPhoto = false;
        }
    }

    async function handleSubmit() {
        console.log("🚀 Iniciando creación de solicitud masiva");
        
        // Validaciones
        if (selectedStudents.length === 0) {
            errorMsg = "Debe agregar al menos un estudiante";
            return;
        }
        if (!selectedMotivoId) {
            errorMsg = "Debe seleccionar un motivo";
            return;
        }
        if (!fechaSalida) {
            errorMsg = "Debe ingresar la fecha y hora de salida";
            return;
        }
        if (!photoFile && !fotoUrl) {
            errorMsg = "Debe subir una foto de evidencia";
            return;
        }

        submitting = true;
        errorMsg = "";

        try {
            // 1. Subir foto si hay archivo
            let photoUrl = fotoUrl;
            if (photoFile) {
                console.log("📤 Subiendo foto...");
                photoUrl = await uploadPhoto() || "";
                if (!photoUrl) {
                    throw new Error("No se pudo obtener la URL de la foto");
                }
                console.log("✅ Foto subida:", photoUrl);
            }

            // 2. Preparar DTO con los IDs de los estudiantes seleccionados
            const estudiantesDTO = selectedStudents.map((student) => ({
                id_estudiante: student.id_estudiante,
                observacion_individual: null,
            }));

            const payload = {
                id_motivo: selectedMotivoId,
                fecha_hora_salida: new Date(fechaSalida).toISOString(),
                fecha_hora_retorno_previsto: fechaRetorno
                    ? new Date(fechaRetorno).toISOString()
                    : null,
                foto_evidencia: photoUrl,
                observacion: observacion || null,
                estudiantes: estudiantesDTO,
            };

            console.log("📤 Enviando payload:", payload);

            // 3. Crear solicitud
            const response = await retirosService.createSolicitudMasiva(payload);
            console.log("✅ Solicitud masiva creada:", response);

            // 4. Redirigir
            goto("/retiros/solicitudes?tab=masiva");
        } catch (e: any) {
            console.error("❌ Error:", e);
            errorMsg = e.message || "Error al crear solicitud masiva";
        } finally {
            submitting = false;
        }
    }
</script>

<div class="form-container">
    <!-- Back Button -->
    <div class="back-button">
        <a href="/retiros/solicitudes?tab=masiva">
            {@html getIconSvg("arrow-left")}
            Volver al listado
        </a>
    </div>

    <!-- Header -->
    <div class="form-header">
        <div class="icon-wrapper">
            {@html getIconSvg("users")}
        </div>
        <div>
            <h1>Nueva Solicitud Masiva</h1>
            <p>Retiro para múltiples estudiantes (paseos, excursiones, eventos)</p>
        </div>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando...</p>
        </div>
    {:else}
        <form onsubmit={handleSubmit} class="form-content">
            {#if errorMsg}
                <div class="alert alert-error">
                    {@html getIconSvg("alert-circle")}
                    <span>{errorMsg}</span>
                </div>
            {/if}

            <!-- Info Alert -->
            <div class="alert alert-info">
                {@html getIconSvg("info")}
                <span>
                    Las solicitudes masivas requieren agregar estudiantes individualmente, una foto de evidencia y especificar el motivo.
                </span>
            </div>

            <!-- Estudiantes Agregados -->
            <div class="card">
                <div class="card-header">
                    <h3>
                        {@html getIconSvg("users")}
                        Estudiantes
                        <span class="badge">{selectedStudents.length} agregado{selectedStudents.length !== 1 ? 's' : ''}</span>
                    </h3>
                </div>
                <div class="card-body">
                    <div class="students-list">
                        {#each selectedStudents as student (student.id_estudiante)}
                            <div class="student-item">
                                <div class="student-avatar">
                                    {(student.nombres?.[0] || 'E').toUpperCase()}
                                </div>
                                <div class="student-data">
                                    <div class="student-name">
                                        {student.nombres} {student.apellido_paterno} {student.apellido_materno}
                                    </div>
                                    <div class="student-meta">
                                        {#if student.ci}
                                            <span>CI: {student.ci}</span>
                                        {/if}
                                        {#if student.curso_nombre}
                                            <span>•</span>
                                            <span>{student.curso_nombre} {student.nivel || ''}</span>
                                        {/if}
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    class="remove-btn"
                                    onclick={() => removeStudent(student.id_estudiante)}
                                    title="Quitar estudiante"
                                >
                                    {@html getIconSvg("x")}
                                </button>
                            </div>
                        {/each}
                        
                        <!-- Add Student Button -->
                        <button 
                            type="button" 
                            class="add-student-btn"
                            onclick={openModal}
                        >
                            {@html getIconSvg("plus")}
                            <span>Agregar estudiante</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Motivo -->
            <div class="card">
                <div class="card-header">
                    <h3>
                        {@html getIconSvg("file-text")}
                        Motivo del Retiro
                    </h3>
                </div>
                <div class="card-body">
                    <MotivoSelector 
                        bind:value={selectedMotivoId} 
                        label="Motivo"
                        placeholder="Seleccione el motivo del retiro masivo"
                        required 
                    />
                </div>
            </div>

            <!-- Fechas -->
            <div class="card">
                <div class="card-header">
                    <h3>
                        {@html getIconSvg("calendar")}
                        Fechas y Horarios
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label for="fecha-salida">
                                Fecha y Hora de Salida <span class="required">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="fecha-salida"
                                bind:value={fechaSalida}
                                required
                            />
                        </div>
                        <div class="form-group">
                            <label for="fecha-retorno">
                                Fecha y Hora de Retorno Previsto
                            </label>
                            <input
                                type="datetime-local"
                                id="fecha-retorno"
                                bind:value={fechaRetorno}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Foto Evidencia -->
            <div class="card">
                <div class="card-header">
                    <h3>
                        {@html getIconSvg("camera")}
                        Foto de Evidencia <span class="required">*</span>
                    </h3>
                </div>
                <div class="card-body">
                    <div class="photo-upload">
                        <input
                            type="file"
                            id="photo-input"
                            accept="image/*"
                            onchange={handlePhotoChange}
                            style="display: none;"
                        />
                        
                        {#if photoPreview}
                            <div class="photo-preview">
                                <img src={photoPreview} alt="Evidencia" />
                                <button
                                    type="button"
                                    class="remove-photo"
                                    onclick={() => {
                                        photoFile = null;
                                        photoPreview = null;
                                        fotoUrl = "";
                                    }}
                                >
                                    {@html getIconSvg("x")}
                                </button>
                            </div>
                        {:else}
                            <label for="photo-input" class="upload-placeholder">
                                {@html getIconSvg("upload")}
                                <p>Click para seleccionar una foto</p>
                                <span>Autorización, comunicado o documento de respaldo</span>
                            </label>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Observaciones -->
            <div class="card">
                <div class="card-header">
                    <h3>
                        {@html getIconSvg("message-square")}
                        Observaciones Generales
                    </h3>
                </div>
                <div class="card-body">
                    <textarea
                        bind:value={observacion}
                        placeholder="Información adicional sobre la solicitud masiva (opcional)..."
                        rows="4"
                    ></textarea>
                </div>
            </div>

            <!-- Submit Buttons -->
            <div class="form-actions">
                <a href="/retiros/solicitudes?tab=masiva" class="btn-cancel">
                    Cancelar
                </a>
                <button type="submit" class="btn-submit" disabled={submitting || uploadingPhoto}>
                    {#if submitting || uploadingPhoto}
                        <div class="spinner-small"></div>
                        {uploadingPhoto ? 'Subiendo foto...' : 'Creando solicitud...'}
                    {:else}
                        {@html getIconSvg("check")}
                        Crear Solicitud Masiva
                    {/if}
                </button>
            </div>
        </form>
    {/if}
</div>

<!-- Modal para seleccionar estudiante -->
{#if showModal}
    <div class="modal-overlay" onclick={closeModal}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2>Agregar Estudiante</h2>
                <button type="button" class="modal-close" onclick={closeModal}>
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <!-- Selector de curso -->
                <div class="form-group">
                    <label for="modal-curso-select">
                        Seleccione el curso <span class="required">*</span>
                    </label>
                    <select
                        id="modal-curso-select"
                        bind:value={modalCourseId}
                        onchange={handleModalCourseChange}
                    >
                        <option value="">-- Seleccione un curso --</option>
                        {#each availableCourses as curso (curso.id_curso)}
                            <option value={curso.id_curso}>
                                {curso.nombre_curso} - {curso.nivel || ''} ({curso.gestion || ''})
                            </option>
                        {/each}
                    </select>
                </div>

                {#if modalCourseId}
                    {#if loadingStudents}
                        <div class="loading-state-small">
                            <div class="spinner-small"></div>
                            <p>Cargando estudiantes...</p>
                        </div>
                    {:else if modalAvailableStudents.length === 0}
                        <div class="empty-state">
                            <p>No hay estudiantes en este curso</p>
                        </div>
                    {:else}
                        <!-- Search -->
                        <div class="search-box">
                            {@html getIconSvg("search")}
                            <input
                                type="text"
                                placeholder="Buscar por nombre o CI..."
                                bind:value={modalSearchQuery}
                            />
                        </div>

                        <!-- Lista de estudiantes -->
                        <div class="modal-students-list">
                            {#each modalFilteredStudents as estudiante (estudiante.id_estudiante)}
                                <button
                                    type="button"
                                    class="modal-student-item"
                                    onclick={() => selectStudentFromModal(estudiante)}
                                >
                                    <div class="student-avatar">
                                        {(estudiante.nombres?.[0] || 'E').toUpperCase()}
                                    </div>
                                    <div class="student-data">
                                        <div class="student-name">
                                            {estudiante.nombres} {estudiante.apellido_paterno} {estudiante.apellido_materno}
                                        </div>
                                        {#if estudiante.ci}
                                            <div class="student-meta">
                                                CI: {estudiante.ci}
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="select-icon">
                                        {@html getIconSvg("plus")}
                                    </div>
                                </button>
                            {:else}
                                <div class="empty-state">
                                    <p>No se encontraron estudiantes</p>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    :root {
        --cyan: #00cfe6;
        --cyan-dark: #00b8d4;
        --text: #1e293b;
        --text-secondary: #64748b;
        --muted: #94a3b8;
        --bg-light: #f1f5f9;
        --border-color: #e2e8f0;
        --success: #10b981;
        --danger: #ef4444;
        --warning: #f59e0b;
    }

    .form-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 24px;
    }

    .back-button {
        margin-bottom: 20px;
    }

    .back-button a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        transition: color 0.2s;
    }

    .back-button a:hover {
        color: var(--cyan);
    }

    .back-button :global(svg) {
        width: 20px;
        height: 20px;
    }

    .form-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
    }

    .icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--cyan), var(--cyan-dark));
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
    }

    .icon-wrapper :global(svg) {
        width: 28px;
        height: 28px;
    }

    .form-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 4px;
    }

    .form-header p {
        color: var(--text-secondary);
        margin: 0;
        font-size: 0.95rem;
    }

    .loading-state {
        text-align: center;
        padding: 60px 20px;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--bg-light);
        border-top-color: var(--cyan);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .form-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .alert {
        padding: 16px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.95rem;
    }

    .alert-error {
        background: #fee;
        color: var(--danger);
        border: 1px solid #fcc;
    }

    .alert-info {
        background: #e0f2fe;
        color: #0284c7;
        border: 1px solid #bae6fd;
    }

    .alert :global(svg) {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .card {
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        overflow: hidden;
    }

    .card-header {
        padding: 16px 20px;
        background: var(--bg-light);
        border-bottom: 1px solid var(--border-color);
    }

    .card-header h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .card-header :global(svg) {
        width: 20px;
        height: 20px;
        color: var(--cyan);
    }

    .badge {
        background: var(--cyan);
        color: white;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-left: auto;
    }

    .card-body {
        padding: 20px;
    }

    .search-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }

    .search-box {
        flex: 1;
        min-width: 250px;
        position: relative;
        display: flex;
        align-items: center;
    }

    .search-box :global(svg) {
        position: absolute;
        left: 12px;
        width: 18px;
        height: 18px;
        color: var(--muted);
    }

    .search-box input {
        width: 100%;
        padding: 10px 12px 10px 38px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.95rem;
        transition: all 0.2s;
    }

    .search-box input:focus {
        outline: none;
        border-color: var(--cyan);
        box-shadow: 0 0 0 3px rgba(0, 207, 230, 0.1);
    }

    .action-buttons {
        display: flex;
        gap: 8px;
    }

    .btn-secondary {
        padding: 10px 16px;
        border: 1px solid var(--border-color);
        background: white;
        color: var(--text);
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-secondary:hover {
        border-color: var(--cyan);
        color: var(--cyan);
        background: var(--bg-light);
    }

    .students-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
        max-height: 400px;
        overflow-y: auto;
        padding: 4px;
    }

    .student-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 2px solid var(--border-color);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
        position: relative;
    }

    .student-card:hover {
        border-color: var(--cyan);
        background: #f0fdff;
    }

    .student-card.selected {
        border-color: var(--cyan);
        background: #e0f9fc;
    }

    .student-card input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .student-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--cyan), var(--cyan-dark));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.1rem;
        flex-shrink: 0;
    }

    .student-info {
        flex: 1;
        min-width: 0;
    }

    .student-name {
        font-weight: 600;
        color: var(--text);
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .student-details {
        display: flex;
        gap: 8px;
        margin-top: 4px;
        flex-wrap: wrap;
    }

    .detail-item {
        font-size: 0.8rem;
        color: var(--text-secondary);
        background: var(--bg-light);
        padding: 2px 8px;
        border-radius: 4px;
    }

    .checkmark {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
        transition: all 0.2s;
    }

    .student-card.selected .checkmark {
        background: var(--cyan);
        border-color: var(--cyan);
    }

    .checkmark :global(svg) {
        width: 14px;
        height: 14px;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .student-card.selected .checkmark :global(svg) {
        opacity: 1;
    }

    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
        grid-column: 1 / -1;
    }

    .grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-group label {
        font-weight: 500;
        color: var(--text);
        font-size: 0.95rem;
    }

    .required {
        color: var(--danger);
    }

    .form-group input,
    textarea,
    select {
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.2s;
        background: white;
    }

    .form-group input:focus,
    textarea:focus,
    select:focus {
        outline: none;
        border-color: var(--cyan);
        box-shadow: 0 0 0 3px rgba(0, 207, 230, 0.1);
    }

    .help-text {
        margin: 8px 0 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    .loading-state-small {
        text-align: center;
        padding: 40px 20px;
    }

    .loading-state-small .spinner-small {
        width: 32px;
        height: 32px;
        border: 3px solid var(--bg-light);
        border-top-color: var(--cyan);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 12px;
    }

    .loading-state-small p {
        color: var(--text-secondary);
        margin: 0;
    }

    textarea {
        resize: vertical;
        min-height: 100px;
    }

    .photo-upload {
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .upload-placeholder {
        width: 100%;
        min-height: 200px;
        border: 2px dashed var(--border-color);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--bg-light);
    }

    .upload-placeholder:hover {
        border-color: var(--cyan);
        background: #f0fdff;
    }

    .upload-placeholder :global(svg) {
        width: 48px;
        height: 48px;
        color: var(--cyan);
    }

    .upload-placeholder p {
        margin: 0;
        font-weight: 600;
        color: var(--text);
    }

    .upload-placeholder span {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .photo-preview {
        position: relative;
        width: 100%;
        max-width: 500px;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid var(--border-color);
    }

    .photo-preview img {
        width: 100%;
        height: auto;
        display: block;
    }

    .remove-photo {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--danger);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .remove-photo:hover {
        background: #dc2626;
        transform: scale(1.1);
    }

    .remove-photo :global(svg) {
        width: 20px;
        height: 20px;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }

    .btn-cancel {
        padding: 12px 24px;
        border: 1px solid var(--border-color);
        background: white;
        color: var(--text);
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
    }

    .btn-cancel:hover {
        background: var(--bg-light);
    }

    .btn-submit {
        padding: 12px 32px;
        background: var(--cyan);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(0, 207, 230, 0.3);
    }

    .btn-submit:hover:not(:disabled) {
        background: var(--cyan-dark);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 207, 230, 0.4);
    }

    .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-submit :global(svg) {
        width: 20px;
        height: 20px;
    }

    .spinner-small {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    /* Estilos para la lista de estudiantes agregados */
    .students-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .student-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        transition: all 0.2s;
    }

    .student-item:hover {
        border-color: var(--cyan);
        background: #f0fdff;
    }

    .student-data {
        flex: 1;
        min-width: 0;
    }

    .student-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    .remove-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background: white;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .remove-btn:hover {
        background: #fee;
        border-color: var(--danger);
        color: var(--danger);
    }

    .remove-btn :global(svg) {
        width: 18px;
        height: 18px;
    }

    .add-student-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 20px;
        border: 2px dashed var(--border-color);
        background: var(--bg-light);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 1rem;
    }

    .add-student-btn:hover {
        border-color: var(--cyan);
        background: #e0f9fc;
        color: var(--cyan);
    }

    .add-student-btn :global(svg) {
        width: 24px;
        height: 24px;
    }

    /* Estilos para el modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }

    .modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 600px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--text);
    }

    .modal-close {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background: white;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .modal-close:hover {
        background: var(--bg-light);
        color: var(--text);
    }

    .modal-close :global(svg) {
        width: 20px;
        height: 20px;
    }

    .modal-body {
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .modal-students-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 400px;
        overflow-y: auto;
        padding: 4px;
    }

    .modal-student-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        width: 100%;
    }

    .modal-student-item:hover {
        border-color: var(--cyan);
        background: #f0fdff;
    }

    .select-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--cyan);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .select-icon :global(svg) {
        width: 18px;
        height: 18px;
    }
</style>
