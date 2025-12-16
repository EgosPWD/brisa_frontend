<script lang="ts">
    import { goto } from "$app/navigation";
    import { retirosService } from "$lib/services/retiros";
    import { estudiantesService } from "$lib/services/estudiantes";
    import { estudianteApoderadoService } from "$lib/services/estudiante-apoderado";
    import MotivoSelector from "$lib/components/retiros/MotivoSelector.svelte";
    import EstudianteSelector from "$lib/components/retiros/EstudianteSelector.svelte";
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";

    // Permission check - only Apoderado and Recepcionista can create individual
    const userRole = $derived(authStore.user?.rol?.toLowerCase());
    const canCreate = $derived(
        userRole?.includes("apoderado") || userRole === "recepcionista",
    );

    let loading = $state(false);
    let submitting = $state(false);
    let errorMsg = $state("");
    let uploadingPhoto = $state(false);

    let availableStudents = $state<any[]>([]);

    // Para el archivo de foto
    let fotoFile = $state<File | null>(null);
    let fotoPreview = $state<string | null>(null);

    // ✅ Variables separadas para reactividad
    let selectedStudentId = $state<number | null>(null);
    let selectedMotivoId = $state<number | null>(null);
    let fechaHoraSalida = $state("");
    let fechaHoraRetornoPrevisto = $state("");
    let observacion = $state("");
    let fotoEvidencia = $state("");

    onMount(async () => {
        // Guard: redirect if user doesn't have permission
        if (!canCreate) {
            goto("/retiros/solicitudes");
            return;
        }

        loading = true;
        try {
            // Determine which students to show
            // If Apoderado, get "Mis Estudiantes"
            // If User is NOT Apoderado (e.g. Recepcionista creating for a student walking in?), they need all students.
            // For now, let's assume this form is mostly for Apoderados.
            // If Recepcionista uses it, they might need a full search.

            // If Apoderado, get only their students
            if (authStore.user?.rol?.toLowerCase().includes("apoderado")) {
                // usuario_id in authStore is actually the id_persona
                const idPersona = authStore.user.usuario_id;

                try {
                    // Fetch students related to this apoderado
                    const relaciones =
                        await estudianteApoderadoService.getEstudiantesPorApoderado(
                            idPersona,
                        );

                    // Map to student format expected by EstudianteSelector
                    availableStudents = relaciones.map((rel) => {
                        // Separar el nombre completo en partes
                        const nombreParts = rel.estudiante_nombre?.split(' ') || [];
                        const nombre = nombreParts[0] || "Estudiante";
                        const apellido_paterno = nombreParts[1] || "";
                        const apellido_materno = nombreParts.slice(2).join(' ') || "";
                        
                        return {
                            id: rel.id_estudiante,
                            nombre: nombre,
                            apellido_paterno: apellido_paterno,
                            apellido_materno: apellido_materno,
                            ci: rel.estudiante_ci || "",
                            curso: ""
                        };
                    });
                } catch (e) {
                    console.error("Error loading apoderado students:", e);
                    availableStudents = [];
                }
            } else {
                // Recepcionista can see all students
                availableStudents = await estudiantesService.getEstudiantes();
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });

    // Manejar selección de foto
    function handlePhotoChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            fotoFile = input.files[0];
            
            // Crear preview
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoPreview = e.target?.result as string;
            };
            reader.readAsDataURL(fotoFile);
        }
    }

    // Subir foto al servidor
    async function uploadPhoto(): Promise<string | null> {
        if (!fotoFile) return null;

        uploadingPhoto = true;
        try {
            const formData = new FormData();
            formData.append('file', fotoFile);
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const baseUrl = apiUrl.replace(/\/api$/, ''); // Quitar /api si existe
            
            // Endpoint para subir foto de evidencia
            const response = await fetch(`${baseUrl}/api/retiros-tempranos/upload/evidencia`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Error al subir la foto');
            }

            const data = await response.json();
            console.log('📸 Respuesta del upload:', data);
            // Priorizar la URL completa del backend
            return data.data?.url || data.url || data.data?.filename || data.filename;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        } finally {
            uploadingPhoto = false;
        }
    }

    async function handleSubmit() {
        console.log('🚀 handleSubmit() ejecutándose...');
        console.log('📊 Datos actuales:', {
            selectedStudentId,
            selectedMotivoId,
            fechaHoraSalida,
            fechaHoraRetornoPrevisto,
            observacion,
            fotoFile: !!fotoFile
        });
        
        // Validación de campos obligatorios
        if (!selectedStudentId) {
            errorMsg = "Por favor seleccione un estudiante";
            console.warn('⚠️ Falta estudiante');
            return;
        }

        if (!selectedMotivoId) {
            errorMsg = "Por favor seleccione un motivo de retiro";
            console.warn('⚠️ Falta motivo');
            return;
        }

        if (!fechaHoraSalida) {
            errorMsg = "Por favor ingrese la fecha y hora de salida";
            console.warn('⚠️ Falta fecha de salida');
            return;
        }

        submitting = true;
        errorMsg = "";

        try {
            console.log('🔐 Token disponible:', !!authStore.token);
            console.log('👤 Usuario:', authStore.user?.usuario);
            
            // Subir foto si hay una seleccionada
            let photoUrl = null;
            if (fotoFile) {
                try {
                    photoUrl = await uploadPhoto();
                    if (photoUrl) {
                        fotoEvidencia = photoUrl;
                    }
                } catch (uploadError) {
                    console.error('Error al subir foto:', uploadError);
                    errorMsg = "Error al subir la foto de evidencia. Por favor intente nuevamente.";
                    return;
                }
            }

            // Crear la solicitud
            const payload = {
                id_estudiante: selectedStudentId,
                id_motivo: selectedMotivoId,
                fecha_hora_salida: new Date(fechaHoraSalida).toISOString(),
                fecha_hora_retorno_previsto: fechaHoraRetornoPrevisto
                    ? new Date(fechaHoraRetornoPrevisto).toISOString()
                    : null,
                foto_evidencia: fotoEvidencia || photoUrl || null,
                observacion: observacion || null,
            };

            console.log('📤 Enviando solicitud:', payload);

            const response = await retirosService.createSolicitud(payload);
            
            console.log('✅ Solicitud creada exitosamente:', response);
            
            // Redirigir a la lista de solicitudes
            goto("/retiros/solicitudes");
        } catch (e: any) {
            console.error('❌ Error al crear solicitud:', e);
            
            // Manejar diferentes tipos de errores
            if (e.details?.detail) {
                errorMsg = e.details.detail;
            } else if (e.message) {
                errorMsg = e.message;
            } else if (e.response?.data?.detail) {
                errorMsg = e.response.data.detail;
            } else {
                errorMsg = "Error al crear la solicitud. Por favor intente nuevamente.";
            }
        } finally {
            submitting = false;
        }
    }
</script>

<!-- Header con estilo de Retiros Tempranos -->
<div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- Título con icono -->
    <div class="flex items-center gap-4 mb-8">
        <div class="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        </div>
        <div>
            <h1 class="text-3xl font-bold text-gray-800">Nueva Solicitud de Retiro</h1>
            <p class="text-gray-500 text-sm mt-1">Complete el formulario para registrar la solicitud</p>
        </div>
    </div>

    <!-- Mensaje de error -->
    {#if errorMsg}
        <div class="alert alert-error shadow-lg mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{errorMsg}</span>
        </div>
    {/if}

    <!-- Card principal del formulario -->
    <div class="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Header del card -->
        <div class="bg-gradient-to-r from-cyan-50 to-blue-50 px-8 py-5 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Información de la Solicitud
            </h2>
        </div>

        <!-- Formulario -->
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Estudiante - Ocupa columna completa -->
                <div class="md:col-span-2">
                    <div class="form-section">
                        <div class="form-label">
                            <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            Estudiante
                            <span class="text-red-500 ml-1">*</span>
                        </div>
                        <EstudianteSelector
                            students={availableStudents}
                            bind:value={selectedStudentId}
                            required
                        />
                    </div>
                </div>

                <!-- Motivo de Retiro -->
                <div class="md:col-span-2">
                    <div class="form-section">
                        <div class="form-label">
                            <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Motivo de Retiro
                            <span class="text-red-500 ml-1">*</span>
                        </div>
                        <MotivoSelector bind:value={selectedMotivoId} required />
                    </div>
                </div>

                <!-- Fecha y Hora de Salida -->
                <div>
                    <label class="form-label" for="fecha-salida">
                        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                        Fecha y Hora de Salida
                        <span class="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        id="fecha-salida"
                        class="form-input"
                        bind:value={fechaHoraSalida}
                        required
                    />
                </div>

                <!-- Fecha y Hora de Retorno -->
                <div>
                    <label class="form-label" for="fecha-retorno">
                        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                        </svg>
                        Fecha y Hora de Retorno Previsto
                        <span class="text-gray-400 text-xs ml-1">(Opcional)</span>
                    </label>
                    <input
                        type="datetime-local"
                        id="fecha-retorno"
                        class="form-input"
                        bind:value={fechaHoraRetornoPrevisto}
                    />
                </div>

                <!-- Observaciones -->
                <div class="md:col-span-2">
                    <label class="form-label" for="observacion">
                        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                        </svg>
                        Observaciones
                    </label>
                    <textarea
                        id="observacion"
                        class="form-textarea"
                        rows="4"
                        bind:value={observacion}
                        placeholder="Ingrese observaciones adicionales si es necesario..."
                    ></textarea>
                </div>

                <!-- Foto de Evidencia -->
                <div class="md:col-span-2">
                    <label class="form-label" for="foto">
                        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Foto de Evidencia
                        <span class="text-gray-400 text-xs ml-1">(Opcional)</span>
                        {#if uploadingPhoto}
                            <span class="loading loading-spinner loading-xs ml-2 text-cyan-500"></span>
                        {/if}
                    </label>
                    
                    <div class="photo-upload-container">
                        <input
                            type="file"
                            id="foto"
                            class="file-input-custom"
                            accept="image/*"
                            onchange={handlePhotoChange}
                        />
                        <div class="file-input-label">
                            <svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <span class="text-sm text-gray-600 font-medium">
                                Haga clic para seleccionar o arrastre una imagen
                            </span>
                            <span class="text-xs text-gray-400 mt-1">
                                JPG, PNG, GIF (máx. 5MB)
                            </span>
                        </div>
                    </div>
                    
                    {#if fotoPreview}
                        <div class="photo-preview-container">
                            <div class="photo-preview-wrapper">
                                <img 
                                    src={fotoPreview} 
                                    alt="Preview" 
                                    class="photo-preview-image"
                                />
                                <button
                                    type="button"
                                    class="photo-remove-btn"
                                    onclick={() => {
                                        fotoFile = null;
                                        fotoPreview = null;
                                        fotoEvidencia = "";
                                    }}
                                    title="Eliminar foto"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <a 
                    href="/retiros/solicitudes" 
                    class="btn-cancel"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cancelar
                </a>
                <button 
                    type="submit" 
                    class="btn-submit" 
                    disabled={submitting || uploadingPhoto}
                >
                    {#if submitting || uploadingPhoto}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    {/if}
                    {uploadingPhoto ? 'Subiendo foto...' : submitting ? 'Creando...' : 'Crear Solicitud'}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    /* Estilos globales del formulario */
    .form-section {
        position: relative;
    }

    .form-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s;
        background-color: #ffffff;
    }

    .form-input:focus {
        outline: none;
        border-color: #06b6d4;
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }

    .form-input:hover {
        border-color: #d1d5db;
    }

    .form-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s;
        background-color: #ffffff;
        resize: vertical;
        min-height: 100px;
    }

    .form-textarea:focus {
        outline: none;
        border-color: #06b6d4;
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }

    .form-textarea:hover {
        border-color: #d1d5db;
    }

    /* Estilos para el upload de foto */
    .photo-upload-container {
        position: relative;
        margin-top: 0.5rem;
    }

    .file-input-custom {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 10;
    }

    .file-input-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 1rem;
        border: 2px dashed #d1d5db;
        border-radius: 0.75rem;
        background-color: #f9fafb;
        transition: all 0.3s;
        cursor: pointer;
    }

    .file-input-label:hover {
        border-color: #06b6d4;
        background-color: #ecfeff;
    }

    .photo-preview-container {
        margin-top: 1rem;
        display: flex;
        justify-content: center;
    }

    .photo-preview-wrapper {
        position: relative;
        display: inline-block;
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .photo-preview-image {
        max-width: 400px;
        max-height: 300px;
        width: auto;
        height: auto;
        display: block;
        border-radius: 0.75rem;
    }

    .photo-remove-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .photo-remove-btn:hover {
        background-color: #dc2626;
        transform: scale(1.1);
    }

    /* Botones de acción */
    .btn-cancel {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
        background-color: #ffffff;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
    }

    .btn-cancel:hover {
        background-color: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
    }

    .btn-submit {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #ffffff;
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(6, 182, 212, 0.2);
    }

    .btn-submit:hover:not(:disabled) {
        background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
        box-shadow: 0 4px 6px rgba(6, 182, 212, 0.3);
        transform: translateY(-1px);
    }

    .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .btn-submit:active:not(:disabled) {
        transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .photo-preview-image {
            max-width: 100%;
        }
    }
</style>
