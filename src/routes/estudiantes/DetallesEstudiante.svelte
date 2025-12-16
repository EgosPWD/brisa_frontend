<script lang="ts">
	import { onMount } from 'svelte';
	import { getIconSvg } from '$lib/components/svg.js';
	import { estudiantesService, type EstudianteResponse } from '$lib/services/estudiantes';

	interface Props {
		estudianteId: number;
		onClose: () => void;
		onEdit: (estudiante: EstudianteResponse) => void;
		onEstadoChanged: () => void;
	}

	let { estudianteId, onClose, onEdit, onEstadoChanged }: Props = $props();

	let estudiante = $state<EstudianteResponse | null>(null);
	let isLoading = $state(true);
	let showEstadoMenu = $state(false);
	let showConfirmDialog = $state(false);
	let nuevoEstado = $state('');

	const estadosConfig = {
		Activo: { color: '#10b981', label: 'Activo' },
		Retirado: { color: '#ef4444', label: 'Retirado' },
		Abandono: { color: '#f59e0b', label: 'Abandono' }
	};

	function getFullName(e: EstudianteResponse): string {
		return `${e.nombres} ${e.apellido_paterno} ${e.apellido_materno}`.trim();
	}

	function getInitials(e: EstudianteResponse): string {
		const ap = e.apellido_paterno?.[0] || '';
		const n = e.nombres.split(' ')[0]?.[0] || '';
		return (ap + n).toUpperCase() || '?';
	}

	function getAvatarColor(e: EstudianteResponse): string {
		const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
		return colors[e.id % colors.length];
	}

	function formatDate(dateString?: string): string {
		if (!dateString) return 'No especificado';
		const date = new Date(dateString);
		const months = [
			'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
			'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
		];
		return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
	}

	function getNivelColor(nivel?: string): string {
		if (!nivel) return '#6b7280';
		const colors: Record<string, string> = {
			'Inicial': '#FF9800',
			'Primaria': '#3AC0B8',
			'Secundaria': '#7A95D9'
		};
		return colors[nivel] || '#6b7280';
	}

	function generateEmail(nombre: string, apellido: string): string {
		return `${nombre.toLowerCase()}.${apellido.toLowerCase()}@colegio.edu.bo`;
	}

	function handleEstadoMenuToggle() {
		showEstadoMenu = !showEstadoMenu;
	}

	function handleEstadoClick(estado: string) {
		nuevoEstado = estado;
		showEstadoMenu = false;
		showConfirmDialog = true;
	}

	async function handleConfirmEstado() {
		if (!estudiante || !nuevoEstado) return;

		try {
			await estudiantesService.cambiarEstado(estudiante.id, nuevoEstado);
			showConfirmDialog = false;
			onEstadoChanged();
		} catch (error: any) {
			console.error('Error al cambiar estado:', error);
			alert('Error al cambiar el estado del estudiante');
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	onMount(async () => {
		console.log('onMount ejecutándose, isLoading:', isLoading);
		try {
			console.log('Llamando a getEstudiante con ID:', estudianteId);
			const data = await estudiantesService.getEstudiante(estudianteId);
			console.log('Datos recibidos:', data);
			console.log('Cursos del estudiante:', data.cursos);
			estudiante = data;
			console.log('Estudiante asignado:', estudiante);
			console.log('Cambiando isLoading a false');
			isLoading = false;
			console.log('isLoading después:', isLoading);
		} catch (error: any) {
			console.error('Error al cargar estudiante:', error);
			alert(`Error al cargar los datos del estudiante: ${error.message || 'Error desconocido'}`);
			isLoading = false;
		}
	});
</script>

<div class="modal-overlay" onclick={handleOverlayClick}>
	<div class="modal-content">
		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Cargando información del estudiante...</p>
			</div>
		{:else if estudiante}
			<!-- Header -->
			<div class="modal-header">
				<div class="header-left">
					<h2>Ficha del Estudiante</h2>
					<span class="estado-badge" style="background-color: {estadosConfig[estudiante.estado]?.color || '#6b7280'}">
						{estudiante.estado}
					</span>
				</div>
				<div class="header-right">
					<button class="btn btn-primary" onclick={() => onEdit(estudiante!)}>
						{@html getIconSvg('edit')}
						Editar
					</button>
					<div class="estado-menu-wrapper">
						<button class="btn btn-secondary" onclick={handleEstadoMenuToggle}>
							{@html getIconSvg('refresh-cw')}
							Cambiar Estado
						</button>
						{#if showEstadoMenu}
							<div class="estado-menu">
								<button onclick={() => handleEstadoClick('Activo')}>
									<span class="status-dot" style="background-color: #10b981"></span>
									Activo
								</button>
								<button onclick={() => handleEstadoClick('Retirado')}>
									<span class="status-dot" style="background-color: #ef4444"></span>
									Retirado
								</button>
								<button onclick={() => handleEstadoClick('Abandono')}>
									<span class="status-dot" style="background-color: #f59e0b"></span>
									Abandono
								</button>
							</div>
						{/if}
					</div>
					<button class="btn btn-icon" onclick={onClose}>
						{@html getIconSvg('x')}
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="modal-body">
				<div class="content-grid">
					<!-- Columna Izquierda -->
					<div class="left-column">
						<!-- Perfil -->
						<div class="card">
							<div class="profile-avatar" style="background-color: {getAvatarColor(estudiante)}; border-color: {getAvatarColor(estudiante)}">
								{getInitials(estudiante)}
							</div>
							<h3>{getFullName(estudiante)}</h3>
							{#if estudiante.cursos && estudiante.cursos.length > 0}
								<p class="profile-subtitle">
									{estudiante.cursos[0].nombre} - {estudiante.cursos[0].nivel_educativo}
								</p>
							{/if}
						</div>

						<!-- Contacto -->
						<div class="card">
							<h4>{@html getIconSvg('mail')} Contacto</h4>
							<div class="contact-item">
								{@html getIconSvg('mail')}
								<div>
									<span class="label">Email</span>
									<span class="value">{generateEmail(estudiante.nombres.split(' ')[0], estudiante.apellido_paterno)}</span>
								</div>
							</div>
							{#if estudiante.telefono_padre || estudiante.telefono_madre}
								<div class="contact-item">
									{@html getIconSvg('phone')}
									<div>
										<span class="label">Teléfono</span>
										<span class="value">{estudiante.telefono_padre || estudiante.telefono_madre}</span>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Columna Derecha -->
					<div class="right-column">
						<!-- Datos Personales -->
						<div class="info-section">
							<h4>Datos Personales</h4>
							<div class="info-grid">
								<div class="info-item">
									<span class="label">Fecha de Nacimiento</span>
									<span class="value">{formatDate(estudiante.fecha_nacimiento)}</span>
								</div>
								<div class="info-item">
									<span class="label">CI/CURP</span>
									<span class="value">{estudiante.ci || 'No especificado'}</span>
								</div>
								<div class="info-item full-width">
									<span class="label">Dirección</span>
									<span class="value">{estudiante.direccion || 'No especificado'}</span>
								</div>
								<div class="info-item">
									<span class="label">Cursos Asignados</span>
									<span class="value">{estudiante.cursos?.length || 0}</span>
								</div>
							</div>
						</div>

						<!-- Información del Padre -->
						<div class="info-section">
							<h4>Información del Padre</h4>
							<div class="info-grid">
								<div class="info-item full-width">
									<span class="label">Nombre Completo</span>
									<span class="value">
										{estudiante.nombre_padre || ''} {estudiante.apellido_paterno_padre || ''} {estudiante.apellido_materno_padre || ''} 
										{#if !estudiante.nombre_padre && !estudiante.apellido_paterno_padre}
											No especificado
										{/if}
									</span>
								</div>
								<div class="info-item">
									<span class="label">Teléfono</span>
									<span class="value">{estudiante.telefono_padre || 'No especificado'}</span>
								</div>
								{#if estudiante.nombre_padre}
									<div class="info-item">
										<span class="label">Email</span>
										<span class="value">{generateEmail(estudiante.nombre_padre, estudiante.apellido_paterno_padre || 'padre')}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Información de la Madre -->
						<div class="info-section">
							<h4>Información de la Madre</h4>
							<div class="info-grid">
								<div class="info-item full-width">
									<span class="label">Nombre Completo</span>
									<span class="value">
										{estudiante.nombre_madre || ''} {estudiante.apellido_paterno_madre || ''} {estudiante.apellido_materno_madre || ''}
										{#if !estudiante.nombre_madre && !estudiante.apellido_paterno_madre}
											No especificado
										{/if}
									</span>
								</div>
								<div class="info-item">
									<span class="label">Teléfono</span>
									<span class="value">{estudiante.telefono_madre || 'No especificado'}</span>
								</div>
								{#if estudiante.nombre_madre}
									<div class="info-item">
										<span class="label">Email</span>
										<span class="value">{generateEmail(estudiante.nombre_madre, estudiante.apellido_paterno_madre || 'madre')}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Cursos -->
						{#if estudiante.cursos && estudiante.cursos.length > 0}
							<div class="info-section">
								<h4>Cursos Asignados ({estudiante.cursos.length})</h4>
								<div class="cursos-list">
									{#each estudiante.cursos as curso}
										<div class="curso-badge">
											{@html getIconSvg('book-open')}
											<div class="curso-content">
												<span class="curso-nombre">
													{curso.nombre_curso || curso.nombre || curso.curso || 'Curso sin nombre'}
												</span>
												<span class="curso-info">
													{#if curso.nivel_educativo || curso.nivel}
														<span class="nivel-badge" style="background-color: {getNivelColor(curso.nivel_educativo || curso.nivel)}">
															{curso.nivel_educativo || curso.nivel}
														</span>
													{/if}
													{#if curso.gestion}
														<span class="gestion-text">Gestión {curso.gestion}</span>
													{/if}
												</span>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Diálogo de confirmación -->
{#if showConfirmDialog}
	<div class="confirm-overlay" onclick={() => (showConfirmDialog = false)}>
		<div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
			<h3>Confirmar Cambio de Estado</h3>
			<p>¿Está seguro de cambiar el estado de <strong>{estudiante ? getFullName(estudiante) : ''}</strong> a <strong>{nuevoEstado}</strong>?</p>
			<div class="confirm-actions">
				<button class="btn btn-secondary" onclick={() => (showConfirmDialog = false)}>
					Cancelar
				</button>
				<button class="btn btn-primary" onclick={handleConfirmEstado}>
					Confirmar
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
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
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 1200px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.loading {
		padding: 4rem 2rem;
		text-align: center;
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
		to { transform: rotate(360deg); }
	}

	/* Header */
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-left h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.estado-badge {
		padding: 0.375rem 0.875rem;
		border-radius: 9999px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.header-right {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

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
	}

	.btn-secondary {
		background: white;
		color: #4b5563;
		border: 1px solid #e5e7eb;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	.btn-icon {
		background: none;
		border: none;
		padding: 0.5rem;
		color: #6b7280;
	}

	.btn-icon:hover {
		color: #1f2937;
	}

	/* Estado Menu */
	.estado-menu-wrapper {
		position: relative;
	}

	.estado-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 10;
		min-width: 200px;
	}

	.estado-menu button {
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: #374151;
		transition: background 0.2s;
	}

	.estado-menu button:hover {
		background: #f9fafb;
	}

	.status-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
	}

	/* Body */
	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 1.5rem;
	}

	/* Columna Izquierda */
	.left-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.profile-avatar {
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 2rem;
		font-weight: 700;
		margin: 0 auto 1rem;
		border: 4px solid;
	}

	.card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.profile-subtitle {
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.card h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.card h4 :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
	}

	.contact-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
		margin-bottom: 0.5rem;
	}

	.contact-item :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		color: #6b7280;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.contact-item div {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.contact-item .label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 600;
		text-transform: uppercase;
	}

	.contact-item .value {
		font-size: 0.875rem;
		color: #1f2937;
	}

	/* Columna Derecha */
	.right-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.info-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.info-section h4 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
	}

	.info-item.full-width {
		grid-column: 1 / -1;
	}

	.info-item .label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 600;
		text-transform: uppercase;
		margin-bottom: 0.25rem;
	}

	.info-item .value {
		font-size: 0.875rem;
		color: #1f2937;
	}

	/* Cursos */
	.cursos-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.curso-badge {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem;
		background: #dbeafe;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
	}

	.curso-badge :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
		color: #3b82f6;
		flex-shrink: 0;
	}

	.curso-badge div {
		display: flex;
		flex-direction: column;
	}

	.curso-nombre {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.875rem;
	}

	.curso-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.nivel-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		color: white;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.gestion-text {
		color: #6b7280;
		font-size: 0.75rem;
	}

	/* Confirm Dialog */
	.confirm-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
	}

	.confirm-dialog {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		max-width: 400px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.confirm-dialog h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.confirm-dialog p {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.confirm-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	@media (max-width: 968px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
