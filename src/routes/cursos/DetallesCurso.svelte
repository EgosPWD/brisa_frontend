<script lang="ts">
	import { onMount } from 'svelte';
	import { getIconSvg } from '$lib/components/svg.js';
	import { coursesService, type CursoResponse } from '$lib/services/courses';
	import { asignacionesService } from '$lib/services/asignaciones';
	import { estudiantesService, type EstudianteResponse } from '$lib/services/estudiantes';

	interface Props {
		cursoId: number;
		onClose: () => void;
		onEdit: (curso: CursoResponse) => void;
		onDeleted: () => void;
	}

	let { cursoId, onClose, onEdit, onDeleted }: Props = $props();

	let curso = $state<CursoResponse | null>(null);
	let estudiantesAsignados = $state<EstudianteResponse[]>([]);
	let estudiantesDisponibles = $state<EstudianteResponse[]>([]);
	let isLoading = $state(true);
	let activeTab = $state<'info' | 'estudiantes'>('info');
	let searchTerm = $state('');
	let isAddingStudent = $state(false);
	let estudiantesSeleccionados = $state<Set<number>>(new Set());
	let isAssigning = $state(false);
	
	// Para asignación masiva desde año anterior
	let mostrarAsignacionMasiva = $state(false);
	let estudiantesAñoAnterior = $state<EstudianteResponse[]>([]);
	let estudiantesAñoAnteriorSeleccionados = $state<Set<number>>(new Set());
	let searchAñoAnterior = $state('');
	let isLoadingAñoAnterior = $state(false);
	let isAssigningMasivo = $state(false);

	let estudiantesFiltrados = $derived(
		searchTerm.trim() === ''
			? estudiantesDisponibles
			: estudiantesDisponibles.filter((est) => {
					const nombreCompleto = `${est.nombres} ${est.apellido_paterno} ${est.apellido_materno}`.toLowerCase();
					return nombreCompleto.includes(searchTerm.toLowerCase());
			  })
	);

	let estudiantesAñoAnteriorFiltrados = $derived(
		searchAñoAnterior.trim() === ''
			? estudiantesAñoAnterior
			: estudiantesAñoAnterior.filter((est) => {
					const nombreCompleto = `${est.nombres} ${est.apellido_paterno} ${est.apellido_materno}`.toLowerCase();
					return nombreCompleto.includes(searchAñoAnterior.toLowerCase());
			  })
	);

	onMount(async () => {
		await loadCurso();
		await loadEstudiantes();
		isLoading = false;
	});

	async function loadCurso() {
		try {
			console.log('Cargando curso con ID:', cursoId);
			curso = await coursesService.getCurso(cursoId);
			console.log('Curso cargado:', curso);
		} catch (error) {
			console.error('Error al cargar curso:', error);
		}
	}

	async function loadEstudiantes() {
		try {
			// Cargar todos los estudiantes
			console.log('Cargando todos los estudiantes...');
			const allEstudiantes = await estudiantesService.getEstudiantes();
			console.log('Todos los estudiantes:', allEstudiantes);
			console.log('Cantidad de estudiantes:', allEstudiantes?.length);
			
			// Cargar estudiantes asignados al curso
			console.log('Cargando estudiantes asignados al curso', cursoId);
			const asignados = await asignacionesService.getEstudiantesPorCurso(cursoId);
			console.log('Estudiantes asignados recibidos:', asignados);
			estudiantesAsignados = Array.isArray(asignados) ? asignados : [];
			console.log('Estudiantes asignados final:', estudiantesAsignados.length);
			
			// Filtrar disponibles (los que no están asignados)
			if (Array.isArray(allEstudiantes) && allEstudiantes.length > 0) {
				const asignadosIds = new Set(estudiantesAsignados.map((e) => e.id));
				estudiantesDisponibles = allEstudiantes.filter((est) => !asignadosIds.has(est.id));
				console.log('Estudiantes disponibles para asignar:', estudiantesDisponibles.length);
			} else {
				console.warn('No hay estudiantes disponibles o allEstudiantes no es un array válido');
				estudiantesDisponibles = [];
			}
		} catch (error) {
			console.error('Error al cargar estudiantes:', error);
			estudiantesAsignados = [];
			estudiantesDisponibles = [];
		}
	}

	function toggleEstudianteSeleccion(estudianteId: number) {
		const newSet = new Set(estudiantesSeleccionados);
		if (newSet.has(estudianteId)) {
			newSet.delete(estudianteId);
		} else {
			newSet.add(estudianteId);
		}
		estudiantesSeleccionados = newSet;
	}

	function seleccionarTodos() {
		if (estudiantesSeleccionados.size === estudiantesFiltrados.length) {
			// Si todos están seleccionados, deseleccionar todos
			estudiantesSeleccionados = new Set();
		} else {
			// Seleccionar todos los filtrados
			estudiantesSeleccionados = new Set(estudiantesFiltrados.map(est => est.id));
		}
	}

	async function handleAsignarSeleccionados() {
		if (estudiantesSeleccionados.size === 0) {
			alert('Seleccione al menos un estudiante');
			return;
		}

		isAssigning = true;
		let errores = 0;
		let exitosos = 0;

		try {
			for (const estudianteId of estudiantesSeleccionados) {
				try {
					await asignacionesService.asignarEstudianteCurso({
						id_estudiante: estudianteId,
						id_curso: cursoId
					});
					exitosos++;
				} catch (error) {
					errores++;
					console.error(`Error al asignar estudiante ${estudianteId}:`, error);
				}
			}

			// Limpiar selección y recargar
			estudiantesSeleccionados = new Set();
			searchTerm = '';
			await loadEstudiantes();

			if (errores === 0) {
				alert(`${exitosos} estudiante(s) asignado(s) exitosamente`);
			} else {
				alert(`Asignados: ${exitosos}, Errores: ${errores}`);
			}
		} finally {
			isAssigning = false;
		}
	}

	// Funciones para asignación masiva desde año anterior
	function obtenerCursoAnterior(): { gradoAnterior: number | null; paralelo: string | null; gestion: string; nivel: string; cambioNivel: boolean } | null {
		if (!curso) return null;
		
		const añoActual = parseInt(curso.gestion);
		const añoAnterior = (añoActual - 1).toString();
		
		// Extraer paralelo (A, B, C, etc.) - la última letra mayúscula del nombre
		const paraleloMatch = curso.nombre.match(/([A-Z])(?:\s|$)/);
		const paralelo = paraleloMatch ? paraleloMatch[1] : null;
		
		// Extraer el número del nombre del curso (ej: "Primaria 2A" -> 2, "3ro A" -> 3)
		const match = curso.nombre.match(/(\d+)/);
		if (!match) return null;
		
		const gradoActual = parseInt(match[1]);
		const gradoAnterior = gradoActual - 1;
		
		// Si es grado 1, puede ser cambio de nivel
		if (gradoAnterior < 1) {
			// Primaria 1 viene de Inicial
			if (curso.nivel_educativo === 'Primaria') {
				return {
					gradoAnterior: null, // Inicial no tiene grados numéricos
					paralelo: paralelo,
					gestion: añoAnterior,
					nivel: 'Inicial',
					cambioNivel: true
				};
			}
			// Secundaria 1 viene de Primaria 6
			else if (curso.nivel_educativo === 'Secundaria') {
				return {
					gradoAnterior: 6, // Último grado de primaria
					paralelo: paralelo,
					gestion: añoAnterior,
					nivel: 'Primaria',
					cambioNivel: true
				};
			}
			// Inicial 1 no tiene anterior
			return null;
		}
		
		// Caso normal: mismo nivel, grado anterior
		return {
			gradoAnterior: gradoAnterior,
			paralelo: paralelo,
			gestion: añoAnterior,
			nivel: curso.nivel_educativo,
			cambioNivel: false
		};
	}

	async function loadEstudiantesAñoAnterior() {
		const infoAnterior = obtenerCursoAnterior();
		if (!infoAnterior) {
			alert('No hay curso anterior disponible para este nivel y grado');
			return;
		}

		isLoadingAñoAnterior = true;
		try {
			// Buscar todos los cursos del año anterior del nivel correspondiente
			const cursos = await coursesService.getCursosPorGestionYNivel(
				infoAnterior.gestion,
				infoAnterior.nivel
			);
			
			if (infoAnterior.cambioNivel) {
				console.log(`Cambio de nivel: ${infoAnterior.nivel} ${infoAnterior.paralelo || ''} ${infoAnterior.gestion} → ${curso?.nivel_educativo} ${curso?.gestion}`);
			} else {
				console.log(`Buscando grado ${infoAnterior.gradoAnterior}${infoAnterior.paralelo || ''} en ${infoAnterior.nivel} ${infoAnterior.gestion}`);
			}
			console.log('Cursos disponibles:', cursos.map(c => c.nombre));
			
			let cursoAnteriorEspecifico: CursoResponse | undefined;
			
			// Si es Inicial (sin grados numéricos), buscar por paralelo
			if (infoAnterior.nivel === 'Inicial' && infoAnterior.gradoAnterior === null) {
				if (infoAnterior.paralelo) {
					// Buscar Inicial con el mismo paralelo (ej: "Inicial A")
					cursoAnteriorEspecifico = cursos.find(c => {
						const paraleloMatch = c.nombre.match(/([A-Z])(?:\s|$)/);
						return paraleloMatch && paraleloMatch[1] === infoAnterior.paralelo;
					});
				} else {
					// Si no hay paralelo definido, tomar el primero
					cursoAnteriorEspecifico = cursos[0];
				}
			}
			// Si tiene grado específico, buscar ese grado Y paralelo
			else if (infoAnterior.gradoAnterior !== null) {
				cursoAnteriorEspecifico = cursos.find(c => {
					const match = c.nombre.match(/(\d+)/);
					const gradoCoincide = match && parseInt(match[1]) === infoAnterior.gradoAnterior;
					
					if (!gradoCoincide) return false;
					
					// Si hay paralelo, verificar que coincida
					if (infoAnterior.paralelo) {
						const paraleloMatch = c.nombre.match(/([A-Z])(?:\s|$)/);
						return paraleloMatch && paraleloMatch[1] === infoAnterior.paralelo;
					}
					
					// Si no hay paralelo, aceptar cualquiera con el grado correcto
					return true;
				});
			}
			
			if (!cursoAnteriorEspecifico) {
				const descripcion = infoAnterior.gradoAnterior === null 
					? `${infoAnterior.nivel} ${infoAnterior.paralelo || ''}`
					: `${infoAnterior.nivel} ${infoAnterior.gradoAnterior}${infoAnterior.paralelo || ''}`;
				alert(`No se encontró el curso "${descripcion}" en la gestión ${infoAnterior.gestion}.\n\nCursos disponibles: ${cursos.map(c => c.nombre).join(', ')}`);
				estudiantesAñoAnterior = [];
				return;
			}

			console.log(`Curso del paralelo anterior encontrado: ${cursoAnteriorEspecifico.nombre} (ID: ${cursoAnteriorEspecifico.id})`);

			// Obtener estudiantes del curso específico
			const estudiantesDelCursoAnterior = await asignacionesService.getEstudiantesPorCurso(cursoAnteriorEspecifico.id);
			
			// Filtrar los que ya están asignados al curso actual
			const asignadosIds = new Set(estudiantesAsignados.map(e => e.id));
			estudiantesAñoAnterior = estudiantesDelCursoAnterior.filter(e => !asignadosIds.has(e.id));
			
			console.log(`Estudiantes de ${cursoAnteriorEspecifico.nombre}: ${estudiantesAñoAnterior.length}`);
		} catch (error) {
			console.error('Error al cargar estudiantes del año anterior:', error);
			alert('Error al cargar estudiantes del año anterior');
			estudiantesAñoAnterior = [];
		} finally {
			isLoadingAñoAnterior = false;
		}
	}

	function toggleEstudianteAñoAnteriorSeleccion(estudianteId: number) {
		const newSet = new Set(estudiantesAñoAnteriorSeleccionados);
		if (newSet.has(estudianteId)) {
			newSet.delete(estudianteId);
		} else {
			newSet.add(estudianteId);
		}
		estudiantesAñoAnteriorSeleccionados = newSet;
	}

	function seleccionarTodosAñoAnterior() {
		if (estudiantesAñoAnteriorSeleccionados.size === estudiantesAñoAnteriorFiltrados.length) {
			estudiantesAñoAnteriorSeleccionados = new Set();
		} else {
			estudiantesAñoAnteriorSeleccionados = new Set(estudiantesAñoAnteriorFiltrados.map(est => est.id));
		}
	}

	async function handleAsignarMasivo() {
		if (estudiantesAñoAnteriorSeleccionados.size === 0) {
			alert('Seleccione al menos un estudiante');
			return;
		}

		isAssigningMasivo = true;
		let errores = 0;
		let exitosos = 0;

		try {
			for (const estudianteId of estudiantesAñoAnteriorSeleccionados) {
				try {
					await asignacionesService.asignarEstudianteCurso({
						id_estudiante: estudianteId,
						id_curso: cursoId
					});
					exitosos++;
				} catch (error) {
					errores++;
					console.error(`Error al asignar estudiante ${estudianteId}:`, error);
				}
			}

			// Limpiar y recargar
			estudiantesAñoAnteriorSeleccionados = new Set();
			searchAñoAnterior = '';
			await loadEstudiantes();
			await loadEstudiantesAñoAnterior();

			if (errores === 0) {
				alert(`${exitosos} estudiante(s) promovido(s) exitosamente`);
			} else {
				alert(`Promovidos: ${exitosos}, Errores: ${errores}`);
			}
		} finally {
			isAssigningMasivo = false;
		}
	}

	async function handleDesasignarEstudiante(estudianteId: number) {
		if (!confirm('¿Está seguro de desasignar este estudiante del curso?')) return;

		try {
			await asignacionesService.desasignarEstudianteCurso(estudianteId, cursoId);
			await loadEstudiantes();
		} catch (error: any) {
			alert(error.message || 'Error al desasignar estudiante');
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function getNivelColor(nivel: string) {
		const colors: Record<string, string> = {
			Inicial: '#FF9800',
			Primaria: '#3AC0B8',
			Secundaria: '#7A95D9'
		};
		return colors[nivel] || '#6b7280';
	}

	function getAvatarColor(nombre: string) {
		if (!nombre) return '#6b7280';
		const colors = [
			'#ef4444',
			'#f97316',
			'#f59e0b',
			'#84cc16',
			'#10b981',
			'#14b8a6',
			'#06b6d4',
			'#3b82f6',
			'#6366f1',
			'#8b5cf6',
			'#a855f7',
			'#ec4899'
		];
		const index = nombre.charCodeAt(0) % colors.length;
		return colors[index];
	}

	function getInitials(nombre: string, apellido: string): string {
		if (!nombre || !apellido) return 'XX';
		return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
	}
</script>

<div class="modal-overlay" onclick={handleOverlayClick}>
	<div class="modal-content">
		<div class="modal-header">
			<h2>{@html getIconSvg('book-open')} Detalles del Curso</h2>
			<div class="header-actions">
				{#if curso}
					<button
						class="btn-icon btn-edit"
						onclick={() => onEdit(curso!)}
						title="Editar curso"
					>
						{@html getIconSvg('edit')}
					</button>
					<button
						class="btn-icon btn-delete"
						onclick={async () => {
							if (!confirm(`¿Estás seguro de eliminar el curso ${curso?.nombre}?`)) return;
							try {
								await coursesService.deleteCurso(curso!.id);
								onDeleted();
								onClose();
							} catch (error: any) {
								alert(error.message || 'Error al eliminar curso');
							}
						}}
						title="Eliminar curso"
					>
						{@html getIconSvg('trash-2')}
					</button>
				{/if}
				<button class="btn-close" onclick={onClose}>
					{@html getIconSvg('x')}
				</button>
			</div>
		</div>

		{#if isLoading}
			<div class="loading-container">
				<div class="spinner"></div>
				<p>Cargando detalles del curso...</p>
			</div>
		{:else if curso}
			<div class="tabs">
				<button
					class="tab"
					class:active={activeTab === 'info'}
					onclick={() => (activeTab = 'info')}
				>
					{@html getIconSvg('info')}
					Información
				</button>
				<button
					class="tab"
					class:active={activeTab === 'estudiantes'}
					onclick={() => (activeTab = 'estudiantes')}
				>
					{@html getIconSvg('users')}
					Gestionar Estudiantes
					<span class="badge-count">{estudiantesAsignados.length}</span>
				</button>
			</div>

			<div class="modal-body">
				{#if activeTab === 'info'}
					<div class="info-section">
						<div class="curso-header">
							<div class="avatar" style="background-color: {getAvatarColor(curso.nombre)}">
								{getInitials(curso.nombre, curso.gestion)}
							</div>
							<div class="curso-title">
								<h3>{curso.nombre}</h3>
								<div class="badges">
									<span
										class="badge badge-nivel"
										style="background-color: {getNivelColor(curso.nivel_educativo)}"
									>
										{curso.nivel_educativo}
									</span>
									<span class="badge badge-gestion">Gestión {curso.gestion}</span>
								</div>
							</div>
						</div>

						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">{@html getIconSvg('hash')} ID</span>
								<span class="info-value">{curso.id}</span>
							</div>
							<div class="info-item">
								<span class="info-label">{@html getIconSvg('calendar')} Gestión</span>
								<span class="info-value">{curso.gestion}</span>
							</div>
							<div class="info-item">
								<span class="info-label">{@html getIconSvg('layers')} Nivel</span>
								<span class="info-value">{curso.nivel_educativo}</span>
							</div>
							<div class="info-item">
								<span class="info-label">{@html getIconSvg('users')} Estudiantes</span>
								<span class="info-value">{estudiantesAsignados.length}</span>
							</div>
						</div>

						<div class="estudiantes-list">
							<h4>Estudiantes Inscritos ({estudiantesAsignados.length})</h4>
							{#if estudiantesAsignados.length === 0}
								<div class="empty-state">
									{@html getIconSvg('user-x')}
									<p>No hay estudiantes asignados a este curso</p>
								</div>
							{:else}
								<div class="estudiantes-grid">
									{#each estudiantesAsignados as estudiante}
										<div class="estudiante-card">
											<div
												class="estudiante-avatar"
											style="background-color: {getAvatarColor(estudiante.nombres)}"
										>
											{getInitials(estudiante.nombres, estudiante.apellido_paterno)}
										</div>
										<div class="estudiante-info">
											<p class="estudiante-nombre">
												{estudiante.nombres}
													{estudiante.apellido_paterno}
													{estudiante.apellido_materno}
												</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'estudiantes'}
					<div class="estudiantes-section">
						<!-- Panel de Asignación Masiva -->
						<div class="assignment-panel">
							<div class="panel-header">
								<div class="header-content">
									{@html getIconSvg('user-plus')}
									<div>
										<h4>Asignar Estudiantes al Curso</h4>
										<p class="subtitle">Selecciona uno o más estudiantes para inscribir masivamente</p>
									</div>
								</div>
								<button
									class="btn btn-toggle"
									onclick={() => (isAddingStudent = !isAddingStudent)}
								>
									{#if isAddingStudent}
										{@html getIconSvg('chevron-up')}
										Ocultar
									{:else}
										{@html getIconSvg('chevron-down')}
										Mostrar
									{/if}
								</button>
							</div>

							{#if isAddingStudent}
								<div class="panel-body">
									<!-- Barra de búsqueda mejorada -->
									<div class="search-container">
										<div class="search-box">
											<span class="search-icon">{@html getIconSvg('search')}</span>
											<input
												type="text"
												placeholder="Buscar por nombre, apellido o CI..."
												bind:value={searchTerm}
											/>
											{#if searchTerm}
												<button 
													class="clear-search"
													onclick={() => searchTerm = ''}
													title="Limpiar búsqueda"
												>
													{@html getIconSvg('x')}
												</button>
											{/if}
										</div>
										<div class="search-info">
											{#if searchTerm}
												<span class="results-count">
													{estudiantesFiltrados.length} resultado{estudiantesFiltrados.length !== 1 ? 's' : ''}
												</span>
											{:else}
												<span class="results-count">
													{estudiantesDisponibles.length} estudiante{estudiantesDisponibles.length !== 1 ? 's' : ''} disponible{estudiantesDisponibles.length !== 1 ? 's' : ''}
												</span>
											{/if}
										</div>
									</div>

									{#if estudiantesFiltrados.length === 0}
										<div class="empty-state">
											{@html getIconSvg('user-x')}
											<p>
												{#if searchTerm}
													No se encontraron estudiantes con "{searchTerm}"
												{:else}
													No hay estudiantes disponibles para asignar
												{/if}
											</p>
										</div>
									{:else}
										<!-- Barra de acciones masivas -->
										<div class="mass-actions-bar">
											<div class="action-left">
												<label class="checkbox-label select-all">
													<input
														type="checkbox"
														checked={estudiantesSeleccionados.size > 0 && estudiantesSeleccionados.size === estudiantesFiltrados.length}
														indeterminate={estudiantesSeleccionados.size > 0 && estudiantesSeleccionados.size < estudiantesFiltrados.length}
														onchange={seleccionarTodos}
													/>
													<span class="checkmark"></span>
													<span class="label-text">
														{#if estudiantesSeleccionados.size === 0}
															Seleccionar todos
														{:else if estudiantesSeleccionados.size === estudiantesFiltrados.length}
															Todos seleccionados
														{:else}
															{estudiantesSeleccionados.size} seleccionado{estudiantesSeleccionados.size !== 1 ? 's' : ''}
														{/if}
													</span>
												</label>
											</div>
											<div class="action-right">
												<button 
													class="btn btn-primary btn-assign" 
													onclick={handleAsignarSeleccionados}
													disabled={estudiantesSeleccionados.size === 0 || isAssigning}
												>
													{#if isAssigning}
														{@html getIconSvg('loader')}
														Asignando...
													{:else}
														{@html getIconSvg('user-check')}
														Asignar {estudiantesSeleccionados.size} estudiante{estudiantesSeleccionados.size !== 1 ? 's' : ''}
													{/if}
												</button>
											</div>
										</div>

										<!-- Lista de estudiantes con checkboxes -->
										<div class="disponibles-list">
											{#each estudiantesFiltrados as estudiante}
												<label class="disponible-item" class:selected={estudiantesSeleccionados.has(estudiante.id)}>
													<div class="checkbox-container">
														<input
															type="checkbox"
															checked={estudiantesSeleccionados.has(estudiante.id)}
															onchange={() => toggleEstudianteSeleccion(estudiante.id)}
														/>
														<span class="checkmark"></span>
													</div>
													<div
														class="estudiante-avatar"
														style="background-color: {getAvatarColor(estudiante.nombres)}"
													>
														{getInitials(estudiante.nombres, estudiante.apellido_paterno)}
													</div>
													<div class="estudiante-info">
														<p class="estudiante-nombre">
															{estudiante.nombres}
															{estudiante.apellido_paterno}
															{estudiante.apellido_materno}
														</p>
														{#if estudiante.ci}
															<p class="estudiante-ci">CI: {estudiante.ci}</p>
														{/if}
													</div>
													{#if estudiantesSeleccionados.has(estudiante.id)}
														<div class="selected-badge">
															{@html getIconSvg('check')}
														</div>
													{/if}
												</label>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Panel de Asignación Masiva desde Año Anterior -->
						<div class="mass-assignment-panel">
							<div class="section-header gradient-header-masivo">
								{@html getIconSvg('arrow-up-circle')}
								<h4>Promover Estudiantes del Año Anterior</h4>
								<button 
									class="btn btn-sm btn-toggle"
									onclick={() => {
										mostrarAsignacionMasiva = !mostrarAsignacionMasiva;
										if (mostrarAsignacionMasiva && estudiantesAñoAnterior.length === 0) {
											loadEstudiantesAñoAnterior();
										}
									}}
								>
									{#if mostrarAsignacionMasiva}
										{@html getIconSvg('chevron-up')}
										Ocultar
									{:else}
										{@html getIconSvg('chevron-down')}
										Mostrar
									{/if}
								</button>
							</div>

							{#if mostrarAsignacionMasiva}
								<div class="panel-content">
									{#if isLoadingAñoAnterior}
										<div class="loading-state">
											{@html getIconSvg('loader')}
											<p>Cargando estudiantes del año anterior...</p>
										</div>
									{:else if estudiantesAñoAnterior.length === 0}
										<div class="empty-state">
											{@html getIconSvg('info')}
											<p>No hay estudiantes disponibles del curso anterior o no existe el curso del año anterior</p>
										</div>
									{:else}
										<!-- Buscador -->
										<div class="search-container">
											<div class="search-input-wrapper">
												{@html getIconSvg('search')}
												<input
													type="text"
													placeholder="Buscar estudiante por nombre..."
													bind:value={searchAñoAnterior}
													class="search-input"
												/>
												{#if searchAñoAnterior}
													<button 
														class="btn-clear"
														onclick={() => searchAñoAnterior = ''}
													>
														{@html getIconSvg('x')}
													</button>
												{/if}
											</div>
											<span class="search-results-count">
												{estudiantesAñoAnteriorFiltrados.length} resultado{estudiantesAñoAnteriorFiltrados.length !== 1 ? 's' : ''}
											</span>
										</div>

										<!-- Barra de acciones masivas -->
										<div class="mass-actions-bar">
											<div class="action-left">
												<label class="select-all-label">
													<input
														type="checkbox"
														checked={estudiantesAñoAnteriorSeleccionados.size > 0 && estudiantesAñoAnteriorSeleccionados.size === estudiantesAñoAnteriorFiltrados.length}
														indeterminate={estudiantesAñoAnteriorSeleccionados.size > 0 && estudiantesAñoAnteriorSeleccionados.size < estudiantesAñoAnteriorFiltrados.length}
														onchange={seleccionarTodosAñoAnterior}
													/>
													<span class="checkmark"></span>
													<span class="label-text">
														{#if estudiantesAñoAnteriorSeleccionados.size === 0}
															Seleccionar todos
														{:else if estudiantesAñoAnteriorSeleccionados.size === estudiantesAñoAnteriorFiltrados.length}
															Todos seleccionados
														{:else}
															{estudiantesAñoAnteriorSeleccionados.size} seleccionado{estudiantesAñoAnteriorSeleccionados.size !== 1 ? 's' : ''}
														{/if}
													</span>
												</label>
											</div>
											<div class="action-right">
												<button 
													class="btn btn-success btn-promote" 
													onclick={handleAsignarMasivo}
													disabled={estudiantesAñoAnteriorSeleccionados.size === 0 || isAssigningMasivo}
												>
													{#if isAssigningMasivo}
														{@html getIconSvg('loader')}
														Promoviendo...
													{:else}
														{@html getIconSvg('arrow-up-circle')}
														Promover {estudiantesAñoAnteriorSeleccionados.size} estudiante{estudiantesAñoAnteriorSeleccionados.size !== 1 ? 's' : ''}
													{/if}
												</button>
											</div>
										</div>

										<!-- Lista de estudiantes del año anterior -->
										<div class="disponibles-list">
											{#each estudiantesAñoAnteriorFiltrados as estudiante}
												<label class="disponible-item" class:selected={estudiantesAñoAnteriorSeleccionados.has(estudiante.id)}>
													<div class="checkbox-container">
														<input
															type="checkbox"
															checked={estudiantesAñoAnteriorSeleccionados.has(estudiante.id)}
															onchange={() => toggleEstudianteAñoAnteriorSeleccion(estudiante.id)}
														/>
														<span class="checkmark"></span>
													</div>
													<div
														class="estudiante-avatar"
														style="background-color: {getAvatarColor(estudiante.nombres)}"
													>
														{getInitials(estudiante.nombres, estudiante.apellido_paterno)}
													</div>
													<div class="estudiante-info">
														<p class="estudiante-nombre">
															{estudiante.nombres}
															{estudiante.apellido_paterno}
															{estudiante.apellido_materno}
														</p>
														{#if estudiante.ci}
															<p class="estudiante-ci">CI: {estudiante.ci}</p>
														{/if}
													</div>
													{#if estudiantesAñoAnteriorSeleccionados.has(estudiante.id)}
														<div class="selected-badge">
															{@html getIconSvg('check')}
														</div>
													{/if}
												</label>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Lista de Estudiantes Asignados -->
						<div class="assigned-students-panel">
							<div class="section-header">
							<h4>{@html getIconSvg('users')} Estudiantes Asignados ({estudiantesAsignados.length})</h4>
						</div>

						{#if estudiantesAsignados.length === 0}
							<div class="empty-state">
								{@html getIconSvg('user-x')}
								<p>No hay estudiantes asignados a este curso</p>
							</div>
						{:else}
							<div class="asignados-list">
								{#each estudiantesAsignados as estudiante}
									<div class="asignado-item">
										<div
											class="estudiante-avatar"
											style="background-color: {getAvatarColor(estudiante.nombres)}"
										>
											{getInitials(estudiante.nombres, estudiante.apellido_paterno)}
										</div>
										<div class="estudiante-info">
											<p class="estudiante-nombre">
												{estudiante.nombres}
												{estudiante.apellido_paterno}
												{estudiante.apellido_materno}
											</p>
										</div>
										<button
											class="btn btn-sm btn-remove"
											onclick={() => handleDesasignarEstudiante(estudiante.id)}
										>
											{@html getIconSvg('x')}
											Desasignar
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
		{:else}
			<div class="error-container">
				<p>Error al cargar el curso</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		background: white;
		flex-shrink: 0;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.modal-header h2 :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
	}

	.btn-edit {
		color: #3b82f6;
	}

	.btn-edit:hover {
		background: #dbeafe;
	}

	.btn-delete {
		color: #ef4444;
	}

	.btn-delete:hover {
		background: #fee2e2;
	}

	.btn-close {
		color: #6b7280;
	}

	.btn-close:hover {
		color: #1f2937;
		background: #f3f4f6;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
		background: white;
		flex-shrink: 0;
	}

	.tab {
		flex: 1;
		padding: 1rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.tab :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.tab.active {
		color: #27C5DA;
		border-bottom-color: #27C5DA;
	}

	.tab:hover {
		background: #f9fafb;
	}

	.badge-count {
		background: #27C5DA;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid #e5e7eb;
		border-top-color: #27C5DA;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.curso-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.avatar,
	.estudiante-avatar {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.5rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.estudiante-avatar {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1rem;
	}

	.curso-title h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
	}

	.badge-nivel {
		text-transform: uppercase;
	}

	.badge-gestion {
		background: #6b7280;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-label {
		font-size: 0.875rem;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.info-label :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.info-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	.estudiantes-list h4,
	.section-header h4 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h4 :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.estudiantes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.estudiante-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.estudiante-info {
		flex: 1;
		min-width: 0;
	}

	.estudiante-nombre {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
		color: #9ca3af;
	}

	.empty-state :global(svg) {
		width: 3rem;
		height: 3rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Panel de Asignación */
	.assignment-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		background: linear-gradient(135deg, #27C5DA 0%, #22b0c4 100%);
		color: white;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-content :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
	}

	.header-content h4 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
	}

	.subtitle {
		margin: 0.25rem 0 0 0;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.panel-body {
		padding: 1.25rem;
	}

	/* Búsqueda mejorada */
	.search-container {
		margin-bottom: 1rem;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.search-box input {
		width: 100%;
		padding: 0.75rem 2.75rem 0.75rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.search-box input:focus {
		outline: none;
		border-color: #27C5DA;
		box-shadow: 0 0 0 4px rgba(39, 197, 218, 0.1);
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.clear-search:hover {
		background: #f3f4f6;
		color: #6b7280;
	}

	.clear-search :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.search-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.results-count {
		font-weight: 500;
	}

	/* Barra de acciones masivas */
	.mass-actions-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem;
		background: #f9fafb;
		border: 2px dashed #e5e7eb;
		border-radius: 8px;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.action-left, .action-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.select-all {
		font-weight: 500;
		color: #374151;
	}

	.label-text {
		margin-left: 0.5rem;
	}

	.btn-assign {
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(39, 197, 218, 0.2);
	}

	.btn-assign:hover:not(:disabled) {
		box-shadow: 0 4px 8px rgba(39, 197, 218, 0.3);
		transform: translateY(-1px);
	}

	.disponibles-list,
	.asignados-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		max-height: 400px;
		overflow-y: auto;
		padding-right: 0.25rem;
	}

	.disponibles-list::-webkit-scrollbar,
	.asignados-list::-webkit-scrollbar {
		width: 8px;
	}

	.disponibles-list::-webkit-scrollbar-track,
	.asignados-list::-webkit-scrollbar-track {
		background: #f3f4f6;
		border-radius: 4px;
	}

	.disponibles-list::-webkit-scrollbar-thumb,
	.asignados-list::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 4px;
	}

	.disponibles-list::-webkit-scrollbar-thumb:hover,
	.asignados-list::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	.disponible-item {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		user-select: none;
	}

	.disponible-item:hover {
		background: #f9fafb;
		border-color: #27C5DA;
		transform: translateX(2px);
	}

	.disponible-item.selected {
		background: #ecfeff;
		border-color: #27C5DA;
		box-shadow: 0 0 0 3px rgba(39, 197, 218, 0.1);
	}

	.checkbox-container {
		flex-shrink: 0;
	}

	.asignado-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.asignado-item:hover {
		border-color: #d1d5db;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		border: none;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		transition: all 0.2s;
	}

	.btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
	}

	.btn-toggle {
		background: white;
		color: #27C5DA;
		border: 1px solid #27C5DA;
	}

	.btn-toggle:hover {
		background: #27C5DA;
		color: white;
	}

	.btn-add {
		background: #27C5DA;
		color: white;
	}

	.btn-add:hover {
		background: #22b0c4;
	}

	.btn-remove {
		background: #ef4444;
		color: white;
	}

	.btn-remove:hover {
		background: #dc2626;
	}

	.btn-primary {
		background: #27C5DA;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #22b0c4;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Checkbox mejorado */
	.checkbox-label {
		position: relative;
		display: flex;
		align-items: center;
		cursor: pointer;
		user-select: none;
		flex-shrink: 0;
	}

	.checkbox-label input {
		position: absolute;
		opacity: 0;
		cursor: pointer;
		height: 0;
		width: 0;
	}

	.checkmark {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 22px;
		width: 22px;
		background-color: white;
		border: 2px solid #d1d5db;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.checkbox-label:hover .checkmark {
		border-color: #27C5DA;
		box-shadow: 0 0 0 3px rgba(39, 197, 218, 0.1);
	}

	.checkbox-label input:checked ~ .checkmark {
		background-color: #27C5DA;
		border-color: #27C5DA;
	}

	.checkbox-label input:checked ~ .checkmark::after {
		content: '';
		position: absolute;
		display: block;
		left: 6px;
		top: 2px;
		width: 5px;
		height: 10px;
		border: solid white;
		border-width: 0 2.5px 2.5px 0;
		transform: rotate(45deg);
	}

	.selected-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: #27C5DA;
		border-radius: 50%;
		color: white;
		flex-shrink: 0;
	}

	.selected-badge :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.estudiante-ci {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0.25rem 0 0 0;
	}

	.assigned-students-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
	}

	.selection-actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		flex-wrap: wrap;
	}

	.disponible-item {
		transition: background-color 0.2s;
	}

	.disponible-item:hover {
		background: #f9fafb;
	}

	/* Estilos para el panel de asignación masiva del año anterior */
	.gradient-header-masivo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: linear-gradient(135deg, #10B981 0%, #059669 100%);
		color: white;
	}

	.gradient-header-masivo :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.gradient-header-masivo h4 {
		margin: 0;
		flex: 1;
		font-size: 1rem;
		font-weight: 600;
	}

	.btn-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-toggle:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.btn-toggle :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.btn-success {
		background: linear-gradient(135deg, #10B981 0%, #059669 100%);
		color: white;
		border: none;
	}

	.btn-success:hover:not(:disabled) {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
	}

	.btn-success:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.btn-promote {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
	}

	.btn-promote:hover:not(:disabled) {
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
	}

	.panel-content {
		padding: 1.25rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: #6b7280;
	}

	.loading-state :global(svg) {
		width: 2.5rem;
		height: 2.5rem;
		animation: spin 1s linear infinite;
	}

	@media (max-width: 640px) {
		.modal-content {
			max-width: 100%;
			max-height: 100vh;
			border-radius: 0;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.estudiantes-grid {
			grid-template-columns: 1fr;
		}

		.gradient-header-masivo {
			flex-direction: column;
			align-items: flex-start;
		}

		.mass-actions-bar {
			flex-direction: column;
			gap: 0.75rem;
		}

		.action-left, .action-right {
			width: 100%;
		}

		.btn-promote, .btn-assign {
			width: 100%;
			justify-content: center;
		}
	}
</style>
