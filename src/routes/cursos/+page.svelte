<script lang="ts">
	import { onMount } from 'svelte';
	import { getIconSvg } from '$lib/components/svg.js';
	import { coursesService, type CursoResponse } from '$lib/services/courses';
	import CreateCurso from './CreateCurso.svelte';
	import EditarCurso from './EditarCurso.svelte';
	import DetallesCurso from './DetallesCurso.svelte';
	import CopiarGestion from './CopiarGestion.svelte';

	// ==================== ESTADO ====================
	let cursos = $state<CursoResponse[]>([]);
	let gestiones = $state<string[]>([]);
	let isLoading = $state(true);
	let searchQuery = $state('');
	let nivelSeleccionado = $state('Todos');
	let gestionSeleccionada = $state('');

	// Modales
	let mostrarNuevo = $state(false);
	let mostrarEditar = $state(false);
	let mostrarDetalles = $state(false);
	let mostrarCopiarGestion = $state(false);
	let cursoSeleccionado = $state<CursoResponse | null>(null);

	// Mensajes
	let successMessage = $state('');
	let errorMessage = $state('');

	// ==================== UTILIDADES ====================
	function getInitials(curso: CursoResponse): string {
		if (!curso || !curso.nombre) return 'XX';
		const words = curso.nombre.split(' ');
		if (words.length >= 2) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return curso.nombre.substring(0, 2).toUpperCase();
	}

	function getAvatarColor(curso: CursoResponse): string {
		if (!curso || !curso.nombre) return '#6b7280';
		const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
		const index = curso.id % colors.length;
		return colors[index];
	}

	function getNivelColor(nivel: string): string {
		const colors: Record<string, string> = {
			'Inicial': '#FF9800',
			'Primaria': '#3AC0B8',
			'Secundaria': '#7A95D9'
		};
		return colors[nivel] || '#6b7280';
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
			const gestionesList = await coursesService.getGestiones();
			console.log('[Cursos] Gestiones cargadas:', gestionesList);
			if (gestionesList.length > 0) {
				gestiones = gestionesList;
				// Si no hay gestión seleccionada o la actual no existe, seleccionar la primera (más reciente)
				if (!gestionSeleccionada || !gestiones.includes(gestionSeleccionada)) {
					gestionSeleccionada = gestiones[0];
				}
				console.log('[Cursos] Gestión seleccionada:', gestionSeleccionada);
			} else {
				// Si no hay cursos, mostrar solo el año actual
				const currentYear = new Date().getFullYear().toString();
				gestiones = [currentYear];
				gestionSeleccionada = currentYear;
				console.log('[Cursos] Sin cursos, usando año actual:', currentYear);
			}
		} catch (error: any) {
			console.error('Error al cargar gestiones:', error);
			const currentYear = new Date().getFullYear().toString();
			gestiones = [currentYear];
			gestionSeleccionada = currentYear;
		}
	}

	async function cargarCursos() {
		isLoading = true;
		try {
			if (nivelSeleccionado !== 'Todos' && gestionSeleccionada) {
				cursos = await coursesService.getCursosPorGestionYNivel(
					gestionSeleccionada,
					nivelSeleccionado
				);
			} else if (gestionSeleccionada) {
				cursos = await coursesService.getCursosPorGestion(gestionSeleccionada);
			} else if (nivelSeleccionado !== 'Todos') {
				cursos = await coursesService.getCursosPorNivel(nivelSeleccionado);
			} else {
				cursos = await coursesService.getCursos();
			}
		} catch (error: any) {
			showError(error.message || 'Error al cargar cursos');
			cursos = [];
		} finally {
			isLoading = false;
		}
	}

	// ==================== FILTROS ====================
	let cursosFiltrados = $derived(
		cursos.filter((c) => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return c.nombre.toLowerCase().includes(query);
			}
			return true;
		})
	);

	// ==================== EVENTOS ====================
	async function handleNivelChange() {
		await cargarCursos();
	}

	async function handleGestionChange() {
		await cargarCursos();
	}

	function handleVerCurso(curso: CursoResponse) {
		cursoSeleccionado = curso;
		mostrarDetalles = true;
	}

	function handleEditarCurso(curso: CursoResponse) {
		cursoSeleccionado = curso;
		mostrarEditar = true;
	}

	async function handleEliminarCurso(curso: CursoResponse) {
		if (!confirm(`¿Estás seguro de eliminar el curso ${curso.nombre}?`)) {
			return;
		}

		try {
			await coursesService.deleteCurso(curso.id);
			showSuccess('Curso eliminado exitosamente');
			await cargarCursos();
		} catch (error: any) {
			showError(error.message || 'Error al eliminar curso');
		}
	}

	async function handleCursoCreado() {
		showSuccess('Curso creado exitosamente');
		await cargarGestiones();
		await cargarCursos();
	}

	async function handleCursoEditado() {
		showSuccess('Curso actualizado exitosamente');
		await cargarGestiones();
		await cargarCursos();
	}

	function handleDetallesCerrado() {
		mostrarDetalles = false;
		cursoSeleccionado = null;
	}

	function handleEditarDesdeDetalles(curso: CursoResponse) {
		cursoSeleccionado = curso;
		mostrarEditar = true;
	}

	async function handleGestionCopiada(gestionDestino: string) {
		// Recargar gestiones y cambiar filtro a la gestión destino
		await cargarGestiones();
		gestionSeleccionada = gestionDestino;
		await cargarCursos();
		showSuccess(`Cursos copiados a la gestión ${gestionDestino}`);
	}

	// ==================== CICLO DE VIDA ====================
	onMount(async () => {
		await cargarGestiones();
		await cargarCursos();
	});
</script>

<div class="cursos-page">
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
			<h1>{@html getIconSvg('book-open')} Gestión de Cursos</h1>
			<p class="subtitle">Administra los cursos del sistema educativo</p>
		</div>
		<div class="header-right">
			<button class="btn btn-purple" onclick={() => (mostrarCopiarGestion = true)}>
				{@html getIconSvg('copy')}
				Crear Cursos de Nueva Gestión
			</button>
			<button class="btn btn-primary" onclick={() => (mostrarNuevo = true)}>
				{@html getIconSvg('plus')}
				Nuevo Curso
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<div class="filters">
		<!-- Búsqueda -->
		<div class="filter-group flex-1">
			<div class="search-box">
				{@html getIconSvg('search')}
				<input
					type="text"
					placeholder="Buscar por nombre de curso..."
					bind:value={searchQuery}
				/>
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
	</div>

	<!-- Contenido -->
	<div class="content">
		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Cargando cursos...</p>
			</div>
		{:else if cursosFiltrados.length === 0}
			<div class="empty-state">
				{@html getIconSvg('book-open')}
				<h3>No se encontraron cursos</h3>
				<p>Intenta ajustar los filtros o crea un nuevo curso</p>
				<button class="btn btn-primary" onclick={() => (mostrarNuevo = true)}>
					{@html getIconSvg('plus')}
					Crear Primer Curso
				</button>
			</div>
		{:else}
			<div class="cursos-list">
				{#each cursosFiltrados as curso (curso.id)}
					<div class="curso-card">
						<div class="card-avatar" style="background-color: {getAvatarColor(curso)}">
							{getInitials(curso)}
						</div>
						<div class="card-info">
							<h3>{curso.nombre}</h3>
							<div class="card-badges">
								<span
									class="badge badge-nivel"
									style="background-color: {getNivelColor(curso.nivel_educativo)}"
								>
									{curso.nivel_educativo}
								</span>
								<span class="badge badge-gestion">Gestión {curso.gestion}</span>
							</div>
						</div>
						<div class="card-actions">
							<button class="btn btn-sm btn-info" onclick={() => handleVerCurso(curso)}>
								{@html getIconSvg('eye')}
								Ver
							</button>
							<button class="btn btn-sm btn-primary" onclick={() => handleEditarCurso(curso)}>
								{@html getIconSvg('edit')}
								Editar
							</button>
							<button class="btn btn-sm btn-danger" onclick={() => handleEliminarCurso(curso)}>
								{@html getIconSvg('trash')}
								Eliminar
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
	<CreateCurso
		onClose={() => (mostrarNuevo = false)}
		onSuccess={handleCursoCreado}
	/>
{/if}

{#if mostrarEditar && cursoSeleccionado}
	<EditarCurso
		curso={cursoSeleccionado}
		onClose={() => {
			mostrarEditar = false;
			cursoSeleccionado = null;
		}}
		onSuccess={handleCursoEditado}
	/>
{/if}

{#if mostrarDetalles && cursoSeleccionado}
	<DetallesCurso
		cursoId={cursoSeleccionado.id}
		onClose={handleDetallesCerrado}
		onEdit={handleEditarDesdeDetalles}
		onDeleted={async () => {
			mostrarDetalles = false;
			showSuccess('Curso eliminado exitosamente');
			await cargarCursos();
		}}
	/>
{/if}

{#if mostrarCopiarGestion}
	<CopiarGestion
		onClose={() => (mostrarCopiarGestion = false)}
		onSuccess={handleGestionCopiada}
		onError={showError}
	/>
{/if}

<style>
	.cursos-page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Alertas */
	.alert {
		display: flex;
		align-items: center;
		padding: 0.875rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		position: relative;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
	}

	.alert-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
	}

	.alert-success {
		background: #d1fae5;
		color: #065f46;
	}

	.alert-success .alert-bar {
		background: #10b981;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
	}

	.alert-error .alert-bar {
		background: #ef4444;
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
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	.header-left h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.header-left h1 :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: #6b7280;
		margin: 0;
	}

	.header-right {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
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
		background: #27C5DA;
		color: white;
	}

	.btn-primary:hover {
		background: #22b0c4;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(39, 197, 218, 0.4);
	}

	.btn-purple {
		background: #7c3aed;
		color: white;
	}

	.btn-purple:hover {
		background: #6d28d9;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
	}

	.btn-info {
		background: #27C5DA;
		color: white;
	}

	.btn-info:hover {
		background: #22b0c4;
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover {
		background: #dc2626;
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
		min-width: 200px;
	}

	.flex-1 {
		flex: 1;
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
		width: 1.125rem;
		height: 1.125rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-box input,
	.select-wrapper select {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #374151;
		background: white;
		transition: all 0.2s;
	}

	.search-box input:focus,
	.select-wrapper select:focus {
		outline: none;
		border-color: #27C5DA;
		box-shadow: 0 0 0 3px rgba(39, 197, 218, 0.1);
	}

	/* Contenido */
	.content {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 4px solid #e5e7eb;
		border-top-color: #27C5DA;
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

	/* Lista de cursos */
	.cursos-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.curso-card {
		display: flex;
		align-items: center;
		padding: 1.25rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		transition: all 0.2s;
		position: relative;
	}

	.curso-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: #27C5DA;
		border-radius: 12px 0 0 12px;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.curso-card:hover {
		background: #e0f7fa;
		border-color: #27C5DA;
		box-shadow: 0 4px 12px rgba(39, 197, 218, 0.15);
	}

	.curso-card:hover::before {
		opacity: 1;
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
	}

	.card-info h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
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
		color: white;
	}

	.badge-nivel {
		/* Color dinámico desde el estilo inline */
	}

	.badge-gestion {
		background: #6b7280;
		color: white;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		margin-left: 1rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.cursos-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-right {
			width: 100%;
		}

		.filters {
			flex-direction: column;
		}

		.curso-card {
			flex-wrap: wrap;
		}

		.card-actions {
			width: 100%;
			margin-left: 0;
			margin-top: 1rem;
			justify-content: flex-end;
		}
	}
</style>
