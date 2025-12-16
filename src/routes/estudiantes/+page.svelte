<script lang="ts">
	import { onMount } from 'svelte';
	import { getIconSvg } from '$lib/components/svg.js';
	import { estudiantesService, type EstudianteResponse } from '$lib/services/estudiantes';
	import { coursesService, type CursoResponse } from '$lib/services/courses';
	import CreateEstudiante from './CreateEstudiante.svelte';
	import EditarEstudiante from './EditarEstudiante.svelte';
	import DetallesEstudiante from './DetallesEstudiante.svelte';

	// ==================== ESTADO ====================
	let estudiantes: EstudianteResponse[] = [];
	let cursos: CursoResponse[] = [];
	let gestiones: string[] = [];
	let isLoading = true;
	let searchQuery = '';
	let gestionSeleccionada = new Date().getFullYear().toString();
	let nivelSeleccionado = 'Todos';
	let cursoSeleccionado = '';
	let estadoSeleccionado = 'Activo';

	// Modales
	let mostrarNuevo = false;
	let mostrarEditar = false;
	let mostrarDetalles = false;
	let mostrarCambiarEstado = false;
	let estudianteSeleccionado: EstudianteResponse | null = null;

	// Mensajes
	let successMessage = '';
	let errorMessage = '';
	let fileInput: HTMLInputElement;

	// ==================== UTILIDADES ====================
	function getInitials(estudiante: EstudianteResponse): string {
		const ap = estudiante.apellido_paterno?.[0] || '';
		const n = estudiante.nombres.split(' ')[0]?.[0] || '';
		return (ap + n).toUpperCase() || '?';
	}

	function getAvatarColor(estudiante: EstudianteResponse): string {
		const colors = [
			'#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
			'#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
		];
		const index = estudiante.id % colors.length;
		return colors[index];
	}

	function getFullName(estudiante: EstudianteResponse): string {
		return `${estudiante.nombres} ${estudiante.apellido_paterno} ${estudiante.apellido_materno}`.trim();
	}

	function getCursosDeGestion(estudiante: EstudianteResponse): any[] {
		if (!estudiante.cursos || estudiante.cursos.length === 0) {
			console.log('Estudiante sin cursos:', estudiante.nombres);
			return [];
		}
		if (!gestionSeleccionada) return estudiante.cursos;
		const cursosGestion = estudiante.cursos.filter(curso => curso.gestion === gestionSeleccionada);
		console.log(`Cursos de ${estudiante.nombres} en gestión ${gestionSeleccionada}:`, cursosGestion);
		return cursosGestion;
	}

	function showSuccess(message: string) {
		successMessage = message;
		setTimeout(() => (successMessage = ''), 3000);
	}

	function showError(message: string) {
		errorMessage = message;
		setTimeout(() => (errorMessage = ''), 5000);
	}

	// ==================== CARGA DE DATOS ====================
	async function cargarGestiones() {
		try {
			gestiones = await coursesService.getGestiones();
			const currentYear = new Date().getFullYear().toString();
			if (gestiones.length > 0) {
				// Usar el año actual si existe, sino la primera gestión
				if (gestiones.includes(currentYear)) {
					gestionSeleccionada = currentYear;
				} else if (!gestionSeleccionada || !gestiones.includes(gestionSeleccionada)) {
					gestionSeleccionada = gestiones[0];
				}
			}
		} catch (error) {
			console.error('Error al cargar gestiones:', error);
			gestiones = [];
		}
	}

	async function cargarCursos() {
		try {
			if (!gestionSeleccionada) return;

			if (nivelSeleccionado === 'Todos') {
				const response = await coursesService.getCursos();
				cursos = response.filter((c) => c.gestion === gestionSeleccionada);
			} else {
				cursos = await coursesService.getCursosPorGestionYNivel(
					gestionSeleccionada,
					nivelSeleccionado
				);
			}
		} catch (error: any) {
			console.error('Error al cargar cursos:', error);
			cursos = [];
		}
	}

	async function cargarEstudiantes() {
		isLoading = true;
		try {
			const params: any = {};
			if (gestionSeleccionada) {
				const nivel = nivelSeleccionado !== 'Todos' ? nivelSeleccionado : undefined;
				const cursoId = cursoSeleccionado ? parseInt(cursoSeleccionado) : undefined;
				estudiantes = await estudiantesService.getEstudiantesPorGestion(gestionSeleccionada, {
					nivel,
					curso_id: cursoId
				});
			} else {
				estudiantes = await estudiantesService.getEstudiantes();
			}
			console.log('Estudiantes cargados:', estudiantes);
			if (estudiantes.length > 0) {
				console.log('Primer estudiante:', estudiantes[0]);
				console.log('Cursos del primer estudiante:', estudiantes[0].cursos);
			}
		} catch (error: any) {
			showError(error.message || 'Error al cargar estudiantes');
			estudiantes = [];
		} finally {
			isLoading = false;
		}
	}

	// ==================== FILTROS ====================
	$: estudiantesFiltrados = estudiantes
		.filter((e) => {
			if (estadoSeleccionado !== 'Todos' && e.estado !== estadoSeleccionado) {
				return false;
			}
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const nombreCompleto = getFullName(e).toLowerCase();
				const ci = e.ci?.toLowerCase() || '';
				return nombreCompleto.includes(query) || ci.includes(query);
			}
			return true;
		});

	// ==================== EVENTOS ====================
	async function handleGestionChange() {
		cursoSeleccionado = '';
		await cargarCursos();
		await cargarEstudiantes();
	}

	async function handleNivelChange() {
		cursoSeleccionado = '';
		await cargarCursos();
		await cargarEstudiantes();
	}

	async function handleCursoChange() {
		await cargarEstudiantes();
	}

	function handleVerEstudiante(estudiante: EstudianteResponse) {
		estudianteSeleccionado = estudiante;
		mostrarDetalles = true;
	}

	function handleAbrirCambiarEstado(estudiante: EstudianteResponse) {
		estudianteSeleccionado = estudiante;
		mostrarCambiarEstado = true;
	}

	async function handleCambiarEstado(nuevoEstado: string) {
		if (!estudianteSeleccionado) return;
		
		if (estudianteSeleccionado.estado === nuevoEstado) {
			mostrarCambiarEstado = false;
			return;
		}

		try {
			await estudiantesService.cambiarEstado(estudianteSeleccionado.id, nuevoEstado);
			showSuccess(`Estado cambiado a ${nuevoEstado}`);
			await cargarEstudiantes();
			mostrarCambiarEstado = false;
			estudianteSeleccionado = null;
		} catch (error: any) {
			showError(error.message || 'Error al cambiar el estado');
		}
	}

	function handleEditarEstudiante(estudiante: EstudianteResponse) {
		estudianteSeleccionado = estudiante;
		mostrarEditar = true;
	}

	async function handleEstudianteCreado() {
		mostrarNuevo = false;
		showSuccess('Estudiante creado exitosamente');
		await cargarEstudiantes();
	}

	async function handleEstudianteEditado() {
		mostrarEditar = false;
		showSuccess('Estudiante actualizado exitosamente');
		await cargarEstudiantes();
	}

	function handleDetallesCerrado() {
		mostrarDetalles = false;
		estudianteSeleccionado = null;
	}

	// ==================== IMPORTAR/EXPORTAR ====================
	async function handleExportar() {
		try {
			const blob = await estudiantesService.exportarEstudiantes();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			showSuccess('Estudiantes exportados exitosamente');
		} catch (error: any) {
			showError(error.message || 'Error al exportar estudiantes');
		}
	}

	async function handleDescargarPlantilla() {
		try {
			const blob = await estudiantesService.descargarPlantilla();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'plantilla_estudiantes.xlsx';
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			showSuccess('Plantilla descargada exitosamente');
		} catch (error: any) {
			showError(error.message || 'Error al descargar plantilla');
		}
	}

	async function handleImportar() {
		fileInput.click();
	}

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const result = await estudiantesService.importarEstudiantes(file);
			showSuccess(
				`Importación exitosa: ${result.insertados || 0} insertados, ${result.actualizados || 0} actualizados`
			);
			await cargarEstudiantes();
		} catch (error: any) {
			showError(error.message || 'Error al importar estudiantes');
		} finally {
			target.value = '';
		}
	}

	// ==================== CICLO DE VIDA ====================
	onMount(async () => {
		await cargarGestiones();
		await cargarCursos();
		await cargarEstudiantes();
	});
</script>

<div class="estudiantes-page">
	<!-- Mensajes -->
	{#if successMessage}
		<div class="alert alert-success">
			<div class="alert-bar"></div>
			<span>{successMessage}</span>
		</div>
	{/if}

	{#if errorMessage}
		<div class="alert alert-error">
			<div class="alert-bar"></div>
			<span>{errorMessage}</span>
		</div>
	{/if}

	<!-- Encabezado -->
	<div class="page-header">
		<div class="header-left">
			<h1>{@html getIconSvg('users')} Gestión de Estudiantes</h1>
		</div>
		<div class="header-right">
			<button class="btn btn-secondary" onclick={handleDescargarPlantilla}>
				{@html getIconSvg('download')}
				Plantilla
			</button>
			<button class="btn btn-secondary" onclick={handleImportar}>
				{@html getIconSvg('upload')}
				Importar
			</button>
			<button class="btn btn-secondary" onclick={handleExportar}>
				{@html getIconSvg('download')}
				Exportar
			</button>
			<button class="btn btn-primary" onclick={() => (mostrarNuevo = true)}>
				{@html getIconSvg('plus')}
				Nuevo Estudiante
			</button>
		</div>
	</div>

	<!-- Input oculto para importar -->
	<input
		type="file"
		accept=".xlsx,.xls"
		bind:this={fileInput}
		onchange={handleFileChange}
		style="display: none;"
	/>

	<!-- Filtros -->
	<div class="filters">
		<!-- Búsqueda -->
		<div class="filter-group">
			<div class="search-box">
				{@html getIconSvg('search')}
				<input
					type="text"
					placeholder="Buscar por nombre o CI..."
					bind:value={searchQuery}
				/>
			</div>
		</div>

		<!-- Filtro de Gestión -->
		<div class="filter-group">
			<div class="select-wrapper">
				{@html getIconSvg('calendar')}
				<select bind:value={gestionSeleccionada} onchange={handleGestionChange}>
					<option value="">Todas las gestiones</option>
					{#each gestiones as gestion}
						<option value={gestion}>Gestión {gestion}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Filtro de Nivel -->
		<div class="filter-group">
			<div class="select-wrapper">
				{@html getIconSvg('layers')}
				<select bind:value={nivelSeleccionado} onchange={handleNivelChange}>
					<option value="Todos">Todos los niveles</option>
					<option value="Inicial">Inicial</option>
					<option value="Primaria">Primaria</option>
					<option value="Secundaria">Secundaria</option>
				</select>
			</div>
		</div>

		<!-- Filtro de Curso -->
		<div class="filter-group">
			<div class="select-wrapper">
				{@html getIconSvg('book-open')}
				<select bind:value={cursoSeleccionado} onchange={handleCursoChange}>
					<option value="">Todos los cursos</option>
					{#each cursos as curso}
						<option value={curso.id}>{curso.nombre}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Filtro de Estado -->
		<div class="filter-group">
			<div class="select-wrapper">
				{@html getIconSvg('filter')}
				<select bind:value={estadoSeleccionado}>
					<option value="Activo">Activos</option>
					<option value="Todos">Todos los estados</option>
					<option value="Retirado">Retirado</option>
					<option value="Abandono">Abandono</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Contenido -->
	<div class="content">
		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Cargando estudiantes...</p>
			</div>
		{:else if estudiantesFiltrados.length === 0}
			<div class="empty-state">
				{@html getIconSvg('users')}
				<h3>No se encontraron estudiantes</h3>
				<p>Intenta ajustar los filtros o crea un nuevo estudiante</p>
				<button class="btn btn-primary" onclick={() => (mostrarNuevo = true)}>
					{@html getIconSvg('plus')}
					Crear Primer Estudiante
				</button>
			</div>
		{:else}
			<div class="estudiantes-list">
				{#each estudiantesFiltrados as estudiante (estudiante.id)}
					<div class="estudiante-card">
						<div class="card-avatar" style="background-color: {getAvatarColor(estudiante)}">
							{getInitials(estudiante)}
						</div>
						<div class="card-info">
							<h3>{getFullName(estudiante)}</h3>
							<div class="card-badges">
								{#if getCursosDeGestion(estudiante).length > 0}
									{#each getCursosDeGestion(estudiante) as curso}
										<span class="badge badge-curso">{curso.nombre_curso || curso.nombre || curso.curso}</span>
									{/each}
								{:else}
									<span class="badge badge-no-curso">Sin curso asignado en {gestionSeleccionada || 'esta gestión'}</span>
								{/if}
							</div>
						</div>
						<div class="card-actions">
							<button class="btn btn-sm btn-info" onclick={() => handleVerEstudiante(estudiante)}>
								{@html getIconSvg('eye')}
								Ver
							</button>
							<button class="btn btn-sm btn-primary" onclick={() => handleEditarEstudiante(estudiante)}>
								{@html getIconSvg('edit')}
								Editar
							</button>
							<button 
								class="btn btn-sm btn-estado btn-estado-{estudiante.estado.toLowerCase()}"
								onclick={() => handleAbrirCambiarEstado(estudiante)}
							>
								{estudiante.estado}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Modales -->
{#if mostrarNuevo}
	<CreateEstudiante
		onClose={() => (mostrarNuevo = false)}
		onSuccess={handleEstudianteCreado}
	/>
{/if}

{#if mostrarEditar && estudianteSeleccionado}
	<EditarEstudiante
		estudiante={estudianteSeleccionado}
		onClose={() => {
			mostrarEditar = false;
			estudianteSeleccionado = null;
		}}
		onSuccess={handleEstudianteEditado}
	/>
{/if}

{#if mostrarDetalles && estudianteSeleccionado}
	<DetallesEstudiante
		estudianteId={estudianteSeleccionado.id}
		onClose={handleDetallesCerrado}
		onEdit={(e) => {
			mostrarDetalles = false;
			handleEditarEstudiante(e);
		}}
		onEstadoChanged={async () => {
			mostrarDetalles = false;
			showSuccess('Estado del estudiante actualizado exitosamente');
			await cargarEstudiantes();
		}}
	/>
{/if}

{#if mostrarCambiarEstado && estudianteSeleccionado}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) mostrarCambiarEstado = false; }}>
		<div class="modal-estado">
			<div class="modal-header-estado">
				<h3>Cambiar Estado del Estudiante</h3>
				<button class="btn-close" onclick={() => (mostrarCambiarEstado = false)}>
					{@html getIconSvg('x')}
				</button>
			</div>
			<div class="modal-body-estado">
				<p class="estudiante-nombre">{getFullName(estudianteSeleccionado)}</p>
				<p class="estado-actual">Estado actual: <span class="badge-estado-modal badge-{estudianteSeleccionado.estado.toLowerCase()}">{estudianteSeleccionado.estado}</span></p>
				<p class="instruccion">Selecciona el nuevo estado:</p>
				<div class="opciones-estado">
					<button
						class="opcion-btn opcion-activo"
						class:active={estudianteSeleccionado.estado === 'Activo'}
						onclick={() => handleCambiarEstado('Activo')}
						disabled={estudianteSeleccionado.estado === 'Activo'}
					>
						<div class="opcion-icon">{@html getIconSvg('check-circle')}</div>
						<div class="opcion-info">
							<strong>Activo</strong>
							<small>El estudiante está activo y asistiendo</small>
						</div>
					</button>
					<button
						class="opcion-btn opcion-retirado"
						class:active={estudianteSeleccionado.estado === 'Retirado'}
						onclick={() => handleCambiarEstado('Retirado')}
						disabled={estudianteSeleccionado.estado === 'Retirado'}
					>
						<div class="opcion-icon">{@html getIconSvg('x-circle')}</div>
						<div class="opcion-info">
							<strong>Retirado</strong>
							<small>El estudiante se ha retirado formalmente</small>
						</div>
					</button>
					<button
						class="opcion-btn opcion-abandono"
						class:active={estudianteSeleccionado.estado === 'Abandono'}
						onclick={() => handleCambiarEstado('Abandono')}
						disabled={estudianteSeleccionado.estado === 'Abandono'}
					>
						<div class="opcion-icon">{@html getIconSvg('alert-circle')}</div>
						<div class="opcion-info">
							<strong>Abandono</strong>
							<small>El estudiante abandonó sin aviso formal</small>
						</div>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.estudiantes-page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Alertas */
	.alert {
		position: fixed;
		top: 1rem;
		right: 1rem;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 1rem;
		animation: slideIn 0.3s ease-out;
	}

	.alert-bar {
		width: 4px;
		height: 100%;
		border-radius: 4px;
		position: absolute;
		left: 0;
		top: 0;
	}

	.alert-success {
		background: #d1fae5;
		color: #065f46;
		border-left: 4px solid #10b981;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border-left: 4px solid #ef4444;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Encabezado */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header-left h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-left h1 :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	.header-right {
		display: flex;
		gap: 0.75rem;
	}

	/* Botones */
	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: 8px;
		border: none;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.btn-secondary {
		background: white;
		color: #4b5563;
		border: 1px solid #e5e7eb;
	}

	.btn-secondary:hover {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	.btn-info {
		background: #0ea5e9;
		color: white;
	}

	.btn-info:hover {
		background: #0284c7;
	}

	.btn-sm {
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
	}

	/* Filtros */
	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.filter-group {
		flex: 1;
		min-width: 200px;
	}

	.search-box,
	.select-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-box :global(svg),
	.select-wrapper :global(svg) {
		position: absolute;
		left: 0.875rem;
		width: 1.25rem;
		height: 1.25rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-box input,
	.select-wrapper select {
		width: 100%;
		padding: 0.625rem 0.875rem 0.625rem 2.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.search-box input:focus,
	.select-wrapper select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Contenido */
	.content {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: visible;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 4px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.empty-state :global(svg) {
		width: 4rem;
		height: 4rem;
		color: #d1d5db;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	/* Lista de estudiantes */
	.estudiantes-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow: visible;
	}

	.estudiante-card {
		display: flex;
		align-items: flex-start;
		padding: 1.25rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		transition: all 0.2s;
		position: relative;
	}

	.estudiante-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
		transform: translateY(-2px);
	}

	.card-avatar {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.25rem;
		font-weight: 700;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.card-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}

	.card-info h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.card-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge-curso {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-more {
		background: #f3f4f6;
		color: #6b7280;
	}

	.badge-no-curso {
		background: #fef3c7;
		color: #92400e;
	}

	.btn-estado {
		font-weight: 600;
		text-transform: capitalize;
		min-width: 110px;
	}

	.btn-estado :global(svg) {
		width: 0.875rem;
		height: 0.875rem;
		transition: transform 0.2s;
	}

	.btn-estado-activo {
		background: #10b981;
		color: white;
	}

	.btn-estado-activo:hover {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
	}

	.btn-estado-retirado {
		background: #ef4444;
		color: white;
	}

	.btn-estado-retirado:hover {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
	}

	.btn-estado-abandono {
		background: #f59e0b;
		color: white;
	}

	.btn-estado-abandono:hover {
		background: #d97706;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.estado-menu-wrapper {
		position: relative;
	}

	.estado-menu-wrapper button.btn-estado {
		position: relative;
		z-index: 1;
	}

	.estado-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3), 0 10px 15px -5px rgba(0, 0, 0, 0.2);
		z-index: 1000;
		min-width: 150px;
		overflow: visible;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-item {
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.menu-item:hover {
		background: #f9fafb;
	}

	.menu-item.active {
		background: #eff6ff;
		color: #1e40af;
		font-weight: 600;
	}

	.status-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	.status-dot.status-activo {
		background: #10b981;
	}

	.status-dot.status-retirado {
		background: #ef4444;
	}

	.status-dot.status-abandono {
		background: #f59e0b;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.estudiantes-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-right {
			width: 100%;
			flex-wrap: wrap;
		}

		.filters {
			flex-direction: column;
		}

		.estudiante-card {
			flex-wrap: wrap;
		}

		.card-actions {
			width: 100%;
			margin-left: 0;
			margin-top: 1rem;
			justify-content: flex-end;
		}
	}

	/* Modal de cambio de estado */
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

	.modal-estado {
		background: white;
		border-radius: 12px;
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-header-estado {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header-estado h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0;
	}

	.modal-body-estado {
		padding: 1.5rem;
	}

	.estudiante-nombre {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.estado-actual {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.badge-estado-modal {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge-activo {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-retirado {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge-abandono {
		background: #fef3c7;
		color: #92400e;
	}

	.instruccion {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 1rem;
	}

	.opciones-estado {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.opcion-btn {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.opcion-btn:hover:not(:disabled) {
		border-color: #3b82f6;
		background: #eff6ff;
		transform: translateX(4px);
	}

	.opcion-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.opcion-btn.active {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.opcion-icon {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.opcion-icon :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.opcion-activo .opcion-icon {
		background: #d1fae5;
		color: #10b981;
	}

	.opcion-retirado .opcion-icon {
		background: #fee2e2;
		color: #ef4444;
	}

	.opcion-abandono .opcion-icon {
		background: #fef3c7;
		color: #f59e0b;
	}

	.opcion-info {
		flex: 1;
	}

	.opcion-info strong {
		display: block;
		font-size: 1rem;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.opcion-info small {
		display: block;
		font-size: 0.8125rem;
		color: #6b7280;
	}
</style>
