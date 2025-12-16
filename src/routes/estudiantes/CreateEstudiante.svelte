<script lang="ts">
	import { getIconSvg } from '$lib/components/svg.js';
	import { estudiantesService, type EstudianteCreateDTO } from '$lib/services/estudiantes';

	interface Props {
		onClose: () => void;
		onSuccess: () => void;
	}

	let { onClose, onSuccess }: Props = $props();

	let formData: EstudianteCreateDTO = {
		nombres: '',
		apellido_paterno: '',
		apellido_materno: '',
		ci: '',
		fecha_nacimiento: '',
		direccion: '',
		estado: 'Activo',
		nombre_padre: '',
		apellido_paterno_padre: '',
		apellido_materno_padre: '',
		telefono_padre: '',
		nombre_madre: '',
		apellido_paterno_madre: '',
		apellido_materno_madre: '',
		telefono_madre: ''
	};

	let isSubmitting = false;
	let errorMessage = '';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';

		try {
			await estudiantesService.createEstudiante(formData);
			onSuccess();
		} catch (error: any) {
			errorMessage = error.message || 'Error al crear el estudiante';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<div class="modal-overlay" onclick={handleOverlayClick}>
	<div class="modal-content">
		<div class="modal-header">
			<h2>{@html getIconSvg('user-plus')} Nuevo Estudiante</h2>
			<button class="btn-close" onclick={onClose}>
				{@html getIconSvg('x')}
			</button>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="modal-body">
				{#if errorMessage}
					<div class="alert alert-error">
						{errorMessage}
					</div>
				{/if}

				<!-- Sección 1: Datos Personales -->
				<div class="form-section">
					<h3 class="section-title">Datos Personales del Estudiante</h3>
					<div class="form-grid">
						<div class="form-group">
							<label for="ci">Cédula de Identidad (CI)</label>
							<input
								type="text"
								id="ci"
								placeholder="Ej: 12345678"
								bind:value={formData.ci}
							/>
						</div>

						<div class="form-group">
							<label for="nombres">
								Nombres <span class="required">*</span>
							</label>
							<input
								type="text"
								id="nombres"
								placeholder="Ej: Juan Carlos"
								bind:value={formData.nombres}
								required
							/>
						</div>

						<div class="form-group">
							<label for="apellido_paterno">
								Apellido Paterno <span class="required">*</span>
							</label>
							<input
								type="text"
								id="apellido_paterno"
								placeholder="Ej: Pérez"
								bind:value={formData.apellido_paterno}
								required
							/>
						</div>

						<div class="form-group">
							<label for="apellido_materno">
								Apellido Materno <span class="required">*</span>
							</label>
							<input
								type="text"
								id="apellido_materno"
								placeholder="Ej: González"
								bind:value={formData.apellido_materno}
								required
							/>
						</div>

						<div class="form-group">
							<label for="fecha_nacimiento">Fecha de Nacimiento</label>
							<input
								type="date"
								id="fecha_nacimiento"
								bind:value={formData.fecha_nacimiento}
							/>
						</div>

						<div class="form-group full-width">
							<label for="direccion">Dirección</label>
							<input
								type="text"
								id="direccion"
								placeholder="Ej: Av. Principal #123"
								bind:value={formData.direccion}
							/>
						</div>
					</div>
				</div>

				<!-- Sección 2: Información del Padre -->
				<div class="form-section">
					<h3 class="section-title">Información del Padre</h3>
					<div class="form-grid">
						<div class="form-group">
							<label for="nombre_padre">Nombre del Padre</label>
							<input
								type="text"
								id="nombre_padre"
								placeholder="Ej: Carlos"
								bind:value={formData.nombre_padre}
							/>
						</div>

						<div class="form-group">
							<label for="apellido_paterno_padre">Apellido Paterno del Padre</label>
							<input
								type="text"
								id="apellido_paterno_padre"
								placeholder="Ej: Pérez"
								bind:value={formData.apellido_paterno_padre}
							/>
						</div>

						<div class="form-group">
							<label for="apellido_materno_padre">Apellido Materno del Padre</label>
							<input
								type="text"
								id="apellido_materno_padre"
								placeholder="Ej: López"
								bind:value={formData.apellido_materno_padre}
							/>
						</div>

						<div class="form-group">
							<label for="telefono_padre">Teléfono del Padre</label>
							<input
								type="tel"
								id="telefono_padre"
								placeholder="Ej: 70123456"
								bind:value={formData.telefono_padre}
							/>
						</div>
					</div>
				</div>

				<!-- Sección 3: Información de la Madre -->
				<div class="form-section">
					<h3 class="section-title">Información de la Madre</h3>
					<div class="form-grid">
						<div class="form-group">
							<label for="nombre_madre">Nombre de la Madre</label>
							<input
								type="text"
								id="nombre_madre"
								placeholder="Ej: María"
								bind:value={formData.nombre_madre}
							/>
						</div>

						<div class="form-group">
							<label for="apellido_paterno_madre">Apellido Paterno de la Madre</label>
							<input
								type="text"
								id="apellido_paterno_madre"
								placeholder="Ej: González"
								bind:value={formData.apellido_paterno_madre}
							/>
						</div>

						<div class="form-group">
							<label for="apellido_materno_madre">Apellido Materno de la Madre</label>
							<input
								type="text"
								id="apellido_materno_madre"
								placeholder="Ej: Ruiz"
								bind:value={formData.apellido_materno_madre}
							/>
						</div>

						<div class="form-group">
							<label for="telefono_madre">Teléfono de la Madre</label>
							<input
								type="tel"
								id="telefono_madre"
								placeholder="Ej: 70654321"
								bind:value={formData.telefono_madre}
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" onclick={onClose} disabled={isSubmitting}>
					Cancelar
				</button>
				<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="spinner-sm"></span>
						Guardando...
					{:else}
						{@html getIconSvg('save')}
						Guardar Estudiante
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

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
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.modal-header h2 :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.btn-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #6b7280;
		transition: color 0.2s;
	}

	.btn-close:hover {
		color: #1f2937;
	}

	.btn-close :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.alert {
		padding: 0.875rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border-left: 4px solid #ef4444;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
	}

	.form-group input {
		padding: 0.625rem 0.875rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
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

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-secondary {
		background: white;
		color: #4b5563;
		border: 1px solid #e5e7eb;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f9fafb;
	}

	.spinner-sm {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.modal-content {
			max-width: 100%;
			max-height: 95vh;
		}
	}
</style>
